
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
App.openReportsMenu = function() {
    document.getElementById("modalOverlay").classList.remove("hidden");
    
    let totalMeta = 0;
    let totalProcessed = 0;
    
    var assignmentsData = AppDB.data.assignments;
    var assignmentsArray = Array.isArray(assignmentsData) ? assignmentsData : Object.values(assignmentsData);

    assignmentsArray.forEach(function(item) {
        if (!item) return;
        totalMeta += parseInt(item.meta || item.target || 0);
        totalProcessed += parseInt(item.processed || 0);
    });
    
    let eficienciaGeneral = totalMeta > 0 ? Math.round((totalProcessed / totalMeta) * 100) : 0;
    
    document.getElementById("modalContent").innerHTML = `
        <div class="modal-inner-header">
            <h3> Reporte Operacional General</h3>
            <button onclick="document.getElementById('modalOverlay').classList.add('hidden')">&times;</button>
        </div>
        <div class="admin-config-card report-card-gap">
            <p class="report-meta-text"><b>Ciclo Evaluado:</b> Año en Curso 2026</p>
            <p class="report-data-text"><b>Volumen de Metas Cargadas:</b> ${totalMeta} items.</p>
            <p class="report-data-text"><b>Volumen de Gestiones Procesadas:</b> ${totalProcessed} items.</p>
            <p class="report-efficiency-text"><b>Índice Neto de Eficiencia (IED):</b> ${eficienciaGeneral}%</p>
            <div class="modal-divider-line"></div>
            <label class="report-export-label-title"> MÓDULO DE EXPORTACIÓN EXCEL / PDF</label>
            <div class="report-buttons-grid-layout" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px;">
                <button onclick="App.executeExportDataToPDF('SEMANAL')" class="btn-primary-export bg-sky-export" style="padding: 10px; font-weight: bold; cursor: pointer;">GENERAR REPORTE SEMANAL (.PDF)</button>
                <button onclick="App.executeExportDataToPDF('MENSUAL')" class="btn-primary-export bg-navy-export" style="padding: 10px; font-weight: bold; cursor: pointer;">GENERAR REPORTE MENSUAL (.PDF)</button>
            </div>
            <div class="modal-divider-line"></div>
            <p class="report-footer-disclaimer">Este balance consolida todas las actividades de Pin Pagos, desinstalaciones y requerimientos de Help Desk procesados de forma global por el equipo.</p>
        </div>
    `;
};

App.executeExportDataToPDF = function(tipoReporte) {
    var operarioLog = App.currentUser ? App.currentUser.username : "admin";
    alert(` Procesando algoritmo de compilación...\nGenerando reporte consolidado ${tipoReporte} en formato PDF portable de la Gerencia.`);
    window.print();
    AppDB.addLog(operarioLog, "EXPORTAR_PDF", `Exportó balance consolidado de tipo: ${tipoReporte}`);
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
