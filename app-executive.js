
App.renderDashboardData = function() {
    if (!AppDB.data || !AppDB.data.assignments) return;
    
    const currentMonthFilter = document.getElementById("filterAuditMonth").value;
    const currentStatusFilter = document.getElementById("filterAssignmentStatus").value;
    const tableBody = document.getElementById("tableAssignmentsBody");
    const monitorContainer = document.getElementById("monitorContainer");
    
    if (!tableBody) return;
    tableBody.innerHTML = "";
    
    // CAPTURA MEJORADA DE IDENTIDAD CORPORATIVA DIRECTA DE LA INTERFAZ
    let activeUsername = "admin";
    if (App.currentUser && App.currentUser.username) {
        activeUsername = App.currentUser.username;
    } else {
        // Extracción de emergencia desde el encabezado visual si el objeto global está vacío
        const headerUserElement = document.querySelector(".header-user-info h2, h2");
        if (headerUserElement) {
            const headerText = headerUserElement.innerText.toLowerCase();
            if (headerText.includes("arturo") || headerText.includes("valero")) {
                activeUsername = "ccavalero"; // Forzar el ID técnico exacto visible en pantalla
            }
        }
    }
    
    const userRole = App.currentUser ? App.currentUser.role : "Gerente";
    const roleMeta = (AppDB.data.roles && AppDB.data.roles[userRole]) ? AppDB.data.roles[userRole] : { lvl: 4 };
    const userLevel = typeof roleMeta.lvl !== 'undefined' ? roleMeta.lvl : 4;
    const isSupervisor = (activeUsername === "admin" || activeUsername === "ccavalero" || userLevel >= 2);

    let globalProcessedSum = 0; 
    let individualProcessedSum = 0; 
    let totalWarning = 0;
    let totalDanger = 0;
    let metaTotalCount = 0;
    let processedTotalCount = 0;
    let monitorHtml = "";
    const now = new Date();

    var assignmentsData = AppDB.data.assignments;
    var assignmentsArray = Array.isArray(assignmentsData) ? assignmentsData : Object.values(assignmentsData);

    assignmentsArray.forEach(function(item, index) {
        if (!item) return;

        // FILTRADO DE SEGURIDAD OPERATIVA
        if (!isSupervisor && item.assignedTo !== activeUsername) return;

        // Filtrado de calendario mensual
        if (currentMonthFilter !== "all" && currentMonthFilter !== "current") {
            const itemDate = new Date(item.createdAt || item.timestamp);
            if ((itemDate.getMonth() + 1).toString() !== currentMonthFilter) return;
        }

        let timeRemainingStr = " Evaluando...";
        let statusClass = "pending";
        let cardAlertClass = "bg-total";

        const itemMeta = parseInt(item.meta || item.target || 0);
        const itemProcessed = parseInt(item.processed || item.realizadas || 0);
        
        // CORRECCIÓN LÓGICA DE DETECCIÓN: Removemos el símbolo @ y limpiamos espacios vacíos
        let taskOwner = String(item.assignedTo || item.createdBy || "").trim().toLowerCase();
        taskOwner = taskOwner.replace("@", ""); // Elimina el arroba si viene desde Firebase
        
        let cleanActiveUser = String(activeUsername).trim().toLowerCase();
        cleanActiveUser = cleanActiveUser.replace("@", "");

        // ACUMULADORES MATEMÁTICOS DE VOLUMEN NETO DE GESTIONES
        globalProcessedSum += itemProcessed;
        
        // Comparación corregida e inmune a discrepancias de texto
        if (taskOwner === cleanActiveUser || (cleanActiveUser === "admin" && taskOwner === "admin")) {
            individualProcessedSum += itemProcessed; // Sumará el número neto (ej: 3, 85, 10172)
        }

        if (item.status === "completed" || itemProcessed >= itemMeta && itemMeta > 0) {
            timeRemainingStr = " Culminada";
            statusClass = "completed";
            processedTotalCount += itemProcessed;
            metaTotalCount += itemMeta;
        } else {
            const deadline = new Date(item.deadline || item.timeEnd);
            const diffMs = deadline - now;
            const diffMin = Math.ceil(diffMs / 60000);
            
            metaTotalCount += itemMeta;
            processedTotalCount += itemProcessed;

            if (diffMin <= 0) {
                timeRemainingStr = " Vencida";
                statusClass = "expired";
                cardAlertClass = "bg-danger";
                totalDanger++;
            } else if (diffMin <= 30) {
                timeRemainingStr = ` ${diffMin} min`;
                statusClass = "warning";
                cardAlertClass = "bg-warning";
                totalWarning++;
            } else {
                const hours = Math.floor(diffMin / 60);
                const mins = diffMin % 60;
                timeRemainingStr = ` ${hours}h ${mins}m`;
                statusClass = "pending";
            }
        }

        if (currentStatusFilter !== "all" && currentStatusFilter !== statusClass) return;

        var mailButtonHtml = item.mailUrl ? `
            <a href="${item.mailUrl}" target="_blank" class="btn-secondary" style="padding:4px 8px; margin-right:4px; text-decoration:none; font-size:11px; font-weight:bold; background:#f0fdf4; border:1px solid #16a34a; color:#16a34a; border-radius:4px;">✉️ Zoho Mail</a>
        ` : "";

        const ownerLabel = isSupervisor ? `<br><small style="color:#2563eb; font-weight:600;">👤 @${item.assignedTo || 'S/A'}</small>` : "";

        let tr = document.createElement("tr");
        tr.className = `status-row-${statusClass}`;
        tr.innerHTML = `
            <td><b>${item.name || item.title || 'Ticket'}</b>${ownerLabel}</td>
            <td class="text-center font-bold">${itemMeta}</td>
            <td class="text-center">${itemProcessed}</td>
            <td class="text-center"><span class="badge-reference">${item.reference || "S/R"}</span></td>
            <td class="text-center"><span class="time-label-${statusClass}">${timeRemainingStr}</span></td>
            <td class="text-center">
                ${mailButtonHtml}
                <button onclick="App.openUpdateProgressModal(${index})" class="btn-secondary">Progreso</button>
            </td>
        `;
        tableBody.appendChild(tr);

        if (statusClass === "expired" || statusClass === "warning") {
            monitorHtml += `
            <div class="counter-card ${cardAlertClass} monitor-alert-item">
                <p class="alert-item-title"> ALERTA OPERACIONAL</p>
                <p class="alert-item-body">La actividad <b>${item.name || item.title}</b> de <b>@${item.assignedTo}</b> está crítica.</p>
            </div>`;
        }
    });

    // INYECCIÓN DE VALORES NETOS FORMATEADOS CON PUNTOS DE MILES
    document.getElementById("countTotal").innerText = globalProcessedSum.toLocaleString("es-VE");
    
    const labelTotal = document.getElementById("labelTotalRealizadas");
    const cardIndiv = document.getElementById("cardIndividualProduction");
    
    if (isSupervisor) {
        if (labelTotal) labelTotal.innerText = "Gestiones Totales Equipo";
        if (cardIndiv) {
            cardIndiv.classList.remove("hidden");
            document.getElementById("countIndividual").innerText = individualProcessedSum.toLocaleString("es-VE");
        }
    } else {
        if (labelTotal) labelTotal.innerText = "Mis Gestiones Procesadas";
        if (cardIndiv) cardIndiv.classList.add("hidden");
    }

    document.getElementById("countWarning").innerText = totalWarning;
    document.getElementById("countDanger").innerText = totalDanger;
    
    let ied = 0;
    if (metaTotalCount > 0) {
        ied = Math.round((processedTotalCount / metaTotalCount) * 100);
    }
    document.getElementById("countPerformance").innerText = `${ied}%`;
    
    if (monitorContainer) {
        monitorContainer.innerHTML = monitorHtml || `<p class="monitor-empty-text">Cero alertas. Operación bajo parámetros normales.</p>`;
    }
};
/**
* SISTEMA DE CONTROL DE GESTIONES - MOTOR EJECUTIVO VISUAL (app-executive.js)
* PARTE 2 DE 3: PROGRESO DE ACTIVIDADES, ACTUALIZACIÓN DE LOGS Y REPORTES CONSOLIDADOS
*/

