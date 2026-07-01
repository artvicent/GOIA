/* =========================================================================
   MÓDULO: RENDERIZADOR DINÁMICO DE ALERTAS Y FILTROS INTEGRADOS (v2.02)
   ========================================================================= */
App.closedAlertsMemory = App.closedAlertsMemory || [];

/* =========================================================================
   MÓDULO: RENDERIZADOR DINÁMICO DE REINICIO MENSUAL DE CICLO (v2.02) - PARTE 1 DE 2
   ========================================================================= */
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

    // Capturar el valor seleccionado en el nuevo filtro de usuarios
    const userSelect = document.getElementById("filterAssignmentUser");
    const currentUserFilter = userSelect ? userSelect.value : "all";

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

    // ORDENAR: Coloca de primero las tareas abiertas y de último las completadas
    assignmentsArray.sort(function(a, b) {
        if (!a || !b) return 0;
        const metaA = parseInt(a.meta || a.target || 0);
        const procA = Math.max(parseInt(a.processed || 0), parseInt(a.realizadas || 0));
        const estaCulminadoA = (a.status === "completed" || (procA >= metaA && metaA > 0));
        const metaB = parseInt(b.meta || b.target || 0);
        const procB = Math.max(parseInt(b.processed || 0), parseInt(b.realizadas || 0));
        const estaCulminadoB = (b.status === "completed" || (procB >= metaB && metaB > 0));
        if (estaCulminadoA && !estaCulminadoB) return 1;
        if (!estaCulminadoA && estaCulminadoB) return -1;
        return 0;
    });

    assignmentsArray.forEach(function(item, index) {
        if (!item) return;

        const taskOwner = String(item.assignedTo || item.createdBy || "").trim().toLowerCase().replace("@", "");
        const cleanActiveUser = String(activeUsername).trim().toLowerCase().replace("@", "");

        // A) FILTRADO DE GOBERNANZA: El analista común solo ve sus propios registros
        if (!isSupervisor && taskOwner !== cleanActiveUser) return;

        // B) NUEVO FILTRO DE CRUCE: Si seleccionas un usuario x, descarta el resto de filas de la tabla
        if (isSupervisor && currentUserFilter !== "all" && taskOwner !== currentUserFilter) return;

        /* =========================================================================
           🛡️ CONTROL DE CICLO MENSUAL AUTOMÁTICO (PCI-DSS)
           Si el filtro dice "Ciclo Activo" (all), obligamos a acumular SOLO el mes en curso (Julio)
           ========================================================================= */
        const itemDate = new Date(item.createdAt || item.timestamp || now);
        
        if (currentMonthFilter === "all" || currentMonthFilter === "current") {
            const esMismoMes = (itemDate.getMonth() === now.getMonth());
            const esMismoAño = (itemDate.getFullYear() === now.getFullYear());
            
            // Si el ticket pertenece a Junio o meses anteriores, se ignora del ciclo actual de medición
            if (!esMismoMes || !esMismoAño) return;
        } 
        else {
            // Si el supervisor usa el filtro desplegable para auditar un mes histórico previo
            if ((itemDate.getMonth() + 1).toString() !== currentMonthFilter) return;
        }

        let timeRemainingStr = " Evaluando...";
        let statusClass = "pending";
        let cardAlertClass = "bg-total";
        let esAlertaCritica = false;

        const itemMeta = parseInt(item.meta || item.target || 0);
        const itemProcessed = Math.max(parseInt(item.processed || 0), parseInt(item.realizadas || 0));

        // ACUMULADORES OPERATIVOS CON EL FILTRO EXCLUSIVO DEL MES EN CURSO YA APLICADO
        globalProcessedSum += itemProcessed;
        if (taskOwner === cleanActiveUser || (cleanActiveUser === "admin" && taskOwner === "admin")) {
            individualProcessedSum += itemProcessed;
        }

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
/* =========================================================================
   MÓDULO: RENDERIZADOR DINÁMICO DE REINICIO MENSUAL DE CICLO (v2.02) - PARTE 2 DE 2
   ========================================================================= */
            if (diffMin <= 0) {
                timeRemainingStr = " Vencida";
                statusClass = "danger"; 
                cardAlertClass = "bg-danger";
                totalDanger++;
                esAlertaCritica = true;
            } else if (diffMin <= 30) {
                timeRemainingStr = ` ${diffMin} min`;
                statusClass = "warning";
                cardAlertClass = "bg-warning";
                totalWarning++;
                esAlertaCritica = true; 
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
        const ticketSafeId = item.id || `task_${index}`;

        let tr = document.createElement("tr");
        tr.className = `status-row-${statusClass}`;
        tr.innerHTML = `
            <td><b>${item.name || item.title || 'Ticket'}</b>${ownerLabel}</td>
            <td class="text-center font-bold">${itemMeta}</td>
            <td class="text-center">${itemProcessed}</td>
            <td class="text-center"><span class="badge-reference">${item.reference || "S/R"}</span></td>
            <td class="text-center"><span class="time-label-${statusClass === 'danger' ? 'expired' : statusClass}">${timeRemainingStr}</span></td>
            <td class="text-center">
                ${mailButtonHtml}
                <button onclick="App.openUpdateProgressModal(${index})" class="btn-secondary">Progreso</button>
            </td>
        `;
        tableBody.appendChild(tr);

        const alertaUniqueKey = `alert_${ticketSafeId}`;
        if (esAlertaCritica && !App.closedAlertsMemory.includes(alertaUniqueKey)) {
            const labelTipoAlerta = statusClass === "danger" ? "🛑 GESTIÓN VENCIDA" : "⚠️ POR VENCER (<30 MIN)";
            const colorLetraAlerta = statusClass === "danger" ? "#991b1b" : "#9a3412";
            
            monitorHtml += `
            <div id="${alertaUniqueKey}" class="counter-card ${cardAlertClass}" style="position: relative; margin-bottom: 8px; border-left: 5px solid ${statusClass === 'danger' ? '#dc2626' : '#ea580c'}; padding-right: 35px;">
                <p style="margin: 0; font-size: 11px; font-weight: 800; color: ${colorLetraAlerta}; letter-spacing: 0.5px;">${labelTipoAlerta}</p>
                <p style="margin: 3px 0 0 0; font-size: 11px; color: #1e293b; line-height: 1.3;">
                    La actividad <b>${item.name || item.title}</b> asignada a <b>@${item.assignedTo}</b> se encuentra en estado crítico (${timeRemainingStr}).
                </p>
                <button type="button" onclick="App.handleDismissAlertInline('${alertaUniqueKey}')" style="position: absolute; top: 8px; right: 8px; background: none; border: none; font-size: 14px; font-weight: bold; cursor: pointer; color: #64748b;">&times;</button>
            </div>`;
        }
    });

    // Delegar el volcado final de contadores recalculados para reiniciar las tarjetas superiores
    App.completeDashboardRendering(globalProcessedSum, individualProcessedSum, totalWarning, totalDanger, metaTotalCount, processedTotalCount, monitorHtml, isSupervisor);
};


