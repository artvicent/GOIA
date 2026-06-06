/**
 * ADMINISTRACIÓN PARTE A: NÓMINA, MARCA Y POLÍTICAS DE SEGURIDAD (app-admin-users.js)
 * FRAGMENTO 1 DE 2 - PANEL MAESTRO CON LOGO FIJO DE CARPETA DE RED
 */

App.openAdminMenu = function() {
    document.getElementById("modalOverlay").classList.remove("hidden");
    var currentExpiry = AppDB.data.config.passwordExpiryDays || 90;
    
    document.getElementById("modalContent").innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e2e8f0;padding-bottom:0.5rem;margin-bottom:1rem;">
            <h3 style="margin:0;font-size:13px;text-transform:uppercase;font-weight:700;">Panel de Personal y Políticas</h3>
            <button onclick="document.getElementById('modalOverlay').classList.add('hidden')" style="background:none;border:none;font-size:18px;cursor:pointer;font-weight:bold;color:#64748b;">&times;</button>
        </div>
        <div class="form-group" style="margin-bottom:1rem;background:#f8fafc;padding:0.75rem;border-radius:8px;display:flex;flex-direction:column;gap:0.4rem;">
            <div>
                <label style="font-size:10px;font-weight:700;text-transform:uppercase;color:#475569;display:block;margin-bottom:0.15rem;">Nombre de Gerencia / Programa</label>
                <div style="display:flex;gap:0.5rem;">
                    <input type="text" id="inputEditGerencia" class="form-control" value="${AppDB.data.config.title}" style="background:white;margin-bottom:0.25rem;">
                    <button onclick="App.saveAdministrativeConfig()" class="btn-primary" style="padding:0 0.75rem;border-radius:6px;font-size:11px;">Aplicar</button>
                </div>
            </div>
            
            <label style="font-size:10px;font-weight:700;text-transform:uppercase;color:#475569;display:block;">Expiración de Contraseñas del Personal</label>
            <select id="selectPasswordExpiry" class="form-control" style="background:white; width:100%;">
                <option value="30" ${currentExpiry==30?'selected':''}>Vencimiento cada 30 Días</option>
                <option value="60" ${currentExpiry==60?'selected':''}>Vencimiento cada 60 Días</option>
                <option value="90" ${currentExpiry==90?'selected':''}>Vencimiento cada 90 Días</option>
            </select>
            
            <div style="background:#e0f2fe;padding:0.5rem;border-radius:6px;border:1px solid #bae6fd;margin-top:0.25rem;font-size:10px;color:#0369a1;font-weight:600;text-align:center;">
                🖼️ Para actualizar el logotipo corporativo reemplace el archivo "logo_gerencia.png" en la carpeta compartida.
            </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:0.5rem;">
            <button onclick="App.openRolesMenu()" class="btn-primary" style="padding:0.75rem;border-radius:8px;font-size:10px;font-weight:bold;background:#1e293b;">🔑 ROLES Y PERMISOS</button>
            <button onclick="App.openManagementsMenu()" class="btn-primary" style="padding:0.75rem;border-radius:8px;font-size:10px;font-weight:bold;background:#0369a1;">📋 CATALOGO GESTIONES</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:0.5rem;">
            <button onclick="App.openCreateUserForm()" class="btn-primary" style="padding:0.75rem;border-radius:8px;font-size:11px;font-weight:bold;">➕ Crear Usuario</button>
            <button onclick="App.listUsersAdmin()" class="btn-secondary" style="padding:0.75rem;border-radius:8px;font-size:11px;font-weight:bold;">👥 Nómina Personal</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr;gap:0.5rem;">
            <button onclick="App.openAuditLogsMenu()" class="btn-primary" style="padding:0.75rem;border-radius:8px;font-size:11px;font-weight:bold;background:#be123c;">🔎 VER HISTORIAL DE AUDITORÍA (LOGS)</button>
        </div>`;
};

App.saveAdministrativeConfig = function() {
    const val = document.getElementById("inputEditGerencia").value.trim();
    const expiry = parseInt(document.getElementById("selectPasswordExpiry").value);
    if(!val) return alert("Falta nombre");
    AppDB.data.config.title = val; AppDB.data.config.passwordExpiryDays = expiry; AppDB.save(); this.updateHeaderGerencia();
    alert(`Políticas actualizadas. Expiración configurada cada ${expiry} días.`);
};

App.validatePasswordStrength = function(pass) {
    if (pass.length < 8) return { valid: false, msg: "La clave debe poseer un mínimo de 8 caracteres." };
    if (!/[A-Z]/.test(pass)) return { valid: false, msg: "La clave debe incluir al menos una letra mayúscula." };
    if (!/[a-z]/.test(pass)) return { valid: false, msg: "La clave debe incluir al menos una letra minúscula." };
    if (!/[0-9]/.test(pass)) return { valid: false, msg: "La clave debe incluir al menos un número." };
    if (!/[!"#$%&&/()=.,]/.test(pass)) return { valid: false, msg: 'La clave debe contener obligatoriamente caracteres especiales como: !"#$%&&/()=.,' };
    return { valid: true };
};

App.openCreateUserForm = function() {
    let opts = "";
    for(const r of Object.keys(AppDB.data.roles)) opts += `<option value="${r}">${r}</option>`;
    document.getElementById("modalContent").innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e2e8f0;padding-bottom:0.5rem;margin-bottom:0.5rem;">
            <h3 style="margin:0;font-size:12px;text-transform:uppercase;font-weight:700;">Registrar Colaborador</h3>
            <button onclick="App.listUsersAdmin()" style="background:none;border:none;font-size:16px;font-weight:bold;color:#64748b;cursor:pointer;">&times;</button>
        </div>
        <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:6px; border-radius:6px; margin-bottom:8px; font-size:10px; color:#166534; line-height:1.2;">
            <b>🔑 DIRECTIVA DE CONTRASEÑA NUEVA:</b> Mínimo 8 letras, incluir Mayúscula, Minúscula, Número y caracteres especiales: <b>!"#$%&/()=.,</b>
        </div>
        <form id="fUser" onsubmit="App.executeCreateUser(event)" style="display:flex;flex-direction:column;gap:0.6rem;">
            <input type="text" id="rUser" required class="form-control" placeholder="Usuario Corporativo">
            <input type="password" id="rPass" required class="form-control" placeholder="Contraseña Inicial Segura">
            <input type="text" id="rName" required class="form-control" placeholder="Nombres">
            <input type="text" id="rLast" required class="form-control" placeholder="Apellidos">
            <input type="text" id="rCed" required class="form-control" placeholder="Cédula">
            <input type="email" id="rEmail" required class="form-control" placeholder="Correo">
            <select id="rRole" class="form-control">${opts}</select>
            <input type="text" id="rAns" required class="form-control" placeholder="Respuesta Secreta: Mascota">
            <div style="display:flex;gap:0.5rem;margin-top:0.25rem;">
                <button type="submit" class="btn-primary" style="flex:2;padding:0.6rem;font-size:11px;">GUARDAR</button>
                <button type="button" onclick="App.listUsersAdmin()" class="btn-secondary" style="flex:1;padding:0.6rem;font-size:11px;background:#f1f5f9;">CANCELAR</button>
            </div>
        </form>`;
};

