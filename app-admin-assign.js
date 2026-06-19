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
/* =========================================================================
   MÓDULO: CAPTURA DE PLAZOS COMPLEJOS (v2.02) - PARTE 1 DE 2
   ========================================================================= */
if (typeof App === 'undefined') window.App = {};

App.openAssignmentModal = function() {
    // 1. Desplegar la capa del modal SPA
    document.getElementById("modalOverlay").classList.remove("hidden");
 
    // 2. Cargar selector del catálogo operativo
    let optsManagements = "";
    if (AppDB.data && AppDB.data.managements) {
        AppDB.data.managements.forEach(function(m) {
            if (m && m.name) {
                optsManagements += `<option value="${m.name}">${m.name}</option>`;
            }
        });
    }
    
    // 3. CERROJO DE SEGURIDAD DE RED: Determinar destinatarios permitidos
    let optsUsers = "";
    const activeUser = (App.currentUser && App.currentUser.username) ? App.currentUser.username : "admin";
    const userRole = App.currentUser ? App.currentUser.role : "Analista";
    const roleMeta = (AppDB.data.roles && AppDB.data.roles[userRole]) ? AppDB.data.roles[userRole] : { lvl: 1 };
    const userLevel = typeof roleMeta.lvl !== 'undefined' ? roleMeta.lvl : 1;
 
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
        optsUsers += `<option value="${activeUser}">@${activeUser} (Mi Propio Perfil)</option>`;
    }

    // 4. INYECCIÓN DE LA INTERFAZ CON EL NUEVO FORMULARIO TRIPLE EN FILA HORIZONTAL
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
                <select id="asigMgmt" class="form-control full-width" required>${optsManagements}</select>
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
 
            <!-- NUEVA FILA COMPACTA TRIPLE DE TIEMPOS COMPLEJOS EN LÍNEA HORIZONTAL -->
            <div class="form-group mt-2">
                <label style="display:block; font-weight:bold; margin-bottom:4px; font-size:11px; color:#1e3a8a;">PLAZO OPERATIVO COMPLEJO DE ENTREGA</label>
                <div style="display:flex; gap:6px;">
                    <div style="flex:1;">
                        <span style="font-size:9px; color:#64748b; font-weight:bold; display:block; margin-bottom:2px;">DÍAS</span>
                        <input type="number" id="taskDays" min="0" value="0" class="form-control" style="width:100%; padding:6px; text-align:center; font-weight:bold;">
                    </div>
                    <div style="flex:1;">
                        <span style="font-size:9px; color:#64748b; font-weight:bold; display:block; margin-bottom:2px;">HORAS</span>
                        <input type="number" id="taskHours" min="0" max="23" value="0" class="form-control" style="width:100%; padding:6px; text-align:center; font-weight:bold;">
                    </div>
                    <div style="flex:1;">
                        <span style="font-size:9px; color:#64748b; font-weight:bold; display:block; margin-bottom:2px;">MINUTOS</span>
                        <input type="number" id="taskMinutes" min="0" max="59" value="30" class="form-control" style="width:100%; padding:6px; text-align:center; font-weight:bold;">
                    </div>
                </div>
            </div>
 
            <div class="modal-action-row-footer" style="margin-top:15px;">
                <button type="submit" class="btn-primary-submit">Cargar Asignación</button>
                <button type="button" onclick="document.getElementById('modalOverlay').classList.add('hidden')" class="btn-secondary-cancel">Cancelar</button>
            </div>
        </form>
    `;
};
/* =========================================================================
   MÓDULO: CAPTURA DE PLAZOS COMPLEJOS (v2.02) - PARTE 2 DE 2
   ========================================================================= */
App.executeCreateAssignment = function(e) {
 e.preventDefault();
 
 try {
 if (typeof AppDB === 'undefined' || !AppDB.data) {
 alert("Error crítico: El motor de base de datos AppDB no responde.");
 return;
 }

 // Capturar los elementos correspondientes del formulario inyectado en el index.html
 const userTarget = document.getElementById("asigUserTarget").value;
 const mgmtNameSelected = document.getElementById("asigMgmt").value; // Leer el selector del catálogo
 const mailLink = document.getElementById("asigMailLink").value.trim();
 const meta = parseInt(document.getElementById("asigMeta").value) || 0;
 const reference = document.getElementById("asigRef").value.trim();
 
 // EXTRACCIÓN MATEMÁTICA DE LAS TRES NUEVAS CASILLAS DEL INDEX.HTML
 const days = parseInt(document.getElementById("taskDeadlineDays").value || 0);
 const hours = parseInt(document.getElementById("taskDeadlineHours").value || 0);
 const minutes = parseInt(document.getElementById("taskDeadlineMinutes").value || 0);

 if (days === 0 && hours === 0 && minutes === 0) {
 alert("⚠️ ALERTA OPERACIONAL: Debe asignar un plazo mínimo de entrega (Días, Horas o Minutos).");
 return;
 }

 const activeUser = (App.currentUser && App.currentUser.username) ? App.currentUser.username : "admin";
 const userRole = App.currentUser ? App.currentUser.role : "Analista";
 const roleMeta = (AppDB.data.roles && AppDB.data.roles[userRole]) ? AppDB.data.roles[userRole] : { lvl: 1 };
 const userLevel = typeof roleMeta.lvl !== 'undefined' ? roleMeta.lvl : 1;

 // Control estricto de Gobernanza Jerárquica PCI
 if (userLevel < 2 && userTarget !== activeUser) {
 alert("🚨 Operación Denegada: Los analistas y especialistas de nivel 1 solo tienen permitido auto-asignarse cargas operacionales.");
 return false;
 }

 // Inicializar arreglos base si se encuentran limpios en Firebase
 if (!AppDB.data.config) AppDB.data.config = { ticketCounter: 0, title: "Gerencia General de Adquirencia" };
 if (!AppDB.data.assignments || !Array.isArray(AppDB.data.assignments)) {
 AppDB.data.assignments = [];
 }

 // INCREMENTO DEL CONTADOR GLOBAL TRANSACCIONAL SÍNCRONO
 var assignedTicketNum = (parseInt(AppDB.data.config.ticketCounter) || 0) + 1;
 AppDB.data.config.ticketCounter = assignedTicketNum;
 
 // ALGORITMO DE ADICIÓN CRONOLÓGICA EN MILISEGUNDOS NETOS
 const now = new Date();
 const durationMin = (days * 24 * 60) + (hours * 60) + minutes; // Minutos netos para el campo duration original
 const totalMs = (days * 24 * 60 * 60 * 1000) + (hours * 60 * 60 * 1000) + (minutes * 60 * 1000);
 const deadline = new Date(now.getTime() + totalMs);

 var ticketTitleFormatted = "Ticket #" + assignedTicketNum + " - " + mgmtNameSelected;

 // Inyectar el payload final al array dinámico
 AppDB.data.assignments.push({
 id: assignedTicketNum,
 name: ticketTitleFormatted, 
 title: "Ticket #" + assignedTicketNum,
 assignedTo: userTarget, 
 managementName: mgmtNameSelected,
 source: mgmtNameSelected,
 mailUrl: mailLink, 
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

 // Cifrar con el algoritmo XOR y transmitir a Firebase de forma nativa
 AppDB.save();
 AppDB.addLog(activeUser, "EMITIR_TICKET", `Se emitió el Ticket #${assignedTicketNum} con plazo de ${days}d ${hours}h ${minutes}m asignado a @${userTarget}`);
 
 // Sincronizar el campo de respaldo oculto antes de cerrar por si el HTML lo exige de fondo
 if (document.getElementById("asigDuration")) {
 document.getElementById("asigDuration").value = durationMin;
 }

 document.getElementById("modalOverlay").classList.add("hidden");
 alert("✅ ¡Ticket #" + assignedTicketNum + " Emitido con Éxito!\n\nAsignación inyectada a la base de datos de la gerencia.");
 
 // Forzar actualización y reordenamiento de la tabla en el dashboard
 if (typeof App.renderDashboardData === 'function') {
 App.renderDashboardData();
 } else {
 window.location.reload();
 }
 } catch (error) {
 console.error("Error crítico de transmisión cloud de asignaciones: ", error);
 alert("Fallo en el transporte digital: " + error.message);
 }
};

// Sincronizar el emisor redundante de la base del archivo
App.handleCreateTicketAssignment = function(event) {
    if (event) event.preventDefault();
    App.openAssignmentModal(); 
};

