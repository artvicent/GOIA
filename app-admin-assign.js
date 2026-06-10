/**
 * ADMINISTRACIÓN PARTE B: ASIGNACIÓN DE CARGAS Y METAS (app-admin-assign.js)
 * LÓGICA DE CONTROL PURA - CERO ATRIBUTOS DE ESTILO EN LÍNEA
 * VERSIÓN CENTRALIZADA CLOUD - GOIA v2.02
 */

// Asegurar existencia del objeto global antes de instanciar métodos
if (typeof App === 'undefined') window.App = {};

App.openAssignmentModal = function() {
    // Levantar la capa flotante del esqueleto Single Page Application
    document.getElementById("modalOverlay").classList.remove("hidden");
    
    let opts = "";
    // Extraer en tiempo real los elementos activos del catálogo central cifrado
    if (AppDB.data && AppDB.data.managements) {
        AppDB.data.managements.forEach(function(m) {
            if (m && m.name) {
                opts += `<option value="${m.id}">${m.name}</option>`;
            }
        });
    }

    // Inyectar la interfaz de captura de datos de forma dinámica
    document.getElementById("modalContent").innerHTML = `
        <div class="modal-inner-header">
            <h3>Asignar Nueva Actividad / Ítem</h3>
            <button onclick="document.getElementById('modalOverlay').classList.add('hidden')">&times;</button>
        </div>
        <form id="fAssign" onsubmit="App.executeCreateAssignment(event)" class="admin-config-card">
            <div class="form-group">
                <label>Nombre de la Actividad / Tarea</label>
                <input type="text" id="asigName" required class="form-control" placeholder="Ej: Control de Lotes Diarios">
            </div>
            <div class="form-group mt-2">
                <label>Catálogo de Gestión Asociado</label>
                <select id="asigMgmt" class="form-control full-width">${opts}</select>
            </div>
            <div class="form-group mt-2">
                <label>Meta Numérica / Carga de Trabajo</label>
                <input type="number" id="asigMeta" required class="form-control" min="1" placeholder="Ej: 100">
            </div>
            <div class="form-group mt-2">
                <label>Origen / Referencia de Auditoría</label>
                <input type="text" id="asigRef" required class="form-control" placeholder="Ej: REF-2026-A">
            </div>
            <div class="form-group mt-2">
                <label>Tiempo Límite Máximo de ANS (Minutos)</label>
                <input type="number" id="asigDuration" required class="form-control" min="5" placeholder="Ej: 60">
            </div>
            <div class="modal-action-row-footer">
                <button type="submit" class="btn-primary-submit">Cargar Asignación</button>
                <button type="button" onclick="document.getElementById('modalOverlay').classList.add('hidden')" class="btn-secondary-cancel">Cancelar</button>
            </div>
        </form>
    `;
};
App.executeCreateAssignment = function(e) {
    e.preventDefault();
    
    // Captura limpia de los parámetros lógicos de producción
    const name = document.getElementById("asigName").value.trim();
    const mgmtId = parseInt(document.getElementById("asigMgmt").value);
    const meta = parseInt(document.getElementById("asigMeta").value);
    const reference = document.getElementById("asigRef").value.trim();
    const durationMin = parseInt(document.getElementById("asigDuration").value);
    
    // Vincular el ticket con el nombre descriptivo de su catálogo
    const targetMgmt = AppDB.data.managements.find(m => m.id === mgmtId);
    const mgmtName = targetMgmt ? targetMgmt.name : "Gestión General";
    
    const now = new Date();
    const deadline = new Date(now.getTime() + durationMin * 60000);
    
    if (!AppDB.data.assignments) AppDB.data.assignments = {};

    // Estructurar el identificador único correlativo provisional
    const provisionalId = "ASIG_" + Date.now();
    AppDB.data.assignments[provisionalId] = {
        name: name,
        managementId: mgmtId,
        managementName: mgmtName,
        meta: meta,
        target: meta,
        processed: 0,
        reference: reference,
        status: "pending",
        createdAt: now.toISOString(),
        deadline: deadline.toISOString(),
        timeStart: now.toISOString(),
        timeEnd: deadline.toISOString(),
        duration: durationMin,
        createdBy: (App.currentUser && App.currentUser.username) ? App.currentUser.username : "admin"
    };

    // Almacenamiento seguro central cifrado (XOR) en la nube
    AppDB.save();
    
    var operario = (App.currentUser && App.currentUser.username) ? App.currentUser.username : "admin";
    AppDB.addLog(operario, "CREAR_ASIGNACION", `Creó tarea: ${name} para ref: ${reference}`);
    
    document.getElementById("modalOverlay").classList.add("hidden");
    alert("¡Asignación cargada con éxito en la red!");
    
    if (typeof App.renderDashboardData === 'function') App.renderDashboardData();
};