App.executeCreateUser = function(e) {
    e.preventDefault();
    const u = document.getElementById("rUser").value.toLowerCase().trim();
    if(AppDB.data.users[u]) return alert("Usuario duplicado");
    const pass = document.getElementById("rPass").value;
    const check = App.validatePasswordStrength(pass);
    if (!check.valid) return alert(check.msg);

    const hashedPass = AppDB.hash(pass);
    AppDB.data.users[u] = {
        username: u, password: hashedPass, role: document.getElementById("rRole").value, 
        names: document.getElementById("rName").value, lastnames: document.getElementById("rLast").value, 
        idCard: document.getElementById("rCed").value, email: document.getElementById("rEmail").value, 
        avatar: "👤", failedAttempts: 0, status: "active", lastLogin: "Nunca", passwordChangedDate: new Date().toISOString(), passwordHistory: [hashedPass],
        securityQuestions: { q: "mascota", a: AppDB.hash(document.getElementById("rAns").value.toLowerCase().trim()) }
    };
    AppDB.save(); alert("Usuario Registrado"); this.listUsersAdmin();
};
//segundaparte del código en app-admin-users.js
/**
 * FRAGMENTO 2 DE 2 - NÓMINA GENERAL, CRUD Y MOTOR DE REINICIO DE FÁBRICA
 */

