
/* =========================================================================
   MÓDULO: RENDERIZADOR DINÁMICO DE ALERTAS (v2.02) - PARTE 1 DE 2
   ========================================================================= */
// Bolsa de memoria temporal persistente para almacenar las alertas descartadas
App.closedAlertsMemory = App.closedAlertsMemory || [];

App.renderDashboardData = function() {
    if (!AppDB.data || !AppDB.data.assignments) return;
    
    const currentMonthFilter = document.getElementById("filterAuditMonth").value;
    const currentStatusFilter = document.getElementById("filterAssignmentStatus").value;
    const tableBody = document.getElementById("tableAssignmentsBody");
    const monitorContainer = document.getElementById("monitorContainer");
    
    if (!tableBody) return;
    tableBody.innerHTML = "";
    
    // Captura estricta de identidades y jerarquías desde el núcleo
    const activeUsername = (App.currentUser && App.currentUser.username) ? App.currentUser.username : "admin";
    const userRole = App.currentUser ? App.currentUser.role : "Analista";
    const roleMeta = (AppDB.data.roles && AppDB.data.roles[userRole]) ? AppDB.data.roles[userRole] : { lvl: 1 };
    const userLevel = typeof roleMeta.lvl !== 'undefined' ? roleMeta.lvl : 1;
    const isSupervisor = (activeUsername === "admin" || userLevel >= 2);

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

        // FILTRADO DE GOBERNANZA OPERATIVA
        if (!isSupervisor && item.assignedTo !== activeUsername) return;

        // Filtrado de calendario mensual
        if (currentMonthFilter !== "all" && currentMonthFilter !== "current") {
            const itemDate = new Date(item.createdAt || item.timestamp);
            if ((itemDate.getMonth() + 1).toString() !== currentMonthFilter) return;
        }

        let timeRemainingStr = " Evaluando...";
        let statusClass = "pending";
        let cardAlertClass = "bg-total";
        let esAlertaCritica = false;

        const itemMeta = parseInt(item.meta || item.target || 0);
        const itemProcessed = parseInt(item.processed || item.realizadas || 0);
        const taskOwner = String(item.assignedTo || item.createdBy || "").trim().toLowerCase().replace("@", "");
        const cleanActiveUser = String(activeUsername).trim().toLowerCase().replace("@", "");

        // ACUMULADORES OPERATIVOS DE VOLUMEN NETO DE GESTIONES
        globalProcessedSum += itemProcessed;
        if (taskOwner === cleanActiveUser || (cleanActiveUser === "admin" && taskOwner === "admin")) {
            individualProcessedSum += itemProcessed;
        }

        // CONTROL CRONOLÓGICO: DETECTOR DE ALERTA MENOR A 30 MINUTOS
        if (item.status === "completed" || (itemProcessed >= itemMeta && itemMeta > 0)) {
            timeRemainingStr = " Culminada";
            statusClass = "completed";
            processedTotalCount += itemProcessed;
            metaTotalCount += itemMeta;
        } else {
            const deadline = new Date(item.deadline || item.timeEnd || item.timestamp);
            const diffMs = deadline - now;
            const diffMin = Math.ceil(diffMs / 60000);
            
            metaTotalCount += itemMeta;
            processedTotalCount += itemProcessed;

            if (diffMin <= 0) {
                timeRemainingStr = " Vencida";
                statusClass = "expired";
                cardAlertClass = "bg-danger";
                totalDanger++;
                esAlertaCritica = true;
            } else if (diffMin <= 30) {
                timeRemainingStr = ` ${diffMin} min`;
                statusClass = "warning";
                cardAlertClass = "bg-warning";
                totalWarning++;
                esAlertaCritica = true; // Activa bandera para el Monitor
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

        // EVALUACIÓN DE MEMORIA: NO PINTAR ALERTAS CERRADAS MANUALMENTE
        const alertaUniqueKey = `alert_${index}_${item.id || 'task'}`;
        
        if (esAlertaCritica && !App.closedAlertsMemory.includes(alertaUniqueKey)) {
            const labelTipoAlerta = statusClass === "expired" ? "🛑 GESTIÓN VENCIDA" : "⚠️ POR VENCER (<30 MIN)";
            const colorLetraAlerta = statusClass === "expired" ? "#991b1b" : "#9a3412";
            
            monitorHtml += `
            <div id="${alertaUniqueKey}" class="counter-card ${cardAlertClass}" style="position: relative; margin-bottom: 8px; border-left: 5px solid ${statusClass === 'expired' ? '#dc2626' : '#ea580c'}; padding-right: 35px;">
                <p style="margin: 0; font-size: 11px; font-weight: 800; color: ${colorLetraAlerta}; letter-spacing: 0.5px;">${labelTipoAlerta}</p>
                <p style="margin: 3px 0 0 0; font-size: 11px; color: #1e293b; line-height: 1.3;">
                    La actividad <b>${item.name || item.title}</b> asignada a <b>@${item.assignedTo}</b> se encuentra en estado crítico (${timeRemainingStr}).
                </p>
                <button type="button" onclick="App.handleDismissAlertInline('${alertaUniqueKey}')" style="position: absolute; top: 8px; right: 8px; background: none; border: none; font-size: 14px; font-weight: bold; cursor: pointer; color: #64748b;" title="Cerrar Alerta">&times;</button>
            </div>`;
        }
    });

    // Pasa el flujo a la segunda parte para inyectar contadores y activar el barrido automático...
    App.completeDashboardRendering(globalProcessedSum, individualProcessedSum, totalWarning, totalDanger, metaTotalCount, processedTotalCount, monitorHtml, isSupervisor);
};
/* =========================================================================
   MÓDULO: RENDERIZADOR DINÁMICO DE ALERTAS (v2.02) - PARTE 2 DE 2
   ========================================================================= */
