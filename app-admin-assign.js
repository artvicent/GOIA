/**
 * ADMINISTRACIÓN PARTE B: ASIGNACIÓN DE CARGAS Y METAS (app-admin-assign.js)
 * LÓGICA DE CONTROL PURA - CERO ATRIBUTOS DE ESTILO EN LÍNEA
 * CONFIGURACIÓN DE GOBERNANZA Y ENLACES DOCUMENTALES - v2.02
 */

if (typeof App === 'undefined') window.App = {};

App.openAssignmentModal = function() {
    // 1. Levantar la capa flotante del esqueleto Single Page Application
    document.getElementById("modalOverlay").classList.remove("hidden");
    
    // 2. Extraer gestiones en tiempo real del catálogo centralizado
    let optsManagements = "";
    if (AppDB.data && AppDB.data.managements) {
        AppDB.data.managements.forEach(function(m) {
            if (m && m.name) {
                optsManagements += `<option value="${m.id}">${m.name}</option>`;
            }
        });
    }

    // 3. CERROJO DE SEGURIDAD DE RED: Evaluar jerarquía (lvl) del usuario en sesión
    let optsUsers = "";
    const activeUser = (App.currentUser && App.currentUser.username) ? App.currentUser.username : "admin";
    
    const userRole = App.currentUser ? App.currentUser.role : "Analista";
    const roleMeta = (AppDB.data.roles && AppDB.data.roles[userRole]) ? AppDB.data.roles[userRole] : { lvl: 1 };
    const userLevel = typeof roleMeta.lvl !== 'undefined' ? roleMeta.lvl : 1;
    
    // REGLA: Cuenta maestra 'admin', Gerentes (lvl 4) y Coordinadores (lvl 2 o superior) asignan a otros
    const canAssignToOthers = (activeUser === "admin" || userLevel >= 2);

    if (canAssignToOthers) {
        // Personal de supervisión: Puede delegar actividades a toda la nómina cloud
        if (AppDB.data && AppDB.data.users) {
            Object.keys(AppDB.data.users).forEach(function(username) {
                var u = AppDB.data.users[username];
                optsUsers += `<option value="${username}">@${username} (${u.role || 'Operador'})</option>`;
            });
        }
        if (!optsUsers.includes(`value="${activeUser}"`)) {
            optsUsers = `<option value="${activeUser}">@${activeUser} (Mi Perfil)</option>` + optsUsers;
        }
    } else {
        // Analistas y Especialistas (lvl 1): Estrictamente restringidos a auto-asignarse metas
        optsUsers += `<option value="${activeUser}">@${activeUser} (Mi Propio Perfil)</option>`;
    }

    // 4. Inyectar la interfaz de captura con el nuevo campo de Zoho Mail obligatorio
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
                <label>Enlace de Correo Obligatorio (URL Zoho Mail / Soporte)</label>
                <input type="url" id="asigMailLink" class="form-control" placeholder="https://zoho.com..." required>
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
/**
 * ADMINISTRACIÓN PARTE B: ASIGNACIÓN DE CARGAS Y METAS (app-admin-assign.js)
 * GOBERNANZA DE RED Y CANAL DOCUMENTAL ZOHO MAIL - GOIA v2.02
 */

if (typeof App === 'undefined') window.App = {};

App.openAssignmentModal = function() {
    // 1. Desplegar la capa del modal SPA
    document.getElementById("modalOverlay").classList.remove("hidden");
    
    // 2. Cargar selector del catálogo operativo
    let optsManagements = "";
    if (AppDB.data && AppDB.data.managements) {
        AppDB.data.managements.forEach(function(m) {
            if (m && m.name) {
                optsManagements += `<option value="${m.id}">${m.name}</option>`;
            }
        });
    }

    // 3. CERROJO DE SEGURIDAD DE RED: Determinar destinatarios permitidos
    let optsUsers = "";
    const activeUser = (App.currentUser && App.currentUser.username) ? App.currentUser.username : "admin";
    
    // Validar el nivel jerárquico (lvl) inyectado en db.js
    const userRole = App.currentUser ? App.currentUser.role : "Analista";
    const roleMeta = (AppDB.data.roles && AppDB.data.roles[userRole]) ? AppDB.data.roles[userRole] : { lvl: 1 };
    const userLevel = typeof roleMeta.lvl !== 'undefined' ? roleMeta.lvl : 1;
    
    // REGLA: Admin (maestro), Gerentes (lvl 4) y Coordinadores (lvl 2 o superior) asignan a otros
    const canAssignToOthers = (activeUser === "admin" || userLevel >= 2);

    if (canAssignToOthers) {
        if (AppDB.data && AppDB.data.users) {
            Object.keys(AppDB.data.users).forEach(function(username) {
                var u = AppDB.data.users[username];
                optsUsers += `<option value="${username}">@${username} (${u.role || 'Operador'})</option>`;
            });
        }
        if (!optsUsers.includes(`value="${activeUser}"`)) {
            optsUsers = `<option value="${activeUser}">@${activeUser} (Mi Perfil)</option>` + optsUsers;
        }
    } else {
        // Analistas y Especialistas (lvl 1): Solo pueden seleccionarse a ellos mismos
        optsUsers += `<option value="${activeUser}">@${activeUser} (Mi Propio Perfil)</option>`;
    }

    // 4. Inyectar el nuevo esqueleto libre de atributos de estilo en línea
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
                <label>Enlace de Correo Obligatorio (URL Zoho Mail / Soporte)</label>
                <input type="url" id="asigMailLink" class="form-control" placeholder="https://zoho.com..." required>
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
    
    // Captura limpia de campos de red v2.02
    const name = document.getElementById("asigName").value.trim();
    const userTarget = document.getElementById("asigUserTarget").value;
    const mgmtId = parseInt(document.getElementById("asigMgmt").value);
    const mailLink = document.getElementById("asigMailLink").value.trim();
    const meta = parseInt(document.getElementById("asigMeta").value);
    const reference = document.getElementById("asigRef").value.trim();
    const durationMin = parseInt(document.getElementById("asigDuration").value);
    
    const targetMgmt = (AppDB.data.managements) ? AppDB.data.managements.find(m => m.id === mgmtId) : null;
    const mgmtName = targetMgmt ? targetMgmt.name : "Gestión General";
    
    const now = new Date();
    const deadline = new Date(now.getTime() + durationMin * 60000);
    
    // CONTROL DE SEGURIDAD BACKEND: Evitar inyecciones manuales desde consola F12
    const activeUser = (App.currentUser && App.currentUser.username) ? App.currentUser.username : "admin";
    const userRole = App.currentUser ? App.currentUser.role : "Analista";
    const roleMeta = (AppDB.data.roles && AppDB.data.roles[userRole]) ? AppDB.data.roles[userRole] : { lvl: 1 };
    const userLevel = typeof roleMeta.lvl !== 'undefined' ? roleMeta.lvl : 1;

    if (userLevel < 2 && userTarget !== activeUser) {
        alert("🚨 Operación Denegada: Los analistas y especialistas de nivel 1 solo tienen permitido auto-asignarse cargas operacionales.");
        return false;
    }

    if (!AppDB.data.assignments || !Array.isArray(AppDB.data.assignments)) {
        AppDB.data.assignments = [];
    }

    // Inyectar el registro al vector ordenado con el enlace documental
    AppDB.data.assignments.push({
        id: (AppDB.data.assignments.length + 1),
        name: name,
        title: name,
        assignedTo: userTarget, 
        managementId: mgmtId,
        managementName: mgmtName,
        mailUrl: mailLink, // Guardado persistente de la URL de Zoho Mail
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

    // Cifrar árbol JSON completo (XOR) y transmitir a Firebase Cloud
    AppDB.save();
    AppDB.addLog(activeUser, "CREAR_ASIGNACION", `Tarea: ${name} asignada a @${userTarget} con Zoho Mail.`);
    
    document.getElementById("modalOverlay").classList.add("hidden");
    alert(`¡Éxito! Tarea cargada en la red de la gerencia para @${userTarget.toUpperCase()}.`);
    
    // Forzar renderizado dinámico en caliente del Dashboard
    if (typeof App.renderDashboardData === 'function') {
        App.renderDashboardData();
    } else {
        window.location.reload();
    }
};

// Inactivar el emisor de tickets express duplicado
App.handleCreateTicketAssignment = function(event) {
    if (event) event.preventDefault();
    App.openAssignmentModal(); 
};