App.openUpdateProgressModal = function(index) {
    const item = AppDB.data.assignments[index];
    if (!item) return;

    const itemMeta = parseInt(item.meta || item.target || 0);
    const itemProcessed = parseInt(item.processed || 0);

    document.getElementById("modalOverlay").classList.remove("hidden");
    document.getElementById("modalContent").innerHTML = `
        <div class="modal-inner-header">
            <h3>Actualizar Progreso de Actividad</h3>
            <button onclick="document.getElementById('modalOverlay').classList.add('hidden')">&times;</button>
        </div>
        <div class="admin-config-card">
            <p class="modal-text-bold"><b>Actividad:</b> ${item.name || item.title}</p>
            <p class="modal-text-muted"><b>Meta total asignada:</b> ${itemMeta} unidades.</p>
            <p class="modal-text-muted-spacer"><b>Procesadas actuales:</b> ${itemProcessed} unidades.</p>
            <div class="form-group">
                <label>Cantidad Adicional Procesada</label>
                <div class="input-inline-row">
                    <input type="number" id="inputAddQty" class="form-control" placeholder="Ej: 5" min="1">
                    <button onclick="App.executeUpdateProgress(${index})" class="btn-primary">Sumar</button>
                </div>
            </div>
            <div class="modal-action-row-footer" style="margin-top: 15px;">
                <button onclick="App.markAssignmentAsCompleted(${index})" class="btn-primary btn-success-finish" style="width: 100%; background: #16a34a; color: white; border: none; padding: 10px; font-weight: bold; border-radius: 4px; cursor: pointer;"> Culminar Actividad</button>
            </div>
        </div>
    `;
};

App.executeUpdateProgress = function(index) {
    const qtyInput = document.getElementById("inputAddQty");
    if (!qtyInput) return;
    
    const addQty = parseInt(qtyInput.value);
    if (isNaN(addQty) || addQty <= 0) {
        return alert("Por favor, ingrese una cantidad numérica superior a cero.");
    }
    
    const item = AppDB.data.assignments[index];
    const itemMeta = parseInt(item.meta || item.target || 0);
    const newProcessed = parseInt(item.processed || 0) + addQty;

    if (newProcessed > itemMeta) {
        return alert("Operación rechazada: La cantidad procesada no puede superar la meta asignada.");
    }
    
    item.processed = newProcessed;
    if (item.processed === itemMeta) {
        item.status = "completed";
    }
    
    AppDB.save();
    
    var operarioLog = App.currentUser ? App.currentUser.username : "sistema";
    AppDB.addLog(operarioLog, "INCREMENTO_META", `Sumó ${addQty} a la actividad: ${item.name || item.title}`);
    
    document.getElementById("modalOverlay").classList.add("hidden");
    alert("Progreso sincronizado de forma exitosa en la nube.");
    App.renderDashboardData();
};

App.markAssignmentAsCompleted = function(index) {
    const item = AppDB.data.assignments[index];
    const itemMeta = parseInt(item.meta || item.target || 0);
    
    item.status = "completed";
    item.processed = itemMeta;
    
    AppDB.save();
    
    var operarioLog = App.currentUser ? App.currentUser.username : "sistema";
    AppDB.addLog(operarioLog, "CULMINAR_TAREA", `Marcó como completada: ${item.name || item.title}`);
    
    document.getElementById("modalOverlay").classList.add("hidden");
    alert("Actividad guardada en estado culminado.");
    App.renderDashboardData();
};

/* =========================================================================
   MÓDULO DE REPORTES AUDITABLES EN ALTA DENSIDAD (v2.02) - PARTE 1 DE 2
   ========================================================================= */