App.completeDashboardRendering = function(globalProcessedSum, individualProcessedSum, totalWarning, totalDanger, metaTotalCount, processedTotalCount, monitorHtml, isSupervisor) {
    // 1. Inyección de valores netos en los contadores corporativos
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
    
    // 2. Poblar el monitor lateral con alertas activas o mensaje de tranquilidad
    const monitorContainer = document.getElementById("monitorContainer");
    if (monitorContainer) {
        monitorContainer.innerHTML = monitorHtml || `<p class="monitor-empty-text">Cero alertas. Operación bajo parámetros normales.</p>`;
    }

    // 3. RELOJ DE BARRIDO AUTOMÁTICO (Recalcula los minutos restantes cada 10 segundos)
    if (!window.AppDashboardIntervalActive) {
        window.AppDashboardIntervalActive = true;
        setInterval(function() {
            if (document.getElementById("viewDashboard") && !document.getElementById("viewDashboard").classList.contains("hidden")) {
                App.renderDashboardData(); // Ejecución síncrona en caliente
            }
        }, 10000); 
    }
};

// 4. FUNCIÓN EXIGIDA PARA CERRAR Y DESCARTAR MANUALMENTE CADA ALERTA
App.handleDismissAlertInline = function(alertId) {
    if (!App.closedAlertsMemory.includes(alertId)) {
        // Almacenar el ID en la lista de exclusión para que el bucle no lo vuelva a renderizar
        App.closedAlertsMemory.push(alertId);
    }
    // Remover inmediatamente el elemento visual de la pantalla
    const contenedorAlerta = document.getElementById(alertId);
    if (contenedorAlerta) {
        contenedorAlerta.remove();
    }
    console.log(`🛡️ MONITOR: Alerta ${alertId} descartada por el supervisor.`);
    
    // Si la pantalla se queda vacía, reinyectar el letrero de tranquilidad corporativa
    const monitorContainer = document.getElementById("monitorContainer");
    if (monitorContainer && monitorContainer.children.length === 0) {
        monitorContainer.innerHTML = `<p class="monitor-empty-text">Cero alertas. Operación bajo parámetros normales.</p>`;
    }
};

/**
* SISTEMA DE CONTROL DE GESTIONES - MOTOR EJECUTIVO VISUAL (app-executive.js)
* PARTE 2 DE 3: PROGRESO DE ACTIVIDADES, ACTUALIZACIÓN DE LOGS Y REPORTES CONSOLIDADOS
*/

/* =========================================================================
   MÓDULO: MODAL DE ACTUALIZACIÓN Y EDICIÓN AVANZADA DE CARGAS (v2.02)
   ========================================================================= */