/* =========================================================================
   MÓDULO: RENDERIZADOR DINÁMICO DE ALERTAS Y GRÁFICAS IED (v2.02) - PARTE 2 DE 2
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
    
    // 2. CÁLCULO NETO DEL ÍNDICE IED PARA LA GRÁFICA VISUAL
    let ied = 0;
    if (metaTotalCount > 0) {
        ied = Math.round((processedTotalCount / metaTotalCount) * 100);
    }
    document.getElementById("countPerformance").innerText = `${ied}%`;

    // 3. DETERMINACIÓN CRÍTICA DEL COLOR DE LA GRÁFICA (Degradé Ejecutivo Semáforo)
    let colorGraficaIED = "#dc2626"; // Rojo por defecto (Eficiencia Crítica < 50%)
    if (ied >= 80) {
        colorGraficaIED = "#16a34a"; // Verde (Eficiencia Óptima >= 80%)
    } else if (ied >= 50) {
        colorGraficaIED = "#ea580c"; // Naranja (Eficiencia Regular)
    }

    // 4. CONSTRUCCIÓN DE LA MATRIZ DE LA GRÁFICA VISUAL EN CSS PURO
    // Esta barra de alta densidad visual encajará de forma nativa arriba del monitor de alertas
    let graficaVisualIedHtml = `
        <div class="ied-chart-card-wrapper" style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; margin-bottom: 15px; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 11px; font-weight: 800; color: #1e3a8a; letter-spacing: 0.5px; text-transform: uppercase;">📊 Desempeño Operativo del Índice IED</span>
                <span style="font-size: 14px; font-weight: 800; color: ${colorGraficaIED};">${ied}% Eficiencia</span>
            </div>
            
            <!-- Contenedor Base de la Barra de Gráfica -->
            <div style="width: 100%; background-color: #f1f5f9; border-radius: 9999px; height: 10px; overflow: hidden; display: flex;">
                <!-- Barra de Progreso Elástica que se estira dinámicamente con el valor de ied -->
                <div style="width: ${ied}%; background-color: ${colorGraficaIED}; height: 100%; border-radius: 9999px; transition: width 0.5s ease-in-out;"></div>
            </div>
            
            <!-- Leyenda Informativa de Niveles Fiscales para Control de Arturo Valero -->
            <div style="display: flex; justify-content: space-between; font-size: 9px; color: #64748b; margin-top: 5px; font-weight: bold;">
                <span>0% Crítico</span>
                <span style="color: ${ied >= 50 && ied < 80 ? '#ea580c' : '#64748b'};">50% Regular</span>
                <span style="color: ${ied >= 80 ? '#16a34a' : '#64748b'};">80% Objetivo Cumplido</span>
            </div>
        </div>
    `;

    // 5. POBLAR EL MONITOR LATERAL INTERCALANDO LA NUEVA GRÁFICA CON LAS ALERTAS CRÍTICAS
    const monitorContainer = document.getElementById("monitorContainer");
    if (monitorContainer) {
        // La gráfica se posiciona fija arriba de todo y las tarjetas de alerta se listan abajo
        monitorContainer.innerHTML = graficaVisualIedHtml + (monitorHtml || `<p class="monitor-empty-text">Cero alertas operacionales activas.</p>`);
    }

    // Pasa el flujo a la segunda parte para mantener activo el reloj de barrido asíncrono...
    App.activateDashboardIntervalWatcher();
};
/* =========================================================================
   MÓDULO: RENDERIZADOR DINÁMICO DE ALERTAS Y GRÁFICAS IED (v2.02) - PARTE 2 DE 2
   ========================================================================= */
