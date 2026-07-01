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
/* =========================================================================
   MOTOR DE EMISIÓN CLOUD CON LLAVES ÚNICAS ANTI-SOBREESCRITURA (v2.02)
   ========================================================================= */
App.executeCreateAssignment = function(e) {
    e.preventDefault();
    
    if (App.isAssignmentSubmittingLock) {
        console.warn("⚠️ CORE GOIA: Doble envío bloqueado de forma transparente.");
        return false;
    }
    
    try {
        if (typeof AppDB === 'undefined' || !AppDB.data) {
            alert("Error crítico: El motor de base de datos AppDB no responde.");
            return;
        }

        // Capturar los elementos correspondientes del formulario inyectado
        const userTarget = document.getElementById("asigUserTarget").value;
        const mgmtNameSelected = document.getElementById("asigMgmtName").value;
        const mailLink = document.getElementById("asigMailLink").value.trim();
        const meta = parseInt(document.getElementById("asigMeta").value) || 0;
        const reference = document.getElementById("asigRef").value.trim();
        const durationMin = parseInt(document.getElementById("asigDuration").value) || 30;
        
        const asigNameElement = document.getElementById("asigName");
        const asigNameText = asigNameElement ? asigNameElement.value.trim() : "";

        const activeUser = (App.currentUser && App.currentUser.username) ? App.currentUser.username : "admin";
        const userRole = App.currentUser ? App.currentUser.role : "Analista";
        const roleMeta = (AppDB.data.roles && AppDB.data.roles[userRole]) ? AppDB.data.roles[userRole] : { lvl: 1 };
        const userLevel = typeof roleMeta.lvl !== 'undefined' ? roleMeta.lvl : 1;

        if (userLevel < 2 && userTarget !== activeUser) {
            alert("🚨 Operación Denegada: Los analistas de nivel 1 solo tienen permitido auto-asignarse cargas.");
            return false;
        }

        App.isAssignmentSubmittingLock = true;

        const now = new Date();
        const deadline = new Date(now.getTime() + durationMin * 60000);
        const sufijoNombreTicket = asigNameText ? asigNameText : mgmtNameSelected;

        /* =========================================================================
           🚀 MEJORA CRÍTICA: TRANSMISIÓN POR ID ÚNICO INDEPENDIENTE DE FIREBASE
           ========================================================================= */
        // Generamos un identificador único irrepetible basado en milisegundos y tokens aleatorios
        const ticketUnicoGeneradoId = "TK_" + now.getTime() + "_" + Math.random().toString(36).substr(2, 5).toUpperCase();
        
        var ticketTitleFormatted = "Ticket - " + sufijoNombreTicket;

        // Estructura del Payload de adquirencia
        const payloadTicketObj = {
            id: ticketUnicoGeneradoId, // Ya no usa el contador numérico que se pisaba
            name: ticketTitleFormatted, 
            title: sufijoNombreTicket,
            assignedTo: userTarget,
            managementName: mgmtNameSelected,
            source: mgmtNameSelected,
            mailUrl: mailLink,
            meta: meta,
            target: meta,
            processed: 0,
            realizadas: 0,
            reference: reference,
            status: "pending",
            createdAt: now.toISOString(),
            deadline: deadline.toISOString(),
            timeStart: now.toISOString(),
            timeEnd: deadline.toISOString(),
            duration: durationMin,
            createdBy: activeUser
        };

        // Si la base de datos se maneja como Objeto en lugar de Array, aseguramos compatibilidad
        if (!AppDB.data.assignments) AppDB.data.assignments = {};
        
        // Guardamos el ticket indexado bajo su propia llave exclusiva en la nube
        AppDB.data.assignments[ticketUnicoGeneradoId] = payloadTicketObj;

        // Enviar la notificación en tiempo real al analista secundario
        if (typeof firebase !== 'undefined' && firebase.database && userTarget.toLowerCase().trim() !== activeUser.toLowerCase().trim()) {
            try {
                const cleanTargetKey = userTarget.toLowerCase().trim().replace("@", "");
                const newNoticeRef = firebase.database().ref("notifications/" + cleanTargetKey).push();
                newNoticeRef.set({
                    id: ticketUnicoGeneradoId,
                    title: "Nueva Actividad",
                    msg: "Se le ha asignado la actividad: " + sufijoNombreTicket,
                    createdBy: activeUser,
                    status: "unread",
                    createdAt: now.toISOString(),
                    createdAtNum: now.getTime()
                });
            } catch (err) { console.error("Error al propagar notificación:", err); }
        }

        // Incrementar el contador solo a modo de registro histórico opcional
        if (!AppDB.data.config) AppDB.data.config = { ticketCounter: 0 };
        AppDB.data.config.ticketCounter = (parseInt(AppDB.data.config.ticketCounter) || 0) + 1;

        // Sincronizar en la nube de Firebase
        AppDB.save();
        
        if (typeof AppDB.addLog === "function") {
            AppDB.addLog(activeUser, "EMITIR_TICKET", `Emitió ticket con ID único asignado a @${userTarget}`);
        }

        // Limpiar los cuadros de texto
        if (asigNameElement) asigNameElement.value = "";
        document.getElementById("asigMeta").value = "";
        document.getElementById("asigDuration").value = "30";
        if (document.getElementById("asigMailLink")) document.getElementById("asigMailLink").value = "";
        if (document.getElementById("asigRef")) document.getElementById("asigRef").value = "";

        document.getElementById("modalOverlay").classList.add("hidden");
        alert("✅ ¡Actividad Asignada con Éxito!\n\nCada colaborador mantendrá su registro independiente en la nube.");
        
        App.isAssignmentSubmittingLock = false;

        if (typeof App.renderDashboardData === 'function') {
            App.renderDashboardData();
        } else {
            window.location.reload();
        }

    } catch (error) {
        App.isAssignmentSubmittingLock = false;
        console.error("Error crítico de transmisión cloud de asignaciones: ", error);
        alert("Fallo en el transporte digital: " + error.message);
    }
};