// BLINDAJE DE INTEGRIDAD CONTRA ALTERACIÓN DE INDICADORES MENSUALES (IED)
App.deleteAssignmentCloud = function(index) {
    console.warn("Intento de eliminación rechazado para resguardar las trazas históricas.");
    alert("🚨 Operación denegada: Las gestiones operacionales en caliente poseen inmunidad de borrado para salvaguardar los indicadores de producción de la Gerencia.");
    return false;
};
// =========================================================================
// MÓDULO LOGÍSTICO AUTOINCREMENTAL REPARADO: CAPTURA DE TIEMPO EN MINUTOS
// =========================================================================
App.handleCreateTicketAssignment = function(event) {
    event.preventDefault();
    console.log("Ejecutando canal seguro de emisión de tickets...");

    try {
        if (typeof AppDB === 'undefined' || !AppDB.data) {
            alert("Error crítico: El motor de base de datos AppDB no responde.");
            return;
        }

        // Elementos interactivos del formulario inyectado v2.02
        var targetInput = document.getElementById("assignTarget");
        var durationInput = document.getElementById("assignDuration");
        var sourceInput = document.getElementById("assignSource");

        if (!targetInput || !sourceInput) return;

        var targetValue = parseInt(targetInput.value) || 0;
        var durationValue = durationInput ? (parseInt(durationInput.value) || 30) : 30;
        var sourceValue = sourceInput.value.trim();

        if (sourceValue === "") {
            alert(" Seleccione un ítem válido del catálogo corporativo.");
            return;
        }
        if (targetValue <= 0) {
            alert(" Volumen inválido: La meta debe establecerse sobre números enteros positivos.");
            return;
        }

        // Estabilizar nodos de la raíz JSON en la nube
        if (!AppDB.data.config) AppDB.data.config = { ticketCounter: 0, title: "Gerencia General de Adquirencia" };
        if (!AppDB.data.assignments) AppDB.data.assignments = {};

        // INCREMENTO SECUENCIAL SÍNCRONO: Reemplaza la transacción manual rota de Firebase
        var assignedTicketNum = (parseInt(AppDB.data.config.ticketCounter) || 0) + 1;
        AppDB.data.config.ticketCounter = assignedTicketNum;

        var startTimeIso = new Date().toISOString();
        var endTimeIso = new Date(Date.now() + durationValue * 60 * 1000).toISOString();
        var ticketKey = "TICKET_" + assignedTicketNum;

        // DOBLE MAPEO INTEGRAL: Compatibilidad absoluta entre esquemas de bases de datos
        AppDB.data.assignments[ticketKey] = {
            id: assignedTicketNum,
            
            // Requerimientos estructurales del nuevo index.html v2.02
            name: sourceValue,
            timeStart: startTimeIso,
            timeEnd: endTimeIso,
            duration: durationValue,
            
            // Preservación de herencia transaccional nativa
            title: "Ticket #" + assignedTicketNum,
            description: "Gestión automatizada de auditoría para carga entrante.",
            source: sourceValue,
            status: "pending",
            target: targetValue,
            processed: 0,
            timestamp: Date.now()
        };

        // Auditoría e inyección de datos cifrados con algoritmo XOR a Google Cloud
        var operarioLog = (App.currentUser && App.currentUser.username) ? App.currentUser.username : "admin";
        AppDB.addLog(operarioLog, "EMITIR_TICKET", `Se emitió con éxito el Ticket #${assignedTicketNum} para la gestión: ${sourceValue}`);
        
        // Transmisión digital inmediata
        AppDB.save();

        alert(` ¡Ticket #${assignedTicketNum} Emitido con Éxito!\n\nTiempo de resolución configurado en ${durationValue} minutos.`);
        document.getElementById("modalOverlay").classList.add("hidden");

        // Refrescar de forma dinámica los componentes de la interfaz de usuario
        if (typeof App.renderDashboardData === 'function') {
            App.renderDashboardData();
        } else if (typeof App.handleRenderAssignmentsTable === 'function') {
            App.handleRenderAssignmentsTable();
        } else {
            window.location.reload();
        }

    } catch (error) {
        console.error("Error crítico de transmisión cloud de tickets: ", error);
        alert(" Fallo en el transporte digital: " + error.message);
    }
};