App.activateDashboardIntervalWatcher = function() {
    // RELOJ DE BARRIDO AUTOMÁTICO (Recalcula y redibuja la gráfica y los minutos restantes)
    if (!window.AppDashboardIntervalActive) {
        window.AppDashboardIntervalActive = true;
        setInterval(function() {
            if (document.getElementById("viewDashboard") && !document.getElementById("viewDashboard").classList.contains("hidden")) {
                App.renderDashboardData(); // Ejecución en caliente
            }
        }, 10000); 
    }
};

// FUNCIÓN EXIGIDA PARA CERRAR Y DESCARTAR MANUALMENTE LAS ALERTAS DEL MONITOR
App.handleDismissAlertInline = function(alertId) {
    if (!App.closedAlertsMemory.includes(alertId)) {
        App.closedAlertsMemory.push(alertId);
    }
    const contenedorAlerta = document.getElementById(alertId);
    if (contenedorAlerta) {
        contenedorAlerta.remove();
    }
    console.log(`🛡️ MONITOR: Alerta ${alertId} descartada por el supervisor.`);
    
    // Si ya no quedan más alertas visuales debajo de la gráfica, mantener el letrero de tranquilidad
    const monitorContainer = document.getElementById("monitorContainer");
    // Al evaluar los hijos, descartamos la tarjeta de la gráfica (.ied-chart-card-wrapper)
    const tieneAlertasRestantes = monitorContainer ? (monitorContainer.children.length > 1) : false;
    if (monitorContainer && !tieneAlertasRestantes) {
        // Mantener la gráfica pero limpiar la zona de alertas baja
        const graficaVieja = monitorContainer.querySelector(".ied-chart-card-wrapper")?.outerHTML || "";
        monitorContainer.innerHTML = graficaVieja + `<p class="monitor-empty-text">Cero alertas operacionales activas.</p>`;
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
   MÓDULO: CENTRO DE REPORTES CON SELECCIÓN DE SEMANAS (GOIA v2.02)
   ========================================================================= */
App.openReportsMenu = function() {
    if (!AppDB.data || !AppDB.data.assignments) {
        return alert("❌ Error: No existen datos operativos para consolidar el reporte.");
    }

    document.getElementById("modalOverlay").classList.remove("hidden");

    // 1. CALCULAR LAS SEMANAS DISPONIBLES DINÁMICAMENTE
    const hoy = new Date();
    const añoActual = hoy.getFullYear();
    const mesActual = hoy.getMonth();

    let opcionesSemanasHtml = "";
    
    // A) CALCULO DE EMERGENCIA: Agregar la última semana del mes anterior (Soberanía de Cierre Fiscal)
    const primerDiaMesActual = new Date(añoActual, mesActual, 1);
    const lunesMesAnterior = new Date(primerDiaMesActual);
    lunesMesAnterior.setDate(lunesMesAnterior.getDate() - 7);
    
    const diaLunesAnterior = lunesMesAnterior.getDay();
    const difLunesAnterior = lunesMesAnterior.getDate() - diaLunesAnterior + (diaLunesAnterior === 0 ? -6 : 1);
    lunesMesAnterior.setDate(difLunesAnterior);
    
    const domingoMesAnterior = new Date(lunesMesAnterior);
    domingoMesAnterior.setDate(domingoMesAnterior.getDate() + 6);
    
    opcionesSemanasHtml += `<option value="ANTERIOR_ULTIMA">⬅️ Última Semana Mes Anterior (${lunesMesAnterior.toLocaleDateString("es-VE")} al ${domingoMesAnterior.toLocaleDateString("es-VE")})</option>`;

    // B) CALCULAR LAS SEMANAS DEL MES EN CURSO
    let fechaBucle = new Date(añoActual, mesActual, 1);
    let diaBucle = fechaBucle.getDay();
    let difLunesBucle = fechaBucle.getDate() - diaBucle + (diaBucle === 0 ? -6 : 1);
    if (difLunesBucle < 1) difLunesBucle = 1;
    fechaBucle.setDate(difLunesBucle);

    let numeroSemana = 1;
    while (fechaBucle.getMonth() === mesActual) {
        let lunesSemana = new Date(fechaBucle);
        lunesSemana.setHours(0,0,0,0);
        
        let domingoSemana = new Date(fechaBucle);
        domingoSemana.setDate(domingoSemana.getDate() + 6);
        domingoSemana.setHours(23,59,59,999);
        
        const labelSemana = `Semana #${numeroSemana} del Mes (${lunesSemana.toLocaleDateString("es-VE")} al ${domingoSemana.toLocaleDateString("es-VE")})`;
        const valueSemana = `${lunesSemana.getTime()}_${domingoSemana.getTime()}`;
        const esSemanaActual = (hoy >= lunesSemana && hoy <= domingoSemana) ? "selected" : "";
        
        opcionesSemanasHtml += `<option value="${valueSemana}" ${esSemanaActual}>📅 ${labelSemana}</option>`;
        
        fechaBucle.setDate(fechaBucle.getDate() + 7);
        numeroSemana++;
    }

    // 2. INYECTAR LA INTERFAZ DE CONTROL CRONOLÓGICO SANEADA SIN TEXTOS HUÉRFANOS
    document.getElementById("modalContent").innerHTML = `
        <div class="modal-inner-header">
            <h3>📊 Centro de Reportería y Auditoría Cronológica</h3>
            <button type="button" onclick="document.getElementById('modalOverlay').classList.add('hidden')">&times;</button>
        </div>
        
        <div class="admin-config-card" style="padding: 15px; background: #ffffff; border-radius: 6px; border: 1px solid #cbd5e1;">
            <div style="margin-bottom: 15px; text-align: center;">
                <h4 style="margin: 0; font-size: 14px; color: #1e3a8a; font-weight: bold;">Gerencia General de Adquirencia</h4>
                <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">Seleccione el corte y el rango de calendario para compilar el informe auditable.</p>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 10px;">
                
                <!-- CORTE 1: REPORTE DIARIO (GESTIONES DE HOY) -->
                <button type="button" onclick="App.executeExportDataToPDF('DIARIO')" class="btn-primary" style="width: 100%; padding: 12px; font-weight: bold; background: #059669; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                    📅 EMITIR REPORTE DIARIO (GESTIONES DE HOY)
                </button>

                <!-- CORTE 2: SELECTOR DE SEMANA COMPLEJA -->
                <div class="form-group" style="border: 1px solid #e2e8f0; padding: 10px; border-radius: 4px; background: #f8fafc; margin-top: 4px;">
                    <label style="display:block; font-size:11px; font-weight:bold; margin-bottom:6px; color:#1e3a8a;">CRITERIO DE FILTRADO SEMANAL:</label>
                    <select id="selectTargetAuditWeek" class="form-control full-width" style="width:100%; padding:8px; font-weight:600; border:1px solid #cbd5e1; border-radius:4px; font-size:12px; color:#0f172a; margin-bottom: 8px;">
                        ${opcionesSemanasHtml}
                    </select>
                    <button type="button" onclick="App.executeExportDataToPDF('SEMANAL')" class="btn-primary" style="width: 100%; padding: 10px; font-weight: bold; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; font-size:11px;">
                        🔷 EMITIR REPORTE SEMANAL SELECCIONADO
                    </button>
                </div>
                
                <!-- CORTE 3: CORTE MENSUAL ACUMULADO -->
                <button type="button" onclick="App.executeExportDataToPDF('MENSUAL')" class="btn-primary" style="width: 100%; padding: 12px; font-weight: bold; background: #1e40af; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; margin-top: 4px;">
                    📈 EMITIR REPORTE MENSUAL ACUMULADO (MES ACTIVO)
                </button>
                
                <!-- CORTE 4: HISTÓRICO DE 6 MESES -->
                <button type="button" onclick="App.executeExportDataToPDF('HISTORICO')" class="btn-secondary" style="width: 100%; padding: 12px; font-weight: bold; background: #f8fafc; color: #1e3a8a; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer; font-size: 12px;">
                    🔎 DESCARGAR HISTORIAL RETROSPECTIVO CONSOLIDADO (6 MESES)
                </button>
                
            </div>
            
            <div class="modal-action-row-footer" style="margin-top: 15px; border-top: 1px dashed #e2e8f0; padding-top: 10px;">
                <button type="button" onclick="document.getElementById('modalOverlay').classList.add('hidden')" class="btn-secondary-cancel" style="width: 100%; padding: 10px; font-weight: bold;">Cerrar Ventana</button>
            </div>
        </div>
    `;
};

/* =========================================================================
   MÓDULO: MOTOR CRONOLÓGICO CON FILTRO DIARIO EN VIVO (GOIA v2.02)
   ========================================================================= */
App.executeExportDataToPDF = function(tipoReporte) {
    if (!AppDB.data || !AppDB.data.assignments) {
        return alert("❌ Error: No existen datos operativos para consolidar el reporte.");
    }

    const activeUsername = (App.currentUser && App.currentUser.username) ? App.currentUser.username : "admin";
    const userRole = App.currentUser ? App.currentUser.role : "Gerente";
    const userFullName = `${App.currentUser?.names || 'Arturo'} ${App.currentUser?.lastnames || 'Valero'}`;

    const hoy = new Date();
    let fechaInicioFiltro = new Date(hoy.getFullYear(), hoy.getMonth(), 1); 
    let fechaFinFiltro = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59); 

    // INTERCEPTOR CRONOLÓGICO EXPANDIDO
    if (tipoReporte === 'DIARIO') {
        // Fijar el inicio de la búsqueda a las 12:00 AM de hoy
        fechaInicioFiltro = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0, 0);
        // Fijar el fin de la búsqueda a las 11:59 PM de hoy
        fechaFinFiltro = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59, 999);
    }
    else if (tipoReporte === 'SEMANAL') {
        const selectSemana = document.getElementById("selectTargetAuditWeek");
        if (!selectSemana) return alert("Error: Selector de semanas ausente.");
        const valorSeleccionado = selectSemana.value;
        
        if (valorSeleccionado === "ANTERIOR_ULTIMA") {
            const primerDiaMesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
            fechaInicioFiltro = new Date(primerDiaMesActual);
            fechaInicioFiltro.setDate(fechaInicioFiltro.getDate() - 7);
            const diaL = fechaInicioFiltro.getDay();
            const difL = fechaInicioFiltro.getDate() - diaL + (diaL === 0 ? -6 : 1);
            fechaInicioFiltro.setDate(difL);
            fechaInicioFiltro.setHours(0, 0, 0, 0);
            
            fechaFinFiltro = new Date(fechaInicioFiltro);
            fechaFinFiltro.setDate(fechaInicioFiltro.getDate() + 6);
            fechaFinFiltro.setHours(23, 59, 59, 999);
        } else {
            const hilosTiempo = valorSeleccionado.split("_");
            fechaInicioFiltro = new Date(parseInt(hilosTiempo[0]));
            fechaFinFiltro = new Date(parseInt(hilosTiempo[1]));
        }
    } 
    else if (tipoReporte === 'HISTORICO') {
        fechaInicioFiltro = new Date(hoy.getFullYear(), hoy.getMonth() - 6, 1);
        fechaInicioFiltro.setHours(0, 0, 0, 0);
    }

    let teamTotalMeta = 0;
    let teamTotalProcessed = 0;
    let teamActivityCount = 0;
    let tableRowsHtml = "";
    let resumenPorUsuario = {};
    let resumenPorActividad = {}; 

    const assignmentsData = AppDB.data.assignments;
    const assignmentsArray = Array.isArray(assignmentsData) ? assignmentsData : Object.values(assignmentsData);

    assignmentsArray.forEach(function(item) {
        if (!item) return;

        const itemDate = new Date(item.createdAt || item.timestamp || hoy);
        
        // FILTRO CRONOLÓGICO SELECCIONADO POR EL SUPERVISOR (Inmune a saltos de mes)
        if (itemDate < fechaInicioFiltro || itemDate > fechaFinFiltro) return;

        const itemMeta = parseInt(item.meta || item.target || 0);
        const itemProcessed = parseInt(item.processed || item.realizadas || 0);
        let owner = String(item.assignedTo || item.createdBy || "S/A").trim().toLowerCase().replace("@", "");
        
        let nombreActividadOriginal = String(item.name || item.title || "Ticket Sin Nombre").trim();
        if (nombreActividadOriginal.includes(" - ")) {
            nombreActividadOriginal = nombreActividadOriginal.split(" - ").slice(1).join(" - ").trim();
        }

        teamTotalMeta += itemMeta;
        teamTotalProcessed += itemProcessed;
        teamActivityCount++;

        if (!resumenPorUsuario[owner]) {
            resumenPorUsuario[owner] = { username: owner, actividades: 0, metaTotal: 0, procesadasTotal: 0 };
        }
        resumenPorUsuario[owner].actividades++;
        resumenPorUsuario[owner].metaTotal += itemMeta;
        resumenPorUsuario[owner].procesadasTotal += itemProcessed;

        if (!resumenPorActividad[nombreActividadOriginal]) {
            resumenPorActividad[nombreActividadOriginal] = { nombre: nombreActividadOriginal, metaAcumulada: 0, procesadaAcumulada: 0 };
        }
        resumenPorActividad[nombreActividadOriginal].metaAcumulada += itemMeta;
        resumenPorActividad[nombreActividadOriginal].procesadaAcumulada += itemProcessed;

        let statusText = "Pendiente";
        if (item.status === "completed" || itemProcessed >= itemMeta) statusText = "Culminada";

        tableRowsHtml += `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 6px; font-size: 11px; text-align: left;"><b>${item.name || item.title}</b><br><small style="color:#64748b;">📅 ${itemDate.toLocaleDateString("es-VE")} | 👤 @${item.assignedTo || 'S/A'}</small></td>
                <td style="padding: 6px; font-size: 11px; text-align: center; font-weight: bold;">${itemMeta.toLocaleString("es-VE")}</td>
                <td style="padding: 6px; font-size: 11px; text-align: center;">${itemProcessed.toLocaleString("es-VE")}</td>
                <td style="padding: 6px; font-size: 11px; text-align: center;"><span style="font-weight:600; color:${statusText === 'Culminada' ? '#16a34a' : '#b91c1c'}">${statusText}</span></td>
            </tr>`;
    });

    // Enviar al renderizador final de la maqueta de 4 niveles (Parte 2)
    App.renderUnifiedPdfLayout(tableRowsHtml, teamActivityCount, teamTotalMeta, teamTotalProcessed, resumenPorUsuario, resumenPorActividad, userFullName, userRole, activeUsername, tipoReporte, fechaInicioFiltro, fechaFinFiltro);
};