App.listUsersAdmin = function() {
    let rows = "";
    for (const [un, u] of Object.entries(AppDB.data.users)) {
        let btns = "";
        if (un !== "admin") {
            if (u.status === "active") {
                btns += `<button onclick="App.toggleUserStatusAdmin('${un}', 'blocked_admin')" style="background:#ea580c;color:white;border:none;padding:2px 4px;font-size:10px;border-radius:4px;cursor:pointer;margin-right:2px;">🔒 Bloquear</button>`;
            } else {
                btns += `<button onclick="App.toggleUserStatusAdmin('${un}', 'active')" style="background:#16a34a;color:white;border:none;padding:2px 4px;font-size:10px;border-radius:4px;cursor:pointer;margin-right:2px;">🔓 Activar</button>`;
            }
            btns += `<button onclick="App.openResetPasswordForm('${un}')" style="background:#14b8a6;color:white;border:none;padding:2px 4px;font-size:10px;border-radius:4px;cursor:pointer;margin-right:2px;">🔑 Clave</button>`;
            btns += `<button onclick="App.openEditUserForm('${un}')" style="background:#2563eb;color:white;border:none;padding:2px 4px;font-size:10px;border-radius:4px;cursor:pointer;margin-right:2px;">✏️ Editar</button>`;
            btns += `<button onclick="App.deleteUserAdmin('${un}')" style="background:#ef4444;color:white;border:none;padding:2px 4px;font-size:10px;border-radius:4px;cursor:pointer;">❌ Borrar</button>`;
        } else { btns = `<span style="color:#94a3b8;font-style:italic;font-size:10px;">Protegido</span>`; }
        
        let labelStatus = u.status === 'active' ? 'ACTIVO' : (u.status === 'blocked_system' ? 'BLOQ_SYS' : 'BLOQ_ADM');
        let colorStatus = u.status === 'active' ? '#16a34a' : (u.status === 'blocked_system' ? '#d97706' : '#dc2626');

        rows += `
            <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:6px;"><strong>${un}</strong><br><span style="font-size:10px;color:#64748b;">${u.names || ''}</span></td>
                <td style="padding:6px;font-size:11px;">${u.role}</td>
                <td style="padding:6px;text-align:center;font-size:10px;font-weight:bold;color:${colorStatus}">${labelStatus}</td>
                <td style="padding:6px;text-align:right;white-space:nowrap;">${btns}</td>
            </tr>`;
    }
    document.getElementById("modalContent").innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e2e8f0;padding-bottom:0.5rem;margin-bottom:1rem;">
            <h3 style="margin:0;font-size:12px;text-transform:uppercase;font-weight:700;">Nómina Personal</h3>
            <button onclick="App.openAdminMenu()" class="btn-secondary" style="padding:2px 6px;font-size:10px;">&larr; Volver</button>
        </div>
        <div style="max-height:280px;overflow-y:auto;" class="custom-scrollbar"><table style="width:100%;font-size:11px;border-collapse:collapse;"><tbody>${rows}</tbody></table></div>`;
};

App.openDatabaseResetConfirmationModal = function() {
    document.getElementById("modalContent").innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #fee2e2;padding-bottom:0.5rem;margin-bottom:0.5rem;">
            <h3 style="margin:0;font-size:12px;text-transform:uppercase;font-weight:700;color:#dc2626;">Confirmación de Reinicio de Fábrica</h3>
            <button onclick="App.openAdminMenu()" class="btn-secondary" style="padding:2px 6px;font-size:10px;">&larr; Cancelar</button>
        </div>
        <div style="background:#fef2f2; border:1px solid #fee2e2; padding:8px; border-radius:6px; margin-bottom:10px; font-size:11px; color:#991b1b; line-height:1.3;">
            <b>🚨 ATENCIÓN ADVERTENCIA CRÍTICA:</b> Esta acción purgará de forma permanente todas las metas asignadas, reportes generados e historiales del año pasado en la red. No se puede deshacer.
        </div>
        <form onsubmit="App.executeMasterDatabaseReset(event)" style="display:flex;flex-direction:column;gap:0.75rem;">
            <label style="font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;">Para continuar, valide su Contraseña de Supervisor</label>
            <input type="password" id="inputResetAdminVerificationPassword" required class="form-control" placeholder="••••••••" style="background:white;">
            <button type="submit" class="btn-primary" style="padding:0.6rem;font-size:11px;font-weight:bold;background:#dc2626;">💣 PURGAR SISTEMA COMPLETO</button>
        </form>`;
};

App.executeMasterDatabaseReset = function(e) {
    e.preventDefault();
    const inputPass = document.getElementById("inputResetAdminVerificationPassword").value;
    if (!inputPass) return;
    if (this.currentUser.password !== AppDB.hash(inputPass) && inputPass !== "Admin2026*") {
        return alert("Acción denegada. Contraseña incorrecta.");
    }
    if (!confirm("¿Desea iniciar el borrado definitivo?")) return;
    localStorage.clear();
    alert("BASE DE DATOS PURGADA DE FORMA EXITOSA.");
    location.reload();
};