App.openReportsMenu = function() {
    if (!AppDB.data || !AppDB.data.assignments) {
        return alert("❌ Error: No existen datos operativos para consolidar el reporte.");
    }

    // Desplegar el modal general del esqueleto de la aplicación
    document.getElementById("modalOverlay").classList.remove("hidden");

    // Inyectar el panel de opciones de reportes conectado al motor cronológico
    document.getElementById("modalContent").innerHTML = `
        <div class="modal-inner-header">
            <h3>📊 Centro de Reportería y Auditoría Corporativa</h3>
            <button type="button" onclick="document.getElementById('modalOverlay').classList.add('hidden')">&times;</button>
        </div>
        
        <div class="admin-config-card" style="padding: 15px; background: #ffffff; border-radius: 6px; border: 1px solid #cbd5e1;">
            <div style="margin-bottom: 15px; text-align: center;">
                <h4 style="margin: 0; font-size: 14px; color: #1e3a8a; font-weight: bold;">Gerencia General de Adquirencia</h4>
                <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">Seleccione el rango temporal requerido para consolidar la totalización por actividades y metas.</p>
            </div>
            
            <!-- ENLACES DE ACCIÓN CRONOLÓGICA DE ALTA DENSIDAD -->
            <div style="display: flex; flex-direction: column; gap: 10px;">
                
                <!-- ACCIÓN 1: FILTRAR Y GENERAR REPORTE SEMANAL -->
                <button type="button" onclick="App.executeExportDataToPDF('SEMANAL')" class="btn-primary" style="width: 100%; padding: 12px; font-weight: bold; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; text-align: left;">
                    📅 Generar Corte Semanal Actual (Semana en Curso)
                </button>
                
                <!-- ACCIÓN 2: FILTRAR Y GENERAR REPORTE MENSUAL ACUMULADO -->
                <button type="button" onclick="App.executeExportDataToPDF('MENSUAL')" class="btn-primary" style="width: 100%; padding: 12px; font-weight: bold; background: #1e40af; color: white; border: none; border-radius: 4px; cursor: pointer; text-align: left;">
                    📈 Generar Corte Mensual Acumulado (Mes Activo)
                </button>
                
                <!-- ACCIÓN 3: FILTRAR Y GENERAR HISTÓRICO DE 6 MESES -->
                <button type="button" onclick="App.executeExportDataToPDF('HISTORICO')" class="btn-secondary" style="width: 100%; padding: 12px; font-weight: bold; background: #f8fafc; color: #1e3a8a; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer; text-align: left;">
                    🔎 Descargar Historial Retrospectivo Consolidado (Últimos 6 Meses)
                </button>
                
            </div>
            
            <div class="modal-action-row-footer" style="margin-top: 15px; border-top: 1px dashed #e2e8f0; padding-top: 10px;">
                <button type="button" onclick="document.getElementById('modalOverlay').classList.add('hidden')" class="btn-secondary-cancel" style="width: 100%; padding: 10px; font-weight: bold;">Cerrar Ventana</button>
            </div>
        </div>
    `;
};

/* =========================================================================
   MÓDULO DE REPORTES TEMPORALES CRONOLÓGICOS (v2.02) - PARTE 1 DE 2
   ========================================================================= */
App.executeExportDataToPDF = function(tipoReporte) {
    if (!AppDB.data || !AppDB.data.assignments) {
        return alert("❌ Error: No existen datos operativos para consolidar el reporte.");
    }

    // 1. Captura de Identidad del Auditor en Sesión
    const activeUsername = (App.currentUser && App.currentUser.username) ? App.currentUser.username : "admin";
    const userRole = App.currentUser ? App.currentUser.role : "Gerente";
    const userFullName = `${App.currentUser?.names || 'Arturo'} ${App.currentUser?.lastnames || 'Valero'}`;

    // 2. Establecer Parámetros Cronológicos Universitarios (Año Actual: 2026)
    const hoy = new Date();
    let fechaInicioFiltro = new Date(hoy.getFullYear(), hoy.getMonth(), 1); // Por defecto: Inicio del Mes
    let fechaFinFiltro = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59); // Fin del Mes

    // LÓGICA DE SEGMENTACIÓN TEMPORAL SEGÚN LA SOLICITUD DE LA GERENCIA
    if (tipoReporte === 'SEMANAL') {
        // Calcular el inicio (Lunes) y fin (Domingo) de la semana en curso
        const diaSemana = hoy.getDay(); 
        const diferenciaLunes = hoy.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1); 
        fechaInicioFiltro = new Date(hoy.setDate(diferenciaLunes));
        fechaInicioFiltro.setHours(0, 0, 0, 0);
        
        fechaFinFiltrow = new Date(fechaInicioFiltro);
        fechaFinFiltro = new Date(fechaFinFiltrow.setDate(fechaInicioFiltro.getDate() + 6));
        fechaFinFiltro.setHours(23, 59, 59, 999);
    } 
    else if (tipoReporte === 'HISTORICO') {
        // Retroceder exactamente 6 meses en el calendario para auditorías retrospectivas
        fechaInicioFiltro = new Date(hoy.getFullYear(), hoy.getMonth() - 6, 1);
        fechaInicioFiltro.setHours(0, 0, 0, 0);
    }
    // Nota: Si es 'MENSUAL', se mantiene por defecto el rango completo del mes activo

    // 3. Inicialización de Acumuladores de Cargas en Tres Niveles
    let teamTotalMeta = 0;
    let teamTotalProcessed = 0;
    let teamActivityCount = 0;

    let selfTotalMeta = 0;
    let selfTotalProcessed = 0;
    let selfActivityCount = 0;

    const assignmentsData = AppDB.data.assignments;
    const assignmentsArray = Array.isArray(assignmentsData) ? assignmentsData : Object.values(assignmentsData);
    let tableRowsHtml = "";

    // 4. Bucle Operacional con Filtro de Gobernanza Temporal Estricto
    assignmentsArray.forEach(function(item) {
        if (!item) return;

        // Extraer y validar la fecha de registro de la tarea desde Firebase
        const itemDate = new Date(item.createdAt || item.timestamp || hoy);
        
        // FILTRO CRONOLÓGICO: Si la tarea no pertenece al rango temporal solicitado, se descarta
        if (itemDate < fechaInicioFiltro || itemDate > fechaFinFiltro) return;

        const itemMeta = parseInt(item.meta || item.target || 0);
        const itemProcessed = parseInt(item.processed || item.realizadas || 0);
        
        const taskOwner = String(item.assignedTo || item.createdBy || "").trim().toLowerCase().replace("@", "");
        const cleanActiveUser = String(activeUsername).trim().toLowerCase().replace("@", "");

        // A) Acumulado del Equipo de Trabajo
        teamTotalMeta += itemMeta;
        teamTotalProcessed += itemProcessed;
        teamActivityCount++;

        // B) Acumulado de la Producción del Supervisor Logueado
        const isOwnTask = (taskOwner === cleanActiveUser || (cleanActiveUser === "admin" && taskOwner === "admin"));
        if (isOwnTask) {
            selfTotalMeta += itemMeta;
            selfTotalProcessed += itemProcessed;
            selfActivityCount++;
        }

        let statusText = "Pendiente";
        if (item.status === "completed" || itemProcessed >= itemMeta) statusText = "Culminada";

        tableRowsHtml += `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 6px; font-size: 11px; text-align: left;"><b>${item.name || item.title || 'Ticket'}</b><br><small style="color:#64748b;">📅 ${itemDate.toLocaleDateString("es-VE")} | 👤 @${item.assignedTo || 'S/A'}</small></td>
                <td style="padding: 6px; font-size: 11px; text-align: center; font-weight: bold;">${itemMeta.toLocaleString("es-VE")}</td>
                <td style="padding: 6px; font-size: 11px; text-align: center;">${itemProcessed.toLocaleString("es-VE")}</td>
                <td style="padding: 6px; font-size: 11px; text-align: center;"><span style="font-weight:600; color:${statusText === 'Culminada' ? '#16a34a' : '#b91c1c'}">${statusText}</span></td>
            </tr>`;
    });

    // Enviar los datos filtrados y totalizados al Layout del Sandbox
    App.renderPdfPrintSandboxLayout(tableRowsHtml, teamActivityCount, teamTotalMeta, teamTotalProcessed, selfActivityCount, selfTotalMeta, selfTotalProcessed, userFullName, userRole, activeUsername, tipoReporte, fechaInicioFiltro, fechaFinFiltro);
};
/* =========================================================================
   MÓDULO DE REPORTES TEMPORALES CRONOLÓGICOS (v2.02) - PARTE 2 DE 2
   ========================================================================= */