App.openUpdateProgressModal = function(index) {
    if (!AppDB.data || !AppDB.data.assignments) return;
    
    var assignmentsData = AppDB.data.assignments;
    var assignmentsArray = Array.isArray(assignmentsData) ? assignmentsData : Object.values(assignmentsData);
    var item = assignmentsArray[index];
    if (!item) return;

    // 1. Validar jerarquía estricta del usuario logueado
    const activeUsername = (App.currentUser && App.currentUser.username) ? App.currentUser.username : "admin";
    const userRole = App.currentUser ? App.currentUser.role : "Analista";
    const roleMeta = (AppDB.data.roles && AppDB.data.roles[userRole]) ? AppDB.data.roles[userRole] : { lvl: 1 };
    const userLevel = typeof roleMeta.lvl !== 'undefined' ? roleMeta.lvl : 1;
    const isSupervisor = (activeUsername === "admin" || userLevel >= 2); // Admin, Gerente, Coordinador

    document.getElementById("modalOverlay").classList.remove("hidden");
    
    let modalHtml = "";

    if (isSupervisor) {
        // ENTORNO SUPERVISOR: Formulario con reasignación de personal y alteración de metas
        let userOptions = "";
        if (AppDB.data.users) {
            Object.values(AppDB.data.users).forEach(function(u) {
                const cleanUser = u.username.replace("@", "");
                const isSelected = item.assignedTo.replace("@", "") === cleanUser ? "selected" : "";
                userOptions += `<option value="${cleanUser}" ${isSelected}>${u.names} ${u.lastnames} (@${cleanUser})</option>`;
            });
        }

        modalHtml = `
            <div class="modal-inner-header">
                <h3>⚙️ Consola de Edición de Actividad</h3>
                <button type="button" onclick="document.getElementById('modalOverlay').classList.add('hidden')">&times;</button>
            </div>
            <form id="formAdvancedEdit" onsubmit="App.handleAdvancedAssignmentSave(event, ${index})" class="admin-config-form-layout" style="padding:10px;">
                <div class="form-group">
                    <label style="display:block; font-weight:bold; margin-bottom:4px;">Nombre / Título de la Actividad</label>
                    <input type="text" id="editItemName" value="${item.name || item.title || ''}" required class="form-control" style="width:100%; padding:8px;">
                </div>
                <div class="form-group" style="margin-top:10px;">
                    <label style="display:block; font-weight:bold; margin-bottom:4px;">Colaborador Asignado (Reasignar Operador)</label>
                    <select id="editItemAssignedTo" class="form-control full-width" style="width:100%; padding:8px;">
                        ${userOptions || `<option value="${item.assignedTo}">${item.assignedTo}</option>`}
                    </select>
                </div>
                <div class="form-group" style="margin-top:10px; display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                    <div>
                        <label style="display:block; font-weight:bold; margin-bottom:4px;">Meta / Carga Solicitada</label>
                        <input type="number" id="editItemMeta" value="${item.meta || item.target || 0}" min="1" required class="form-control" style="width:100%; padding:8px;">
                    </div>
                    <div>
                        <label style="display:block; font-weight:bold; margin-bottom:4px;">Gestiones Procesadas Actuales</label>
                        <input type="number" id="editItemProcessed" value="${item.processed || item.realizadas || 0}" min="0" required class="form-control" style="width:100%; padding:8px;">
                    </div>
                </div>
                <div class="form-group" style="margin-top:10px;">
                    <label style="display:block; font-weight:bold; margin-bottom:4px;">Origen / Referencia</label>
                    <input type="text" id="editItemReference" value="${item.reference || ''}" class="form-control" style="width:100%; padding:8px;">
                </div>
                <div class="modal-action-row-footer" style="margin-top:15px; display:flex; gap:10px;">
                    <button type="button" onclick="document.getElementById('modalOverlay').classList.add('hidden')" class="btn-secondary-cancel" style="flex:1; padding:8px;">Cancelar</button>
                    <button type="submit" class="btn-primary-submit" style="flex:1; padding:8px; background:#2563eb; color:white; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">Guardar Modificación</button>
                </div>
            </form>`;
    } else {
        // ENTORNO ANALISTA BASE: Conserva su formulario regular restrictivo para sumar avance
        modalHtml = `
            <div class="modal-inner-header">
                <h3>📈 Reportar Progreso de Actividad</h3>
                <button type="button" onclick="document.getElementById('modalOverlay').classList.add('hidden')">&times;</button>
            </div>
            <form id="formAnalystProgress" onsubmit="App.handleAnalystProgressSave(event, ${index})" class="admin-config-form-layout" style="padding:10px;">
                <p style="margin:0 0 10px 0; font-size:13px;">Actividad: <b>${item.name || item.title}</b></p>
                <p style="margin:0 0 10px 0; font-size:12px; color:#475569;">Meta Asignada: <b>${item.meta || item.target}</b> | Procesadas: <b>${item.processed || 0}</b></p>
                <div class="form-group">
                    <label style="display:block; font-weight:bold; margin-bottom:4px;">Cantidad de Nuevas Gestiones Realizadas</label>
                    <input type="number" id="inputIncrementCount" min="1" required class="form-control" placeholder="Ej: 50" style="width:100%; padding:8px;">
                </div>
                <div class="modal-action-row-footer" style="margin-top:15px; display:flex; gap:10px;">
                    <button type="button" onclick="document.getElementById('modalOverlay').classList.add('hidden')" class="btn-secondary-cancel" style="flex:1; padding:8px;">Cancelar</button>
                    <button type="submit" class="btn-primary-submit" style="flex:1; padding:8px; background:#16a34a; color:white; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">Registrar Avance</button>
                </div>
            </form>`;
    }

    document.getElementById("modalContent").innerHTML = modalHtml;
};
// A) CONTROLADOR SUPERVISOR: Reescribe y recalcula propiedades sin bloqueos
App.handleAdvancedAssignmentSave = function(event, index) {
    event.preventDefault();
    
    const newName = document.getElementById("editItemName").value.trim();
    const newUser = document.getElementById("editItemAssignedTo").value;
    const newMeta = parseInt(document.getElementById("editItemMeta").value || 0);
    const newProcessed = parseInt(document.getElementById("editItemProcessed").value || 0);
    const newRef = document.getElementById("editItemReference").value.trim();

    if (newProcessed > newMeta) {
        return alert("⚠️ ALERTA OPERACIONAL: Las gestiones procesadas no pueden superar la meta estipulada.");
    }

    const activeUser = (App.currentUser && App.currentUser.username) ? App.currentUser.username : "admin";
    
    // Modificar directamente la memoria local mapeada
    var assignmentsData = AppDB.data.assignments;
    var assignmentsArray = Array.isArray(assignmentsData) ? assignmentsData : Object.values(assignmentsData);
    var targetItem = assignmentsArray[index];

    if (targetItem) {
        const oldUser = targetItem.assignedTo;
        const oldMeta = targetItem.meta || targetItem.target;

        targetItem.name = newName;
        targetItem.title = newName;
        targetItem.assignedTo = newUser;
        targetItem.meta = newMeta;
        targetItem.target = newMeta;
        targetItem.processed = newProcessed;
        targetItem.realizadas = newProcessed;
        targetItem.reference = newRef;
        
        // Ajustar el estatus de completado según los nuevos números ingresados
        targetItem.status = (newProcessed >= newMeta) ? "completed" : "pending";

        // Registrar trazabilidad estricta en el historial de auditoría cloud
        AppDB.addLog(activeUser, "EDICION_AVANZADA", `Modificó actividad #${index}. Reasignó de @${oldUser} a @${newUser}. Meta ajustada de ${oldMeta} a ${newMeta}.`);
        
        // Guardar cambios ejecutando la encriptación nativa en Firebase
        AppDB.save();
        
        alert("✅ ÉXITO: Parámetros de la actividad reconfigurados y sincronizados con éxito.");
        document.getElementById("modalOverlay").classList.add("hidden");
        
        // Refrescar el dashboard y recalcular las 5 tarjetas de contadores
        this.renderDashboardData();
    }
};