/* =========================================================================
   MÓDULO DE EXPORTACIÓN CON DOBLE AGRUPACIÓN (v2.02) - PARTE 2 DE 2
   ========================================================================= */
App.renderUnifiedPdfLayout = function(tableRowsHtml, teamActivityCount, teamTotalMeta, teamTotalProcessed, resumenPorUsuario, resumenPorActividad, userFullName, userRole, activeUsername, tipoReporte, fechaInicio, fechaFin) {
    // 1. Compilar tarjetas visuales del Resumen de Operarios
    let usuariosCardsHtml = "";
    Object.values(resumenPorUsuario).forEach(function(userMetrics) {
        const userIED = userMetrics.metaTotal > 0 ? Math.round((userMetrics.procesadasTotal / userMetrics.metaTotal) * 100) : 0;
        usuariosCardsHtml += `
            <div style="display: inline-block; width: 31%; border: 1px solid #cbd5e1; border-radius: 4px; padding: 8px; margin-right: 1.5%; margin-bottom: 10px; background: #fafafa; box-sizing: border-box; vertical-align: top;">
                <div style="font-size: 11px; font-weight: bold; color: #1e3a8a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; text-transform: uppercase;">👤 @${userMetrics.username}</div>
                <div style="font-size: 10px; margin-top: 5px; color: #334155;">Actividades: <b>${userMetrics.actividades}</b></div>
                <div style="font-size: 10px; color: #334155;">Meta Asignada: <b>${userMetrics.metaTotal.toLocaleString("es-VE")}</b></div>
                <div style="font-size: 10px; color: #334155;">Gestiones Reales: <b>${userMetrics.procesadasTotal.toLocaleString("es-VE")}</b></div>
                <div style="font-size: 10px; margin-top: 4px; font-weight: bold; color: ${userIED >= 80 ? '#16a34a' : '#dc2626'};">Eficiencia IED: ${userIED}%</div>
            </div>`;
    });

    // 2. CORRECCIÓN OPERACIONAL: RECORRER EL RESUMEN DE ACTIVIDADES PARA SUMAR REPETIDAS
    let actividadesFilasHtml = "";
    Object.values(resumenPorActividad).forEach(function(act) {
        actividadesFilasHtml += `
            <tr style="border-bottom: 1px solid #cbd5e1;">
                <td style="padding: 6px; font-size: 11px; text-align: left;">💼 <b>${act.nombre}</b></td>
                <td style="padding: 6px; font-size: 11px; text-align: center; font-weight: bold; color: #1e40af;">${act.metaAcumulada.toLocaleString("es-VE")}</td>
                <td style="padding: 6px; font-size: 11px; text-align: center; font-weight: bold; color: #16a34a;">${act.procesadaAcumulada.toLocaleString("es-VE")}</td>
            </tr>`;
    });

    const teamIED = teamTotalMeta > 0 ? Math.round((teamTotalProcessed / teamTotalMeta) * 100) : 0;

    const reportWindow = window.open("", "_blank");
    if (!reportWindow) return alert("❌ Error: Pop-ups bloqueados. Habilite los accesos en el navegador para descargar el informe.");

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
                .summary-box.green .summary-num { color: #16a34a; }
                .data-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
                .data-table th { background: #1e3a8a; color: white; padding: 6px; font-size: 11px; text-transform: uppercase; }
                .data-table td { padding: 6px; font-size: 11px; text-align: center; border-bottom: 1px solid #cbd5e1; }
                .activity-table th { background: #475569; color: white; }
                @media print { .no-print { display: none !important; } body { margin: 10px; } }
            </style>
        </head>
        <body>
            <div class="no-print" style="background: #f8fafc; padding: 10px; border: 1px solid #cbd5e1; border-radius: 4px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 11px; font-weight: bold; color: #334155;">📋 Balance Operencial de Adquirencia — Modo: ${tipoReporte}</span>
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
                        <b>Rango de Carga:</b> Desde ${fechaInicio.toLocaleDateString("es-VE")} hasta ${fechaFin.toLocaleDateString("es-VE")}<br>
                        <b>Corte de Control:</b> Resumen General por Nómina
                    </td>
                </tr>
            </table>

            <!-- SECCIÓN 1: RESUMEN ANALÍTICO INDIVIDUAL POR OPERARIO -->
            <div class="section-title">1. Rendimiento y Carga de Trabajo por Usuario Asignado</div>
            <div style="width: 100%; margin-bottom: 10px;">
                ${usuariosCardsHtml || '<p style="font-size:11px; color:#64748b; padding:5px;">Sin producción individual registrada.</p>'}
            </div>

            <!-- SECCIÓN 2: TOTALIZACIÓN GENERAL CONSOLIDADA (BLOQUE ÚNICO VERDE) -->
            <div class="section-title">2. Matriz de Cierre y Totalización General del Equipo (Bloque Único)</div>
            <div class="summary-grid">
                <div class="summary-box green" style="background: #f0fdf4;">
                    <div style="font-size: 9px; color: #14532d; font-weight: uppercase;">TOTAL ACTIVIDADES COMPLETADAS</div>
                    <div class="summary-num">${teamActivityCount} Actividades</div>
                </div>
                <div class="summary-box green" style="background: #f0fdf4;">
                    <div style="font-size: 9px; color: #14532d; font-weight: uppercase;">TOTAL METAS / CARGAS ASIGNADAS</div>
                    <div class="summary-num">${teamTotalMeta.toLocaleString("es-VE")} Cargas</div>
                </div>
                <div class="summary-box green" style="background: #f0fdf4;">
                    <div style="font-size: 9px; color: #14532d; font-weight: uppercase;">TOTAL GESTIONES PROCESADAS EQUIPO</div>
                    <div class="summary-num">${teamTotalProcessed.toLocaleString("es-VE")} Gestiones</div>
                </div>
                <div class="summary-box green" style="background: #f0fdf4;">
                    <div style="font-size: 9px; color: #14532d; font-weight: uppercase;">IED GLOBAL DEL EQUIPO</div>
                    <div class="summary-num">${teamIED}%</div>
                </div>
            </div>

            <!-- SECCIÓN 3: TOTALIZACIÓN COLECTIVA POR TIPO DE ACTIVIDAD ÚNICA (CORREGIDA) -->
            <div class="section-title">3. Totalización Consolidada por Tipo de Actividad General (Acumulada)</div>
            <table class="data-table activity-table" style="margin-bottom: 15px;">
                <thead>
                    <tr>
                        <th style="text-align: left; width: 50%;">Nombre de la Actividad Corporativa</th>
                        <th style="width: 25%;">Total Metas Asignadas (Suma)</th>
                        <th style="width: 25%;">Total Gestiones Procesadas (Suma)</th>
                    </tr>
                </thead>
                <tbody>
                    ${actividadesFilasHtml || '<tr><td colspan="3" style="color: #64748b; padding: 10px;">No existen categorías acumuladas.</td></tr>'}
                </tbody>
            </table>

            <!-- SECCIÓN 4: DESGLOSE FILA POR FILA CON ESTADOS -->
            <div class="section-title">4. Desglose Detallado por Fila / Actividad / Ítem Individual</div>
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
                    ${tableRowsHtml || '<tr><td colspan="4" style="color: #64748b; padding: 10px;">No existen transacciones registradas.</td></tr>'}
                </tbody>
            </table>
        </body>
        </html>
    `);
    reportWindow.document.close();

    if (typeof AppDB.addLog === "function") {
        AppDB.addLog(activeUsername, "EXPORTAR_PDF", `Exportó balance consolidado analítico agrupado por tarea: ${tipoReporte}`);
    }
};


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
/* =========================================================================
   MÓDULO DE GOBERNANZA: REINICIO MENSUAL DEL PODIO TOP EFICIENCIA (v2.02 CORREGIDO)
   ========================================================================= */
App.completeDashboardRendering = function(globalProcessedSum, individualProcessedSum, totalWarning, totalDanger, metaTotalCount, processedTotalCount, monitorHtml, isSupervisor) {
    
    // 1. Inyección síncrona en los contadores corporativos superiores
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

    /* =========================================================================
   MÓDULO DE GOBERNANZA: REINICIO MENSUAL DEL PODIO TOP EFICIENCIA (v2.02 REPARADO)
   ========================================================================= */
App.completeDashboardRendering = function(globalProcessedSum, individualProcessedSum, totalWarning, totalDanger, metaTotalCount, processedTotalCount, monitorHtml, isSupervisor) {
    
    // 1. Inyección síncrona en los contadores corporativos superiores
    if (document.getElementById("countTotal")) {
        document.getElementById("countTotal").innerText = globalProcessedSum.toLocaleString("es-VE");
    }
    
    const labelTotal = document.getElementById("labelTotalRealizadas");
    const cardIndiv = document.getElementById("cardIndividualProduction");
    
    if (isSupervisor) {
        if (labelTotal) labelTotal.innerText = "Gestiones Totales Equipo";
        if (cardIndiv) {
            cardIndiv.classList.remove("hidden");
            if (document.getElementById("countIndividual")) {
                document.getElementById("countIndividual").innerText = individualProcessedSum.toLocaleString("es-VE");
            }
        }
    } else {
        if (labelTotal) labelTotal.innerText = "Mis Gestiones Procesadas";
        if (cardIndiv) cardIndiv.classList.add("hidden");
    }

    if (document.getElementById("countWarning")) document.getElementById("countWarning").innerText = totalWarning;
    if (document.getElementById("countDanger")) document.getElementById("countDanger").innerText = totalDanger;
    
    let ied = 0;
    if (metaTotalCount > 0) {
        ied = Math.round((processedTotalCount / metaTotalCount) * 100);
    }
    if (document.getElementById("countPerformance")) {
        document.getElementById("countPerformance").innerText = `${ied}%`;
    }
};
    /* =========================================================================
       🔒 MÁSCARA ESTÉTICA ANTI-PARPADEO SINTAXIS CERTIFICADA
       ========================================================================= */
    const podioElementoHeader = document.getElementById("topUserWorker");
    
    if (globalProcessedSum === 0) {
        // A) SI EL MES AMANECIÓ EN CERO: Forzamos el texto de forma limpia y segura
        if (podioElementoHeader) {
            podioElementoHeader.style.display = "inline"; 
            podioElementoHeader.innerText = "Sin registros";
            
            let styleParche = document.getElementById("goiaTopUserFixStyle");
            if (!styleParche) {
                styleParche = document.createElement("style");
                styleParche.id = "goiaTopUserFixStyle";
                styleParche.innerHTML = "#topUserWorker { font-size: 0 !important; } #topUserWorker::before { content: 'Sin registros' !important; font-size: 13px !important; font-weight: bold !important; color: #ffffff !important; }";
                document.head.appendChild(styleParche);
            }
        }
    } else {
        // B) SI YA HAY GESTIONES EN JULIO: Destruimos la máscara CSS y calculamos el líder real
        let styleParche = document.getElementById("goiaTopUserFixStyle");
        if (styleParche) styleParche.remove();

        let conteoJulioPorUsuario = {};
        let maxGestionesJulio = 0;
        let liderActualJulio = "Sin registros";

        const assignmentsData = AppDB.data.assignments;
        const assignmentsArray = Array.isArray(assignmentsData) ? assignmentsData : Object.values(assignmentsData);
        const hoyTop = new Date();

        assignmentsArray.forEach(function(item) {
            if (!item) return;
            const itemDate = new Date(item.createdAt || item.timestamp || hoyTop);
            
            if (itemDate.getMonth() === hoyTop.getMonth() && itemDate.getFullYear() === hoyTop.getFullYear()) {
                const itemProcessed = Math.max(parseInt(item.processed || 0), parseInt(item.realizadas || 0));
                let owner = String(item.assignedTo || "S/A").trim().toLowerCase().replace("@", "");

                if (owner !== "admin" && owner !== "s/a" && itemProcessed > 0) {
                    conteoJulioPorUsuario[owner] = (conteoJulioPorUsuario[owner] || 0) + itemProcessed;
                }
            }
        });
        
        Object.keys(conteoJulioPorUsuario).forEach(function(username) {
            const total = conteoJulioPorUsuario[username];
            if (total > maxGestionesJulio) {
                maxGestionesJulio = total;
                liderActualJulio = `@${username} (${total.toLocaleString("es-VE")} u)`;
            }
        });

        if (podioElementoHeader) {
            podioElementoHeader.innerText = liderActualJulio;
        }
    }

    // 3. Dibujar la barra de la gráfica elástica del Índice IED
    let colorGraficaIED = "#dc2626";
    if (ied >= 80) colorGraficaIED = "#16a34a";
    else if (ied >= 50) colorGraficaIED = "#ea580c";

    let graficaVisualIedHtml = `
        <div class="ied-chart-card-wrapper" style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; margin-bottom: 15px; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 11px; font-weight: 800; color: #1e3a8a; letter-spacing: 0.5px; text-transform: uppercase;">📊 Desempeño Operativo del Índice IED</span>
                <span style="font-size: 14px; font-weight: 800; color: ${colorGraficaIED};">${ied}% Eficiencia</span>
            </div>
            <div style="width: 100%; background-color: #f1f5f9; border-radius: 9999px; height: 10px; overflow: hidden; display: flex;">
                <div style="width: ${ied}%; background-color: ${colorGraficaIED}; height: 100%; border-radius: 9999px; transition: width 0.5s ease-in-out;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 9px; color: #64748b; margin-top: 5px; font-weight: bold;">
                <span>0% Crítico</span>
                <span>50% Regular</span>
                <span>80% Objetivo Cumplido</span>
            </div>
        </div>`;

    const monitorContainer = document.getElementById("monitorContainer");
    if (monitorContainer) {
        monitorContainer.innerHTML = graficaVisualIedHtml + (monitorHtml || `<p class="monitor-empty-text">Cero alertas operacionales activas.</p>`);
    }

    App.activateDashboardIntervalWatcher();
};