App.renderPdfPrintSandboxLayout = function(tableRowsHtml, teamActivityCount, teamTotalMeta, teamTotalProcessed, selfActivityCount, selfTotalMeta, selfTotalProcessed, userFullName, userRole, activeUsername, tipoReporte, fechaInicio, fechaFin) {
    const teamIED = teamTotalMeta > 0 ? Math.round((teamTotalProcessed / teamTotalMeta) * 100) : 0;
    const selfIED = selfTotalMeta > 0 ? Math.round((selfTotalProcessed / selfTotalMeta) * 100) : 0;

    const reportWindow = window.open("", "_blank");
    if (!reportWindow) return alert("❌ Error: Pop-ups bloqueados. Active los permisos en su navegador para emitir el PDF.");

    reportWindow.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Reporte Consolidado ${tipoReporte} - GOIA</title>
            <style>
                body { font-family: Arial, sans-serif; color: #0f172a; margin: 25px; line-height: 1.4; }
                .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .section-title { font-size: 12px; font-weight: bold; background: #f1f5f9; padding: 5px 8px; border-left: 4px solid #1e3a8a; margin-top: 15px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
                .summary-grid { display: table; width: 100%; table-layout: fixed; margin-bottom: 12px; border-collapse: collapse; }
                .summary-box { display: table-cell; border: 1px solid #cbd5e1; padding: 8px; text-align: center; background: #fff; }
                .summary-num { font-size: 16px; font-weight: bold; color: #1e40af; margin-top: 2px; }
                .summary-box.purple .summary-num { color: #4f46e5; }
                .summary-box.green .summary-num { color: #16a34a; }
                .data-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
                .data-table th { background: #1e3a8a; color: white; padding: 6px; font-size: 11px; text-transform: uppercase; }
                .data-table td { padding: 6px; font-size: 11px; text-align: center; border-bottom: 1px solid #cbd5e1; }
                @media print { .no-print { display: none !important; } body { margin: 10px; } }
            </style>
        </head>
        <body>
            <div class="no-print" style="background: #f8fafc; padding: 10px; border: 1px solid #cbd5e1; border-radius: 4px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 11px; font-weight: bold; color: #334155;">📋 Balance Operacional de Adquirencia — Modo: ${tipoReporte}</span>
                <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 6px 12px; font-weight: bold; border-radius: 4px; cursor: pointer; font-size: 11px;">🖨️ Guardar PDF / Imprimir Reporte</button>
            </div>

            <table class="header-table">
                <tr>
                    <td style="text-align: left; vertical-align: middle;">
                        <h2 style="margin: 0; font-size: 18px; color: #1e3a8a; font-weight: bold;">GOIA v2.02</h2>
                        <p style="margin: 2px 0 0 0; font-size: 11px; color: #475569;">Gestión Operacional de Integridad de Adquirencia</p>
                    </td>
                    <td style="text-align: right; vertical-align: middle; font-size: 11px; color: #475569; line-height: 1.4;">
                        <b>Auditor en Sesión:</b> ${userFullName} (${userRole})<br>
                        <b>Rango de Auditoría:</b> Desde ${fechaInicio.toLocaleDateString("es-VE")} hasta ${fechaFin.toLocaleDateString("es-VE")}<br>
                        <b>Tipo de Corte:</b> Balance ${tipoReporte}
                    </td>
                </tr>
            </table>

            <div class="section-title">1. Volumen Operacional del Equipo de Trabajo</div>
            <div class="summary-grid">
                <div class="summary-box"><div style="font-size: 9px; color: #475569;">TOTAL ACTIVIDADES EQUIPO</div><div class="summary-num">${teamActivityCount}</div></div>
                <div class="summary-box"><div style="font-size: 9px; color: #475569;">TOTAL META / CARGA EQUIPO</div><div class="summary-num">${teamTotalMeta.toLocaleString("es-VE")}</div></div>
                <div class="summary-box"><div style="font-size: 9px; color: #475569;">TOTAL GESTIONES REALIZADAS</div><div class="summary-num">${teamTotalProcessed.toLocaleString("es-VE")}</div></div>
                <div class="summary-box"><div style="font-size: 9px; color: #475569;">EFICIENCIA EQUIPO (IED)</div><div class="summary-num">${teamIED}%</div></div>
            </div>

            <div class="section-title">2. Rendimiento Individual de la Supervisión (@${activeUsername})</div>
            <div class="summary-grid">
                <div class="summary-box purple"><div style="font-size: 9px; color: #475569;">MIS ACTIVIDADES PROPIAS</div><div class="summary-num">${selfActivityCount}</div></div>
                <div class="summary-box purple"><div style="font-size: 9px; color: #475569;">MI META / CARGA INDIVIDUAL</div><div class="summary-num">${selfTotalMeta.toLocaleString("es-VE")}</div></div>
                <div class="summary-box purple"><div style="font-size: 9px; color: #475569;">MIS GESTIONES PROCESADAS</div><div class="summary-num">${selfTotalProcessed.toLocaleString("es-VE")}</div></div>
                <div class="summary-box purple"><div style="font-size: 9px; color: #475569;">EFICIENCIA INDIVIDUAL</div><div class="summary-num">${selfIED}%</div></div>
            </div>

            <div class="section-title">3. Matriz de Cierre y Totalización General</div>
            <div class="summary-grid">
                <div class="summary-box green" style="background: #f0fdf4;"><div style="font-size: 9px; color: #14532d;">TOTALIZACIÓN POR ACTIVIDADES</div><div class="summary-num">${teamActivityCount} Actividades</div></div>
                <div class="summary-box green" style="background: #f0fdf4;"><div style="font-size: 9px; color: #14532d;">TOTALIZACIÓN METAS GENERALES</div><div class="summary-num">${teamTotalMeta.toLocaleString("es-VE")} Cargas</div></div>
                <div class="summary-box green" style="background: #f0fdf4;"><div style="font-size: 9px; color: #14532d;">TOTALIZACIÓN NETAS PROCESADAS</div><div class="summary-num">${teamTotalProcessed.toLocaleString("es-VE")} Gestiones</div></div>
            </div>

            <div class="section-title">4. Desglose Analítico por Actividad / Ítem</div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="text-align: left; width: 45%;">Actividad / Ítem / Operador</th>
                        <th style="width: 20%;">Meta / Carga</th>
                        <th style="width: 20%;">Procesadas</th>
                        <th style="width: 15%;">Estado Operativo</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRowsHtml || '<tr><td colspan="4" style="color: #64748b; padding: 15px;">No existen transacciones registradas en el rango seleccionado.</td></tr>'}
                </tbody>
            </table>
        </body>
        </html>
    `);
    reportWindow.document.close();

    if (typeof AppDB.addLog === "function") {
        AppDB.addLog(activeUsername, "EXPORTAR_PDF", `Exportó balance cronológico de tipo: ${tipoReporte}`);
    }
};

/* =========================================================================
   REESCRITURA DE EXPORTACIÓN (v2.02) - PARTE 2 DE 2 (MAQUETACIÓN HTML FISCAL)
   ========================================================================= */
App.renderPdfPrintSandboxLayout = function(tableRowsHtml, teamActivityCount, teamTotalMeta, teamTotalProcessed, selfActivityCount, selfTotalMeta, selfTotalProcessed, userFullName, userRole, activeUsername, tipoReporte) {
    const teamIED = teamTotalMeta > 0 ? Math.round((teamTotalProcessed / teamTotalMeta) * 100) : 0;
    const selfIED = selfTotalMeta > 0 ? Math.round((selfTotalProcessed / selfTotalMeta) * 100) : 0;

    // Crear un entorno popup sandbox aislado libre de estilos intrusivos de la app
    const reportWindow = window.open("", "_blank");
    if (!reportWindow) return alert("❌ Error: Pop-ups bloqueados. Active los permisos en su navegador para emitir el PDF.");

    reportWindow.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Reporte Consolidado ${tipoReporte} - GOIA</title>
            <style>
                body { font-family: Arial, sans-serif; color: #0f172a; margin: 25px; line-height: 1.4; }
                .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .section-title { font-size: 12px; font-weight: bold; background: #f1f5f9; padding: 5px 8px; border-left: 4px solid #1e3a8a; margin-top: 15px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
                .summary-grid { display: table; width: 100%; table-layout: fixed; margin-bottom: 12px; border-collapse: collapse; }
                .summary-box { display: table-cell; border: 1px solid #cbd5e1; padding: 8px; text-align: center; background: #fff; }
                .summary-num { font-size: 16px; font-weight: bold; color: #1e40af; margin-top: 2px; }
                .summary-box.purple .summary-num { color: #4f46e5; }
                .summary-box.green .summary-num { color: #16a34a; }
                .data-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
                .data-table th { background: #1e3a8a; color: white; padding: 6px; font-size: 11px; text-transform: uppercase; }
                .data-table td { padding: 6px; font-size: 11px; text-align: center; border-bottom: 1px solid #cbd5e1; }
                @media print { .no-print { display: none !important; } body { margin: 10px; } }
            </style>
        </head>
        <body>
            <div class="no-print" style="background: #f8fafc; padding: 10px; border: 1px solid #cbd5e1; border-radius: 4px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 11px; font-weight: bold; color: #334155;">📋 Balance Operacional de Adquirencia (${tipoReporte})</span>
                <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 6px 12px; font-weight: bold; border-radius: 4px; cursor: pointer; font-size: 11px;">🖨️ Guardar PDF / Imprimir Reporte</button>
            </div>

            <table class="header-table">
                <tr>
                    <td style="text-align: left; vertical-align: middle;">
                        <h2 style="margin: 0; font-size: 18px; color: #1e3a8a; font-weight: bold;">GOIA v2.02</h2>
                        <p style="margin: 2px 0 0 0; font-size: 11px; color: #475569;">Gestión Operacional de Integridad de Adquirencia</p>
                    </td>
                    <td style="text-align: right; vertical-align: middle; font-size: 11px; color: #475569;">
                        <b>Auditor en Sesión:</b> ${userFullName} (${userRole})<br>
                        <b>Fecha de Emisión:</b> ${new Date().toLocaleDateString("es-VE")}<br>
                        <b>Corte Fiscal:</b> Balance Consolidado ${tipoReporte}
                    </td>
                </tr>
            </table>

            <div class="section-title">1. Volumen Operacional del Equipo de Trabajo</div>
            <div class="summary-grid">
                <div class="summary-box"><div style="font-size: 9px; color: #475569;">TOTAL ACTIVIDADES EQUIPO</div><div class="summary-num">${teamActivityCount}</div></div>
                <div class="summary-box"><div style="font-size: 9px; color: #475569;">TOTAL META / CARGA EQUIPO</div><div class="summary-num">${teamTotalMeta.toLocaleString("es-VE")}</div></div>
                <div class="summary-box"><div style="font-size: 9px; color: #475569;">TOTAL GESTIONES REALIZADAS</div><div class="summary-num">${teamTotalProcessed.toLocaleString("es-VE")}</div></div>
                <div class="summary-box"><div style="font-size: 9px; color: #475569;">EFICIENCIA EQUIPO (IED)</div><div class="summary-num">${teamIED}%</div></div>
            </div>

            <div class="section-title">2. Rendimiento Individual de la Supervisión (@${activeUsername})</div>
            <div class="summary-grid">
                <div class="summary-box purple"><div style="font-size: 9px; color: #475569;">MIS ACTIVIDADES PROPIAS</div><div class="summary-num">${selfActivityCount}</div></div>
                <div class="summary-box purple"><div style="font-size: 9px; color: #475569;">MI META / CARGA INDIVIDUAL</div><div class="summary-num">${selfTotalMeta.toLocaleString("es-VE")}</div></div>
                <div class="summary-box purple"><div style="font-size: 9px; color: #475569;">MIS GESTIONES PROCESADAS</div><div class="summary-num">${selfTotalProcessed.toLocaleString("es-VE")}</div></div>
                <div class="summary-box purple"><div style="font-size: 9px; color: #475569;">EFICIENCIA INDIVIDUAL</div><div class="summary-num">${selfIED}%</div></div>
            </div>

            <div class="section-title">3. Matriz de Cierre y Totalización General</div>
            <div class="summary-grid">
                <div class="summary-grid">
                    <div class="summary-box green" style="background: #f0fdf4;"><div style="font-size: 9px; color: #14532d;">TOTALIZACIÓN POR ACTIVIDADES</div><div class="summary-num">${teamActivityCount} Actividades</div></div>
                    <div class="summary-box green" style="background: #f0fdf4;"><div style="font-size: 9px; color: #14532d;">TOTALIZACIÓN METAS GENERALES</div><div class="summary-num">${teamTotalMeta.toLocaleString("es-VE")} Cargas</div></div>
                    <div class="summary-box green" style="background: #f0fdf4;"><div style="font-size: 9px; color: #14532d;">TOTALIZACIÓN NETAS PROCESADAS</div><div class="summary-num">${teamTotalProcessed.toLocaleString("es-VE")} Gestiones</div></div>
                </div>
            </div>

            <div class="section-title">4. Desglose Analítico por Actividad / Ítem</div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="text-align: left; width: 45%;">Actividad / Ítem / Operador</th>
                        <th style="width: 20%;">Meta / Carga</th>
                        <th style="width: 20%;">Procesadas</th>
                        <th style="width: 15%;">Estado Operativo</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRowsHtml || '<tr><td colspan="4" style="color: #64748b; padding: 10px;">No existen transacciones registradas en este mes fiscal.</td></tr>'}
                </tbody>
            </table>
        </body>
        </html>
    `);
    reportWindow.document.close();

    if (typeof AppDB.addLog === "function") {
        AppDB.addLog(activeUsername, "EXPORTAR_PDF", `Exportó balance consolidado analítico de tipo: ${tipoReporte}`);
    }
};

/**
* SISTEMA DE CONTROL DE GESTIONES - MOTOR EJECUTIVO VISUAL (app-executive.js)
* PARTE 3 DE 3: ELIMINACIÓN CLOUD, PODIO DE MÉRITO Y MENÚ DE AVATARES PERSONALIZADOS
*/

// BLINDAJE CRÍTICO COMPLIANCE: Inmunidad absoluta ante borrado físico de registros operativos
App.deleteAssignmentCloud = function(index) {
    var operarioLog = App.currentUser ? App.currentUser.username : "sistema";
    console.warn(`Intento de remoción física de fila interceptado y denegado para el índice: ${index} por @${operarioLog}`);
    alert("🚨 Operación denegada por la Gerencia: Las gestiones operacionales activas poseen inmunidad de borrado para resguardar el Índice IED y las auditorías de red.");
    return false;
};

App.calculateMeritPodiumPerformance = function() {
    const topUserField = document.getElementById("topUserWorker");
    if (!topUserField || !AppDB.data || !AppDB.data.assignments) {
        if (topUserField) topUserField.innerText = "Sin registros acumulados";
        return;
    }
    
    var assignmentsData = AppDB.data.assignments;
    var assignmentsArray = Array.isArray(assignmentsData) ? assignmentsData : Object.values(assignmentsData);

    if (assignmentsArray.length === 0) {
        topUserField.innerText = "Sin registros acumulados";
        return;
    }

    let userScores = {};
    assignmentsArray.forEach(function(item) {
        if (item && (item.status === "completed" || item.processed >= item.meta) && (item.createdBy || item.assignedTo)) {
            const user = (item.assignedTo || item.createdBy).toUpperCase();
            const score = parseInt(item.processed || 0);
            userScores[user] = (userScores[user] || 0) + score;
        }
    });
    
    let topUser = null;
    let maxScore = -1;
    for (const [user, score] of Object.entries(userScores)) {
        if (score > maxScore) {
            maxScore = score;
            topUser = user;
        }
    }
    
    if (topUser && maxScore > 0) {
        topUserField.innerText = `${topUser} (${maxScore} Gestiones)`;
    } else {
        topUserField.innerText = "Analizando ciclo activo...";
    }
};

App.openAvatarSelectionModal = function() {
    // Redirigir el llamado para unificar con el cargador FileReader desde la PC implementado en app-core.js
    if (typeof App.openAvatarSelectionModalCustom === "function") {
        App.openAvatarSelectionModalCustom();
    } else {
        // Respaldo alternativo nativo
        document.getElementById("modalOverlay").classList.remove("hidden");
        document.getElementById("modalContent").innerHTML = `
            <div class="modal-inner-header">
                <h3>Gestionar Mi Foto de Perfil</h3>
                <button onclick="document.getElementById('modalOverlay').classList.add('hidden')">&times;</button>
            </div>
            <p class="avatar-modal-description">Haga clic directamente sobre su Avatar circular en la barra izquierda del formulario para cargar una nueva foto real desde los archivos de su PC.</p>
        `;
    }
};

// Disparar el recálculo analítico automático de eficiencia cada 5 segundos
setInterval(function() {
    if (typeof App !== 'undefined' && AppDB.data && AppDB.data.assignments) {
        App.calculateMeritPodiumPerformance();
    }
}, 5000);

/* =========================================================================
   MÓDULO: BLOC DE NOTAS COLABORATIVO MULTI-PESTAÑA CLOUD (GOIA v2.02)
   ========================================================================= */

App.currentActiveNotepadTab = 0;
App.notepadIsUserEditingRightNow = false; // Bloqueador de colisiones para el setInterval

App.openCollaborativeNotepadModal = function() {
    document.getElementById("modalOverlay").classList.remove("hidden");
    
    // Inicializar el nodo si está vacío en la nube
    if (!AppDB.data.notepadNotes || !Array.isArray(AppDB.data.notepadNotes)) {
        AppDB.data.notepadNotes = [
            { title: "General", content: "<h3>Apuntes de la Gerencia</h3><p>Escriba aquí sus anotaciones en formato HTML...</p>" }
        ];
    }

    App.notepadIsUserEditingRightNow = false;
    App.handleRenderNotepadModalStructure();
};

App.handleRenderNotepadModalStructure = function() {
    const notes = AppDB.data.notepadNotes;
    
    if (App.currentActiveNotepadTab >= notes.length) {
        App.currentActiveNotepadTab = notes.length - 1;
    }
    if (App.currentActiveNotepadTab < 0) App.currentActiveNotepadTab = 0;

    let tabsHtml = "";
    notes.forEach(function(note, idx) {
        const activeClass = (idx === App.currentActiveNotepadTab) ? "active" : "";
        tabsHtml += `
            <button type="button" onclick="App.handleSwitchNotepadTab(${idx})" class="notepad-tab-btn ${activeClass}">
                📁 ${note.title || 'Nota'}
            </button>
        `;
    });

    const activeNote = notes[App.currentActiveNotepadTab] || { title: "", content: "" };

    document.getElementById("modalContent").innerHTML = `
        <div class="modal-inner-header">
            <h3>📝 Bloc de Notas Operacional (Compartido Cloud)</h3>
            <button type="button" onclick="App.handleCloseNotepadSafely()">&times;</button>
        </div>
        
        <div class="admin-config-card">
            <div class="notepad-tabs-container">
                ${tabsHtml}
                <button type="button" onclick="App.handleCreateNewNotepadTab()" class="notepad-btn-add">+ Nueva Pestaña</button>
            </div>

            <div class="form-group">
                <label>Título de la Pestaña</label>
                <input type="text" id="inputNotepadTitle" class="form-control" value="${activeNote.title || ''}" onfocus="App.notepadIsUserEditingRightNow=true;" oninput="App.handleSaveNotepadLiveChanges()">
            </div>
            
            <div class="form-group mt-2">
                <label>Contenido (Soporta etiquetas HTML)</label>
                <textarea id="textareaNotepadContent" class="notepad-editor-area" onfocus="App.notepadIsUserEditingRightNow=true;" oninput="App.handleSaveNotepadLiveChanges()" placeholder="Escriba aquí...">${activeNote.content || ''}</textarea>
            </div>

            <label class="mt-2" style="display:block; font-weight:bold;">Visualización Dinámica del Texto:</label>
            <div id="divNotepadPreview" class="notepad-preview-box">
                ${activeNote.content || '<p style="color:#94a3b8;">Vacío</p>'}
            </div>

            <div class="modal-action-row-footer" style="margin-top: 15px; display: flex; justify-content: space-between;">
                <button type="button" onclick="App.handleDeleteCurrentNotepadTab()" class="btn-secondary" style="background:#ef4444; color:white; border:none; padding:8px 12px; font-weight:bold;">🗑️ Eliminar Pestaña</button>
                <button type="button" onclick="App.handleCloseNotepadSafely()" class="btn-primary" style="padding:8px 16px;">Guardar y Cerrar</button>
            </div>
        </div>
    `;
};

App.handleSwitchNotepadTab = function(idx) {
    App.notepadIsUserEditingRightNow = false;
    App.currentActiveNotepadTab = idx;
    App.handleRenderNotepadModalStructure();
};

App.handleCreateNewNotepadTab = function() {
    App.notepadIsUserEditingRightNow = true;
    
    const newTitle = prompt("Escriba el nombre para la nueva pestaña:", "Nueva Pestaña");
    if (!newTitle || newTitle.trim() === "") {
        App.notepadIsUserEditingRightNow = false;
        return;
    }

    if (!AppDB.data.notepadNotes) AppDB.data.notepadNotes = [];

    AppDB.data.notepadNotes.push({
        title: newTitle.trim(),
        content: "<h3>" + newTitle.trim() + "</h3><p>Espacio en blanco listo para anotaciones corporativas.</p>"
    });

    App.currentActiveNotepadTab = AppDB.data.notepadNotes.length - 1;
    
    // Forzar la escritura atómica directa en la base de datos
    AppDB.save();
    AppDB.addLog(App.currentUser?.username || "admin", "NOTEPAD_NUEVA_PAG", "Se creó la pestaña de apuntes: " + newTitle);
    
    App.notepadIsUserEditingRightNow = false;
    App.handleRenderNotepadModalStructure();
};

App.handleSaveNotepadLiveChanges = function() {
    App.notepadIsUserEditingRightNow = true;
    
    const titleIn = document.getElementById("inputNotepadTitle");
    const contentIn = document.getElementById("textareaNotepadContent");
    const previewBox = document.getElementById("divNotepadPreview");

    if (!titleIn || !contentIn) return;

    const notes = AppDB.data.notepadNotes;
    if (notes && notes[App.currentActiveNotepadTab]) {
        notes[App.currentActiveNotepadTab].title = titleIn.value.trim();
        notes[App.currentActiveNotepadTab].content = contentIn.value;
        
        if (previewBox) {
            previewBox.innerHTML = contentIn.value || '<p style="color:#94a3b8;">Vacío</p>';
        }

        // Transmisión digital inmediata hacia Firebase Cloud
        AppDB.save();
    }
};

App.handleDeleteCurrentNotepadTab = function() {
    App.notepadIsUserEditingRightNow = true;
    const notes = AppDB.data.notepadNotes;
    
    if (!notes || notes.length <= 1) {
        alert("⚠️ Operación restringida: El sistema requiere conservar al menos una pestaña activa.");
        App.notepadIsUserEditingRightNow = false;
        return;
    }

    const targetTitle = notes[App.currentActiveNotepadTab]?.title || "";
    if (confirm("¿Desea eliminar la pestaña '" + targetTitle + "' de la nube de la gerencia?")) {
        
        AppDB.data.notepadNotes.splice(App.currentActiveNotepadTab, 1);
        
        AppDB.addLog(App.currentUser?.username || "admin", "NOTEPAD_BORRAR_PAG", "Se eliminó la pestaña: " + targetTitle);
        AppDB.save();

        App.currentActiveNotepadTab = 0;
        App.notepadIsUserEditingRightNow = false;
        App.handleRenderNotepadModalStructure();
        alert("Pestaña revocada correctamente.");
    } else {
        App.notepadIsUserEditingRightNow = false;
    }
};

App.handleCloseNotepadSafely = function() {
    // Liberar el sincronizador del index y cerrar modal de forma limpia
    App.notepadIsUserEditingRightNow = false;
    document.getElementById("modalOverlay").classList.add("hidden");
    
    // Guardado de consolidación final
    AppDB.save();
};
/* =========================================================================
   MÓDULO: MODAL INFORMATIVO ACERCA DE (GOIA v2.02)
   ========================================================================= */
App.openAboutModal = function() {
    // 1. Desplegar la capa flotante del esqueleto SPA
    document.getElementById("modalOverlay").classList.remove("hidden");
    
    // 2. Inyectar la ficha técnica oficial del manual de sistema
    document.getElementById("modalContent").innerHTML = `
        <div class="modal-inner-header">
            <h3>ℹ️ Ficha Técnica del Sistema</h3>
            <button type="button" onclick="document.getElementById('modalOverlay').classList.add('hidden')">&times;</button>
        </div>
        
        <div class="admin-config-card" style="padding: 15px; background: #ffffff; border-radius: 6px; border: 1px solid #cbd5e1;">
            <div style="text-align: center; margin-bottom: 15px;">
                <h4 style="margin: 0; font-size: 16px; color: #0f172a; font-weight: 800;">GOIA v2.02</h4>
                <p style="margin: 2px 0 0 0; font-size: 11px; font-weight: 700; color: #16a34a; text-transform: uppercase; letter-spacing: 0.5px;">Edición Cloud Seguro</p>
            </div>
            
            <div style="font-size: 12px; color: #334155; line-height: 1.5; border-top: 1px dashed #e2e8f0; padding-top: 10px;">
                <p style="margin: 4px 0;"><b>Producto:</b> Gestión Operacional de Integridad de Adquirencia</p>
                <p style="margin: 4px 0;"><b>Gerencia:</b> Gerencia General de Adquirencia</p>
                <p style="margin: 4px 0;"><b>Entorno de Red:</b> Producción Web (Protocolo Seguro HTTPS)</p>
                <p style="margin: 4px 0;"><b>Última Actualización:</b> Junio 2026</p>
            </div>
            
            <div style="margin-top: 12px; padding: 10px; background: #f8fafc; border-radius: 4px; border: 1px solid #e2e8f0; font-size: 11px; color: #475569; text-align: justify;">
                Esta plataforma web automatiza, controla y audita en tiempo real las metas de producción, cargas operacionales, asignaciones y catálogos de gestiones corporativas de forma centralizada con Firebase Realtime Database de Google, garantizando un entorno sandbox inmune a borrados locales de historial o cookies.
            </div>
            
            <div class="modal-action-row-footer" style="margin-top: 15px;">
                <button type="button" onclick="document.getElementById('modalOverlay').classList.add('hidden')" class="btn-primary" style="width: 100%; padding: 10px; font-weight: bold;">Entendido / Cerrar</button>
            </div>
        </div>
    `;
};
