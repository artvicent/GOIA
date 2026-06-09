/**
 * ADMINISTRACIÓN PARTE B: ASIGNACIÓN DE CARGAS Y METAS (app-admin-assign.js)
 * LÓGICA DE CONTROL PURA - CERO ATRIBUTOS DE ESTILO EN LÍNEA
 */

App.openAssignmentModal = function() {
    document.getElementById("modalOverlay").classList.remove("hidden");
    
    let opts = "";
    if (AppDB.data && AppDB.data.managements) {
        AppDB.data.managements.forEach(function(m) {
            opts += `<option value="${m.id}">${m.name}</option>`;
        });
    }

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
    
    const name = document.getElementById("asigName").value.trim();
    const mgmtId = parseInt(document.getElementById("asigMgmt").value);
    const meta = parseInt(document.getElementById("asigMeta").value);
    const reference = document.getElementById("asigRef").value.trim();
    const durationMin = parseInt(document.getElementById("asigDuration").value);

    const targetMgmt = AppDB.data.managements.find(m => m.id === mgmtId);
    const mgmtName = targetMgmt ? targetMgmt.name : "Gestión General";

    const now = new Date();
    const deadline = new Date(now.getTime() + durationMin * 60000);

    if (!AppDB.data.assignments) AppDB.data.assignments = [];

    AppDB.data.assignments.push({
        name: name,
        managementId: mgmtId,
        managementName: mgmtName,
        meta: meta,
        processed: 0,
        reference: reference,
        status: "pending",
        createdAt: now.toISOString(),
        deadline: deadline.toISOString(),
        createdBy: App.currentUser.username
    });

    AppDB.save();
    AppDB.addLog(App.currentUser.username, "CREAR_ASIGNACION", `Creó tarea: ${name} para ref: ${reference}`);
    
    document.getElementById("modalOverlay").classList.add("hidden");
    alert("¡Asignación cargada con éxito en la red!");
};

App.deleteAssignmentCloud = function(index) {
    if (!AppDB.data.assignments[index]) return;
    const name = AppDB.data.assignments[index].name;
    
    if (confirm(`¿Desea dar de baja permanentemente la actividad "${name}" de la nube?`)) {
        AppDB.addLog(App.currentUser.username, "BORRAR_ASIGNACION", `Eliminó tarea: ${name}`);
        AppDB.data.assignments.splice(index, 1);
        AppDB.save();
    }

};

// =========================================================================
// MÓDULO LOGÍSTICO AUTOINCREMENTAL: CONTROL INDUSTRIAL DE TICKETS DESDE 0
// =========================================================================
App.handleCreateTicketAssignment = function(event) {
    event.preventDefault();

    var targetInput = document.getElementById("assignTarget");
    var sourceInput = document.getElementById("assignSource");

    if (!targetInput || !sourceInput) return;

    var targetValue = parseInt(targetInput.value);
    var sourceValue = sourceInput.value.trim();

    // Referencia al contador global transaccional en Firebase Realtime Database
    var counterRef = firebase.database().ref("config/ticketCounter");

    // Ejecutamos una transacción atómica para evitar que dos usuarios pisen el mismo número de ticket
    counterRef.transaction(function(currentValue) {
        // Si no existe el nodo en Firebase, inicializa por primera vez en 0
        return (currentValue === null) ? 0 : currentValue + 1;
    }, function(error, committed, snapshot) {
        if (error) {
            alert("❌ Error de sincronización al generar el número de ticket.");
            return;
        }

        // El número de ticket asignado es el valor consolidado tras el incremento
        var assignedTicketNum = snapshot.val();

        // Estructura del nuevo Item de Gestión Ejecutiva Automatizada
        var assignmentData = {
            id: assignedTicketNum,
            title: "Ticket #" + assignedTicketNum, // El título ahora es el código único incremental
            description: "Gestión automatizada de auditoría para carga entrante.",
            target: targetValue,
            processed: 0, // Inicia desde cero absoluto de procesadas
            source: sourceValue,
            status: "pending",
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        // Guardamos el registro bajo su propio ID de Ticket en la base de datos cloud
        firebase.database().ref("assignments/" + assignedTicketNum).set(assignmentData)
            .then(function() {
                alert("✅ ¡Ticket #" + assignedTicketNum + " Emitido con Éxito!\n\nAsignación inyectada a la base de datos de la gerencia.");
                document.getElementById("modalOverlay").classList.add("hidden");
                
                // Si tienes un método de render, lo disparamos para refrescar la tabla en vivo
                if (typeof App.renderDashboardData === 'function') {
                    App.renderDashboardData();
                } else {
                    location.reload();
                }
            })
            .catch(function(err) {
                console.error("Error al registrar actividad: ", err);
                alert("❌ Fallo de comunicación con el servidor cloud de Firebase.");
            });
    });
};
// =========================================================================
// MÓDULO LOGÍSTICO AUTOINCREMENTAL REPARADO: CAPTURA DE TIEMPO EN MINUTOS
// =========================================================================
App.handleCreateTicketAssignment = function(event) {
    event.preventDefault();

    var targetInput = document.getElementById("assignTarget");
    var durationInput = document.getElementById("assignDuration");
    var sourceInput = document.getElementById("assignSource");

    if (!targetInput || !durationInput || !sourceInput) return;

    var targetValue = parseInt(targetInput.value);
    var durationValue = parseInt(durationInput.value);
    var sourceValue = sourceInput.value.trim();

    var counterRef = firebase.database().ref("config/ticketCounter");

    // Ejecución transaccional para el consecutivo correlativo de tickets
    counterRef.transaction(function(currentValue) {
        return (currentValue === null) ? 0 : currentValue + 1;
    }, function(error, committed, snapshot) {
        if (error) {
            alert("❌ Error de sincronización cloud al generar el número de ticket.");
            return;
        }

        var assignedTicketNum = snapshot.val();

        // Estructura de item con minutos de expiración integrados de forma nativa
        var assignmentData = {
            id: assignedTicketNum,
            title: "Ticket #" + assignedTicketNum,
            description: "Gestión automatizada de auditoría para carga entrante.",
            target: targetValue,
            duration: durationValue, // Minutos esenciales preservados en el nodo
            processed: 0,
            source: sourceValue,
            status: "pending",
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        firebase.database().ref("assignments/" + assignedTicketNum).set(assignmentData)
            .then(function() {
                alert("✅ ¡Ticket #" + assignedTicketNum + " Emitido con Éxito!\n\nTiempo de resolución configurado en " + durationValue + " minutos.");
                document.getElementById("modalOverlay").classList.add("hidden");
                
                if (typeof App.renderDashboardData === 'function') {
                    App.renderDashboardData();
                } else {
                    location.reload();
                }
            })
            .catch(function(err) {
                console.error("Error al registrar actividad: ", err);
                alert("❌ Fallo de comunicación con el servidor cloud.");
            });
    });
};
