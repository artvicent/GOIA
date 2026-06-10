/**
 * ADMINISTRACIÓN PARTE B: ASIGNACIÓN DE CARGAS Y METAS (app-admin-assign.js)
 * LÓGICA DE CONTROL PURA - CERO ATRIBUTOS DE ESTILO EN LÍNEA
 * CONFIGURACIÓN DE GOBERNANZA Y ENLACES DOCUMENTALES - v2.02
 */

if (typeof App === 'undefined') window.App = {};

App.openAssignmentModal = function() {
    document.getElementById("modalOverlay").classList.remove("hidden");
    
    // 1. Extraer gestiones del catálogo centralizado
    let optsManagements = "";
    if (AppDB.data && AppDB.data.managements) {
        AppDB.data.managements.forEach(function(m) {
            if (m && m.name) {
                optsManagements += `<option value="${m.id}">${m.name}</option>`;
            }
        });
    }

    // 2. CERROJO DE GOBERNANZA: Determinar quién puede recibir la asignación
    let optsUsers = "";
    const activeUser = App.currentUser ? App.currentUser.username : "admin";
    const roleMeta = AppDB.data.roles[App.currentUser?.role];
    const userLevel = (roleMeta && typeof roleMeta.lvl !== 'undefined') ? roleMeta.lvl : 1;
    const isMasterOrStaff = (activeUser === "admin" || userLevel >= 2); // Admin, Gerente, Coordinador

    if (isMasterOrStaff) {
        // Personal de supervisión: Puede asignar tareas a toda la nómina cloud
        if (AppDB.data && AppDB.data.users) {
            Object.keys(AppDB.data.users).forEach(function(username) {
                var u = AppDB.data.users[username];
                optsUsers += `<option value="${username}">@${username} (${u.role})</option>`;
            });
        }
    } else {
        // Analistas y Especialistas (lvl 1): Solo se pueden asignar tareas a ellos mismos
        optsUsers += `<option value="${activeUser}">@${activeUser} (Mi Propio Perfil)</option>`;
    }

    // 3. Inyectar la interfaz de captura con los nuevos campos de control
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
                <label>Colaborador Destinatario (Asignado A)</label>
                <select id="asigUserTarget" class="form-control full-width" required>${optsUsers}</select>
            </div>
            <div class="form-group mt-2">
                <label>Catálogo de Gestión Asociado</label>
                <select id="asigMgmt" class="form-control full-width">${optsManagements}</select>
            </div>
            <div class="form-group mt-2">
                <label>Enlace de Correo (URL Zoho Mail / Soporte)</label>
                <input type="url" id="asigMailLink" class="form-control" placeholder="https://zoho.com...">
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
    const userTarget = document.getElementById("asigUserTarget").value;
    const mgmtId = parseInt(document.getElementById("asigMgmt").value);
    const mailLink = document.getElementById("asigMailLink").value.trim();
    const meta = parseInt(document.getElementById("asigMeta").value);
    const reference = document.getElementById("asigRef").value.trim();
    const durationMin = parseInt(document.getElementById("asigDuration").value);
    
    const targetMgmt = AppDB.data.managements.find(m => m.id === mgmtId);
    const mgmtName = targetMgmt ? targetMgmt.name : "Gestión General";
    
    const now = new Date();
    const deadline = new Date(now.getTime() + durationMin * 60000);
    
    // REGLA DE ORO OPERATIVA: Impedir que un nivel 1 asigne tareas a otros colaboradores
    const activeUser = App.currentUser ? App.currentUser.username : "admin";
    const roleMeta = AppDB.data.roles[App.currentUser?.role];
    const userLevel = (roleMeta && typeof roleMeta.lvl !== 'undefined') ? roleMeta.lvl : 1;
    
    if (userLevel < 2 && userTarget !== activeUser) {
        alert("🚨 Violación de Gobernanza: Su rol de analista/especialista solo le faculta para auto-asignarse metas de producción.");
        return false;
    }

    if (!AppDB.data.assignments || !Array.isArray(AppDB.data.assignments)) {
        AppDB.data.assignments = [];
    }

    // Insertar el nuevo registro al vector síncrono mapeado
    AppDB.data.assignments.push({
        name: name,
        assignedTo: userTarget, // Usuario que procesará la actividad
        managementId: mgmtId,
        managementName: mgmtName,
        mailUrl: mailLink || "", // Almacenamiento seguro del link de Zoho Mail
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
        createdBy: activeUser
    });

    // Cifrado XOR y transmisión digital cloud
    AppDB.save();
    AppDB.addLog(activeUser, "CREAR_ASIGNACION", `Tarea: ${name} asignada a @${userTarget} con Ref: ${reference}`);
    
    document.getElementById("modalOverlay").classList.add("hidden");
    alert("¡Asignación cargada con éxito en la red!");
    
    if (typeof App.renderDashboardData === 'function') App.renderDashboardData();
};

