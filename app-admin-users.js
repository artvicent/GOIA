/**
 * ADMINISTRACIÓN PARTE A: NÓMINA Y POLÍTICAS DE GERENCIA (app-admin-users.js - PARTE 1 DE 2)
 * Motor Ejecutivo de Configuración y Control de Permisos
 */

App.saveAdministrativeConfig = function() {
    const nuevoTitulo = document.getElementById("inputEditGerencia").value.trim();
    const nuevaExpiracion = parseInt(document.getElementById("selectPasswordExpiry").value);
    
    if (!nuevoTitulo) {
        return alert("Por favor, ingrese un nombre válido para la Gerencia.");
    }

    // 1. Inyectar los datos en el objeto de configuración central
    AppDB.data.config.title = nuevoTitulo;
    AppDB.data.config.passwordExpiryDays = nuevaExpiracion;

    // 2. TRANSMISIÓN DIRECTA: Guardar y subir a la nube de Firebase inmediatamente
    AppDB.save();

    // 3. REFRESCO VISUAL INMEDIATO EN EL BANNER SUPERIOR (JAQUE MATE AL FALLO)
    const bannerTitulo = document.getElementById("displayGerenciaName");
    if (bannerTitulo) {
        bannerTitulo.innerText = nuevoTitulo;
    }

    // 4. Registrar la acción en el historial de auditoría corporativa
    AppDB.addLog(App.currentUser.username, "CONFIG_GERENCIA", "Cambio de nombre a: " + nuevoTitulo);

    alert("¡POLÍTICAS ACTUALIZADAS! El nombre de la gerencia se ha guardado en la nube con éxito.");
    
    // Forzar recarga limpia para asegurar la sincronización en todas las pantallas
    location.reload();
};

App.validatePasswordStrength = function(pass) {
    if (pass.length < 8) return { valid: false, msg: "La clave debe poseer un mínimo de 8 caracteres." };
    if (!/[A-Z]/.test(pass)) return { valid: false, msg: "La clave debe incluir al menos una letra mayúscula." };
    if (!/[a-z]/.test(pass)) return { valid: false, msg: "La clave debe incluir al menos una letra minúscula." };
    if (!/[0-9]/.test(pass)) return { valid: false, msg: "La clave debe incluir al menos un número." };
    if (!/[!"#$%&&/()=.,]/.test(pass)) return { valid: false, msg: 'La clave debe contener obligatoriamente caracteres especiales como: !"#$%&&/()=.,' };
    return { valid: true };
};
/**
 * ADMINISTRACIÓN PARTE A: NÓMINA Y POLÍTICAS DE GERENCIA (app-admin-users.js - PARTE 2 DE 2)
 */

App.openCreateUserForm = function() {
    let opts = "";
    for(const r of Object.keys(AppDB.data.roles)) opts += `<option value="${r}">${r}</option>`;
    document.getElementById("modalContent").innerHTML = `
        <div class="modal-inner-header">
            <h3>Registrar Colaborador</h3>
            <button onclick="App.listUsersAdmin()">&times;</button>
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
    AppDB.save(); 
    alert("Usuario Registrado"); 
    this.listUsersAdmin();
};

App.listUsersAdmin = function() {
    // Código estándar para listar personal en el panel administrativo
    let html = `<div class="modal-inner-header">
        <h3>Nómina del Personal</h3>
        <button onclick="App.openAdminMenu()">&times;</button>
    </div>
    <div class="table-container custom-scrollbar">
        <table class="executive-table">
            <thead>
                <tr>
                    <th>Usuario</th>
                    <th>Nombre</th>
                    <th>Rol</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>`;
            
    for (const u of Object.values(AppDB.data.users)) {
        html += `<tr>
            <td><b>${u.username}</b></td>
            <td>${u.names} ${u.lastnames}</td>
            <td>${u.role}</td>
            <td>${u.status === 'active' ? '🟢 Activo' : '🔴 Bloqueado'}</td>
        </tr>`;
    }
    
    html += `</tbody></table></div>`;
    document.getElementById("modalContent").innerHTML = html;
};
