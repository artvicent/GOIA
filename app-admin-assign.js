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
// MÓDULO LOGÍSTICO AUTOINCREMENTAL REPARADO: COMPATIBILIDAD CON ARREGLOS (v2.02)
// =========================================================================
App.handleCreateTicketAssignment = function(event) {
    event.preventDefault();
    console.log("Ejecutando canal síncrono de tickets adaptado a arrays...");

    try {
        if (typeof AppDB === 'undefined' || !AppDB.data) {
            alert("Error crítico: El motor de base de datos AppDB no responde.");
            return;
        }

        // 1. Capturar elementos interactivos del formulario inyectado v2.02
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

        // 2. CORRECCIÓN ARQUITECTÓNICA: Forzar estructura de Array [] para no romper app-executive.js
        if (!AppDB.data.config) AppDB.data.config = { ticketCounter: 0, title: "Gerencia General de Adquirencia" };
        
        // Si el nodo de asignaciones no existe o se volvió un objeto {}, lo re-inicializamos como array limpio
        if (!AppDB.data.assignments || !Array.isArray(AppDB.data.assignments)) {
            AppDB.data.assignments = [];
        }

        // 3. INCREMENTO SECUENCIAL SÍNCRONO DEL MANUAL
        var assignedTicketNum = (parseInt(AppDB.data.config.ticketCounter) || 0) + 1;
        AppDB.data.config.ticketCounter = assignedTicketNum;

        var startTimeIso = new Date().toISOString();
        var endTimeIso = new Date(Date.now() + durationValue * 60 * 1000).toISOString();

        // 4. ARMAR EL OBJETO CON MAPEO HÍBRIDO TOTAL
        var nuevoTicketObject = {
            id: assignedTicketNum,
            
            // Requerimientos de visualización (index.html / app-executive.js)
            name: "Ticket #" + assignedTicketNum + " - " + sourceValue, // Une el título y origen para que sea vistoso
            timeStart: startTimeIso,
            timeEnd: endTimeIso,
            duration: durationValue,
            deadline: endTimeIso, // Atributo de herencia síncrona de página 3
            createdAt: startTimeIso,
            
            // Preservación de campos tradicionales del catálogo
            title: "Ticket #" + assignedTicketNum,
            description: "Gestión automatizada de auditoría para carga entrante.",
            source: sourceValue,
            managementName: sourceValue,
            reference: "TCK-" + assignedTicketNum + "-2026",
            
            // Campos numéricos de control de producción e indicadores IED
            target: targetValue,
            meta: targetValue, // Equivalencia directa con la página 3
            processed: 0,
            status: "pending",
            timestamp: Date.now(),
            createdBy: (App.currentUser && App.currentUser.username) ? App.currentUser.username : "admin"
        };

        // 5. INYECCIÓN ATÓMICA AL VECTOR (Mantiene viva la iteración de la tabla)
        AppDB.data.assignments.push(nuevoTicketObject);

        // 6. Registrar la acción en el historial de auditoría interna
        var operarioLog = (App.currentUser && App.currentUser.username) ? App.currentUser.username : "admin";
        AppDB.addLog(operarioLog, "EMITIR_TICKET", `Se emitió con éxito el Ticket #${assignedTicketNum} para la gestión: ${sourceValue}`);
        
        // 7. TRANSMISIÓN DIGITAL CIFRADA AUTOMÁTICA (Guarda y sube a Firebase)
        AppDB.save();

        alert(` ¡Ticket #${assignedTicketNum} Emitido con Éxito!\n\nTiempo de resolución configurado en ${durationValue} minutos.`);
        
        // 8. Cerrar la capa flotante de forma limpia
        document.getElementById("modalOverlay").classList.add("hidden");

        // 9. Forzar el refresco de los contadores y las filas en la pantalla
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