// INMUNIDAD NATIVA DE GESTIONES PARA CUIDAR EL ÍNDICE IED
App.deleteAssignmentCloud = function(index) {
    console.warn("Intento de remoción física bloqueado por auditoría interna.");
    alert("🚨 Operación denegada: Las gestiones operacionales en caliente poseen inmunidad de borrado para salvaguardar los indicadores de la Gerencia.");
    return false;
};
// =========================================================================
// MÓDULO LOGÍSTICO AUTOINCREMENTAL REPARADO: COMPATIBILIDAD CON ARREGLOS
// =========================================================================
App.handleCreateTicketAssignment = function(event) {
    event.preventDefault();
    console.log("Ejecutando canal síncrono de tickets adaptado a arrays...");

    try {
        if (typeof AppDB === 'undefined' || !AppDB.data) {
            alert("Error crítico: El motor de base de datos AppDB no responde.");
            return;
        }

        var targetInput = document.getElementById("assignTarget");
        var durationInput = document.getElementById("assignDuration");
        var sourceInput = document.getElementById("assignSource");
        var mailInput = document.getElementById("asigMailLink"); // Captura opcional de Zoho
        var userSelect = document.getElementById("asigUserTarget");

        if (!targetInput || !sourceInput) return;

        var targetValue = parseInt(targetInput.value) || 0;
        var durationValue = durationInput ? (parseInt(durationInput.value) || 30) : 30;
        var sourceValue = sourceInput.value.trim();
        var mailValue = mailInput ? mailInput.value.trim() : "";
        var assignedUser = userSelect ? userSelect.value : (App.currentUser ? App.currentUser.username : "admin");

        if (sourceValue === "") {
            alert(" Seleccione un ítem válido del catálogo corporativo.");
            return;
        }
        if (targetValue <= 0) {
            alert(" Volumen inválido: La meta debe establecerse sobre números enteros positivos.");
            return;
        }

        if (!AppDB.data.config) AppDB.data.config = { ticketCounter: 0, title: "Gerencia General de Adquirencia" };
        if (!AppDB.data.assignments || !Array.isArray(AppDB.data.assignments)) {
            AppDB.data.assignments = [];
        }

        var assignedTicketNum = (parseInt(AppDB.data.config.ticketCounter) || 0) + 1;
        AppDB.data.config.ticketCounter = assignedTicketNum;

        var startTimeIso = new Date().toISOString();
        var endTimeIso = new Date(Date.now() + durationValue * 60 * 1000).toISOString();

        var nuevoTicketObject = {
            id: assignedTicketNum,
            name: "Ticket #" + assignedTicketNum + " - " + sourceValue,
            assignedTo: assignedUser,
            mailUrl: mailValue, // Guarda el link del correo en el ticket express
            timeStart: startTimeIso,
            timeEnd: endTimeIso,
            duration: durationValue,
            deadline: endTimeIso,
            createdAt: startTimeIso,
            title: "Ticket #" + assignedTicketNum,
            description: "Gestión automatizada de auditoría para carga entrante.",
            source: sourceValue,
            managementName: sourceValue,
            reference: "TCK-" + assignedTicketNum + "-2026",
            target: targetValue,
            meta: targetValue,
            processed: 0,
            status: "pending",
            timestamp: Date.now(),
            createdBy: (App.currentUser && App.currentUser.username) ? App.currentUser.username : "admin"
        };

        AppDB.data.assignments.push(nuevoTicketObject);

        var operarioLog = (App.currentUser && App.currentUser.username) ? App.currentUser.username : "admin";
        AppDB.addLog(operarioLog, "EMITIR_TICKET", `Se emitió el Ticket #${assignedTicketNum} asignado a @${assignedUser}`);
        
        AppDB.save();

        alert(` ¡Ticket #${assignedTicketNum} Emitido con Éxito para @${assignedUser.toUpperCase()}!`);
        document.getElementById("modalOverlay").classList.add("hidden");

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