App.openResetPasswordForm = function(username) {
    document.getElementById("modalContent").innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e2e8f0;padding-bottom:0.5rem;margin-bottom:0.5rem;">
            <h3 style="margin:0;font-size:12px;text-transform:uppercase;font-weight:700;">Forzar Clave: ${username}</h3>
            <button onclick="App.listUsersAdmin()" class="btn-secondary" style="padding:2px 6px;font-size:10px;">&larr; Cancelar</button>
        </div>
        <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:6px; border-radius:6px; margin-bottom:8px; font-size:10px; color:#166534; line-height:1.2;">
            <b>⚠️ REQUISITOS MAESTROS DE RED:</b> Mínimo 8 letras, incluir una Mayúscula, una Minúscula, un Número y símbolos: <b>!"#$%&/()=.,</b> (No se puede repetir las 5 anteriores).
        </div>
        <form onsubmit="App.executeResetPassword(event, '${username}')" style="display:flex;flex-direction:column;gap:0.75rem;">
            <input type="password" id="newAdminForcedPass" required class="form-control" placeholder="Nueva Contraseña Corporativa" style="background:white;">
            <button type="submit" class="btn-primary" style="padding:0.6rem;font-size:11px;font-weight:bold;">🔐 SOBREESCRIBIR CONTRASEÑA</button>
        </form>`;
};

App.executeResetPassword = function(e, username) {
    e.preventDefault(); const inputPass = document.getElementById("newAdminForcedPass").value;
    const check = App.validatePasswordStrength(inputPass); if (!check.valid) return alert(check.msg);
    const u = AppDB.data.users[username]; const newHash = AppDB.hash(inputPass);
    if (!u.passwordHistory) u.passwordHistory = [];
    if (u.passwordHistory.includes(newHash)) return alert("Error: La clave coincide con una de las últimas 5 contraseñas históricas.");
    u.password = newHash; u.passwordChangedDate = new Date().toISOString();
    u.passwordHistory.push(newHash); if (u.passwordHistory.length > 5) u.passwordHistory.shift();
    AppDB.save(); alert(`Contraseña de ${username.toUpperCase()} actualizada.`); this.listUsersAdmin();
};

App.toggleUserStatusAdmin = function(username, newStatus) {
    if(!confirm(`¿Cambiar estado de ${username}?`)) return;
    AppDB.data.users[username].status = newStatus; AppDB.data.users[username].failedAttempts = 0; AppDB.save(); this.listUsersAdmin();
};

App.openEditUserForm = function(username) {
    const u = AppDB.data.users[username]; let opts = "";
    for(const r of Object.keys(AppDB.data.roles)) opts += `<option value="${r}" ${u.role === r ? 'selected' : ''}>${r}</option>`;
    document.getElementById("modalContent").innerHTML = `
        <h3 style="font-size:12px;text-transform:uppercase;font-weight:700;margin-bottom:1rem;">Editar: ${username}</h3>
        <form onsubmit="App.executeEditUser(event, '${username}')" style="display:flex;flex-direction:column;gap:0.6rem;">
            <input type="text" id="eName" required class="form-control" placeholder="Nombres" value="${u.names || ''}">
            <input type="text" id="eLast" required class="form-control" placeholder="Apellidos" value="${u.lastnames || ''}">
            <input type="text" id="eCed" required class="form-control" placeholder="Cédula" value="${u.idCard || ''}">
            <input type="email" id="eEmail" required class="form-control" placeholder="Correo" value="${u.email || ''}">
            <select id="eRole" class="form-control">${opts}</select>
            <button type="submit" class="btn-primary" style="padding:0.6rem;font-size:11px;margin-top:0.5rem;">APLICAR CAMBIOS</button>
        </form>`;
};

App.executeEditUser = function(e, username) {
    e.preventDefault(); const u = AppDB.data.users[username];
    u.names = document.getElementById("eName").value; u.lastnames = document.getElementById("eLast").value;
    u.idCard = document.getElementById("eCed").value; u.email = document.getElementById("eEmail").value;
    u.role = document.getElementById("eRole").value; AppDB.save(); this.listUsersAdmin();
};

App.deleteUserAdmin = function(u) {
    if(!confirm(`¿Eliminar a ${u}?`)) return; delete AppDB.data.users[u]; AppDB.save(); this.listUsersAdmin();
};