// B) CONTROLADOR ANALISTA ORDINARIO: Solo acumula avance incremental sopesando su meta fija
App.handleAnalystProgressSave = function(event, index) {
    event.preventDefault();
    const increment = parseInt(document.getElementById("inputIncrementCount").value || 0);
    if (increment <= 0) return;

    var assignmentsData = AppDB.data.assignments;
    var assignmentsArray = Array.isArray(assignmentsData) ? assignmentsData : Object.values(assignmentsData);
    var targetItem = assignmentsArray[index];

    if (targetItem) {
        const currentProcessed = parseInt(targetItem.processed || 0);
        const currentMeta = parseInt(targetItem.meta || targetItem.target || 0);
        const finalTotal = currentProcessed + increment;

        if (finalTotal > currentMeta) {
            return alert(`❌ Operación denegada: Reportar +${increment} gestiones supera tu meta establecida.`);
        }

        targetItem.processed = finalTotal;
        targetItem.realizadas = finalTotal;
        if (finalTotal >= currentMeta) targetItem.status = "completed";

        AppDB.addLog(App.currentUser?.username || "analista", "REPORTE_AVANCE", `Sumó +${increment} gestiones a la actividad #${index}.`);
        AppDB.save();
        
        alert("👍 Avance registrado con éxito.");
        document.getElementById("modalOverlay").classList.add("hidden");
        this.renderDashboardData();
    }
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
        
        <div class="admin-config-card" style="padding: 15px; background: #c6e5f5; border-radius: 6px; border: 1px solid #cbd5e1;">
            <div style="margin-bottom: 15px; text-align: center;">
                <h4 style="margin: 0; font-size: 14px; color: #1e3a8a; font-weight: bold;">Reportes de Actividades Realizadas</h4>
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
            
            <div class="modal-action-row-footer" style="margin-top: 15px; border-top: 1px dashed #0f52a9; padding-top: 10px;color: #0f52a9;">
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
