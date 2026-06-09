/**
 * ADMINISTRACIÓN PARTE A: NÓMINA Y POLÍTICAS DE GERENCIA (app-admin-users.js)
 * PARTE 1 DE 2: CONTROL DE PANEL MAESTRO Y CONFIGURACIONES ADMINISTRATIVAS
 * 100% LIBRE DE ESTILOS INTRUSIVOS Y PROPIEDADES .STYLE
 */

// Desplegar el panel general de administración para usuarios autorizados
App.openAdminMenu = function() {
    document.getElementById("modalOverlay").classList.remove("hidden");
    var currentExpiry = AppDB.data.config.passwordExpiryDays || 90;

    document.getElementById("modalContent").innerHTML = `
        <div class="modal-inner-header">
            <h3>Panel de Personal y Políticas</h3>
            <button onclick="document.getElementById('modalOverlay').classList.add('hidden')">&times;</button>
        </div>
        
        <div class="form-group admin-config-card">
            <label>Nombre de Gerencia / Programa</label>
            <div class="input-inline-row">
                <input type="text" id="inputEditGerencia" class="form-control" value="${AppDB.data.config.title}">
                <button onclick="App.saveAdministrativeConfig()" class="btn-primary">Aplicar</button>
            </div>
            
            <label class="mt-2">Expiración de Contraseñas del Personal</label>
            <select id="selectPasswordExpiry" class="form-control full-width">
                <option value="30" ${currentExpiry==30?'selected':''}>Vencimiento cada 30 Días</option>
                <option value="60" ${currentExpiry==60?'selected':''}>Vencimiento cada 60 Días</option>
                <option value="90" ${currentExpiry==90?'selected':''}>Vencimiento cada 90 Días</option>
            </select>
        </div>

        <!-- MÓDULO DE REINICIO DE FÁBRICA SÍNCRONO CON FIREBASE -->
        <div class="maintenance-critical-card">
            <label>🚨 Mantenimiento Crítico de Servidor</label>
            <p>Al presionar este comando se purgarán de la nube de Firebase todos los registros de auditoría, las tareas cargadas y el personal secundario de forma definitiva.</p>
            <button onclick="App.executeHardResetDatabaseCloud()" class="btn-danger-reset">💥 REINICIAR BASE DE DATOS DE FÁBRICA</button>
        </div>

        <div class="modal-grid-buttons">
            <button onclick="App.openRolesMenu()" class="btn-primary bg-navy">🔑 ROLES Y PERMISOS</button>
            <button onclick="App.openManagementsMenu()" class="btn-primary bg-sky">📋 CATALOGO GESTIONES</button>
        </div>
        <div class="modal-grid-buttons">
            <button onclick="App.openCreateUserForm()" class="btn-primary">➕ Crear Usuario</button>
            <button onclick="App.listUsersAdmin()" class="btn-secondary font-bold">👥 Nómina Personal</button>
        </div>
        <div class="modal-single-row">
            <button onclick="App.openAuditLogsMenu()" class="btn-primary bg-crimson">🔎 VER HISTORIAL DE AUDITORÍA (LOGS)</button>
        </div>`;
};

// Procesar el cambio de nombre corporativo de la gerencia en la nube
App.saveAdministrativeConfig = function() {
    const nuevoTitulo = document.getElementById("inputEditGerencia").value.trim();
    const nuevaExpiracion = parseInt(document.getElementById("selectPasswordExpiry").value);
    
    if (!nuevoTitulo) {
        return alert("Por favor, ingrese un nombre válido para la Gerencia.");
    }

    AppDB.data.config.title = nuevoTitulo;
    AppDB.data.config.passwordExpiryDays = nuevaExpiracion;

    AppDB.save();

    const bannerTitulo = document.getElementById("displayGerenciaName");
    if (bannerTitulo) {
        bannerTitulo.innerText = nuevoTitulo;
    }

    AppDB.addLog(App.currentUser.username, "CONFIG_GERENCIA", "Cambio de nombre a: " + nuevoTitulo);
    alert("¡POLÍTICAS ACTUALIZADAS! El nombre de la gerencia se ha guardado en la nube con éxito.");
    location.reload();
};

// Validador estricto de robustez de contraseñas (Normativa de Cumplimiento Bancario)
App.validatePasswordStrength = function(pass) {
    if (pass.length < 8) return { valid: false, msg: "La clave debe poseer un mínimo de 8 caracteres." };
    if (!/[A-Z]/.test(pass)) return { valid: false, msg: "La clave debe incluir al menos una letra mayúscula." };
    if (!/[a-z]/.test(pass)) return { valid: false, msg: "La clave debe incluir al menos una letra minúscula." };
    if (!/[0-9]/.test(pass)) return { valid: false, msg: "La clave debe incluir al menos un número." };
    if (!/[!"#$%&&/()=.,]/.test(pass)) return { valid: false, msg: 'La clave debe contener obligatoriamente caracteres especiales como: !"#$%&&/()=.,' };
    return { valid: true };
};
/**
 * ADMINISTRACIÓN PARTE A: NÓMINA Y POLÍTICAS DE GERENCIA (app-admin-users.js)
 * PARTE 2 DE 2: FORMULARIO DE CAPTURA Y LISTADO DE PERSONAL SANEADO
 */

// Desplegar el formulario puro para registrar personal secundario de la gerencia
App.openCreateUserForm = function() {
    let opts = "";
    if (AppDB.data && AppDB.data.roles) {
        for (const r of Object.keys(AppDB.data.roles)) {
            opts += `<option value="${r}">${r}</option>`;
        }
    }
    
    document.getElementById("modalContent").innerHTML = `
        <div class="modal-inner-header">
            <h3>Registrar Colaborador</h3>
            <button onclick="App.listUsersAdmin()">&times;</button>
        </div>
        <div class="maintenance-critical-card bg-ied-banner-info">
            <p class="alert-item-title text-emerald-dark"><b>🔑 DIRECTIVA DE CONTRASEÑA NUEVA:</b></p>
            <p class="report-footer-disclaimer text-emerald-dark">Mínimo 8 letras, incluir Mayúscula, Minúscula, Número y caracteres especiales: <b>!"#$%&/()=.,</b></p>
        </div>
        <form id="fUser" onsubmit="App.executeCreateUser(event)" class="admin-config-form-layout">
            <input type="text" id="rUser" required class="form-control" placeholder="Usuario Corporativo">
            <input type="password" id="rPass" required class="form-control" placeholder="Contraseña Inicial Segura">
            <input type="text" id="rName" required class="form-control" placeholder="Nombres">
            <input type="text" id="rLast" required class="form-control" placeholder="Apellidos">
            <input type="text" id="rCed" required class="form-control" placeholder="Cédula">
            <input type="email" id="rEmail" required class="form-control" placeholder="Correo">
            <select id="rRole" class="form-control full-width">${opts}</select>
            <input type="text" id="rAns" required class="form-control" placeholder="Respuesta Secreta: Mascota">
            <div class="modal-action-row-footer">
                <button type="submit" class="btn-primary-submit">GUARDAR</button>
                <button type="button" onclick="App.listUsersAdmin()" class="btn-secondary-cancel">CANCELAR</button>
            </div>
        </form>`;
};

// Procesar el registro del nuevo usuario y cifrar credenciales iniciales
App.executeCreateUser = function(e) {
    e.preventDefault();
    const u = document.getElementById("rUser").value.toLowerCase().trim();
    if (AppDB.data.users[u]) return alert("Usuario duplicado");
    
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
    alert("Usuario Registrado de forma exitosa en la nube."); 
    this.listUsersAdmin();
};

// Mostrar la nómina completa del personal sin inyecciones visuales directas
App.listUsersAdmin = function() {
    let html = `
    <div class="modal-inner-header">
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
            
    if (AppDB.data && AppDB.data.users) {
        for (const u of Object.values(AppDB.data.users)) {
            html += `<tr>
                <td><b>${u.username}</b></td>
                <td>${u.names} ${u.lastnames}</td>
                <td>${u.role}</td>
                <td><span class="badge-reference font-bold">${u.status === 'active' ? '🟢 Activo' : '🔴 Bloqueado'}</span></td>
            </tr>`;
        }
    }
    
    html += `</tbody></table></div>
    <div class="modal-action-row-footer">
        <button onclick="App.openAdminMenu()" class="btn-secondary-cancel">Regresar</button>
    </div>`;
    
    document.getElementById("modalContent").innerHTML = html;
};
// =========================================================================
// MÓDULO LOGÍSTICO PREMIUM: CAPTURA, COMPRESIÓN Y SUBIDA DE LOGO DESDE PC A FIREBASE
// =========================================================================
App.handleUploadSystemLogoFromPC = function() {
    var fileInput = document.getElementById("inputLogoFilePC");
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        alert("⚠️ Por favor, seleccione primero una imagen (.png, .jpeg o .jpg) desde los archivos de su PC.");
        return;
    }

    var elArchivo = fileInput.files[0];
    
    // Control de peso de seguridad para optimizar la velocidad de carga de Firebase
    if (elArchivo.size > 800 * 1024) { 
        alert("⚠️ La imagen seleccionada es muy pesada. Por favor, elija un logotipo corporativo de menos de 800 KB.");
        return;
    }

    var lectorDeDisco = new FileReader();
    
    lectorDeDisco.onload = function(evento) {
        var cadenaBase64Segura = evento.target.result;

        // Inyección directa en caliente al nodo de configuración global de Firebase Realtime Database
        firebase.database().ref("config/logoBase64").set(cadenaBase64Segura)
            .then(function() {
                // Sincroniza la caché interna de la aplicación de inmediato para evitar retardos
                if (typeof AppDB !== 'undefined' && AppDB.data && AppDB.data.config) {
                    AppDB.data.config.logoBase64 = cadenaBase64Segura;
                }
                
                alert("✅ ¡Éxito de Sincronización Cloud!\n\nEl nuevo logotipo de la PC ha sido subido e implantado como imagen del sistema.");
                
                // Hace el cambio visible en tiempo real en la pantalla actual
                var logoLogin = document.getElementById("appLogoImg");
                if (logoLogin) {
                    logoLogin.src = cadenaBase64Segura;
                }
            })
            .catch(function(error) {
                console.error("Error crítico de escritura en Firebase: ", error);
                alert("❌ Fallo de comunicación: El servidor de red rechazó la carga de la foto corporativa.");
            });
    };

    // Dispara el lector de archivos binarios de Windows/Mac y lo transforma a string Base64
    lectorDeDisco.readAsDataURL(elArchivo);
};

// =========================================================================
// ACCIÓN A: PROCESAR FOTO REAL DE LA PC (.PNG / .JPEG) MEDIANTE BASE64
// =========================================================================
App.handleUploadAvatarFromPC = function() {
    var fileInput = document.getElementById("inputAvatarFilePC");
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        alert("⚠️ Por favor, seleccione primero un archivo de imagen en su computadora.");
        return;
    }

    var file = fileInput.files[0];
    
    // Control de tamaño para evitar la saturación de los canales de red de Firebase
    if (file.size > 500 * 1024) { 
        alert("⚠️ La imagen es muy grande. Elija una foto de perfil optimizada de menos de 500 KB.");
        return;
    }

    var reader = new FileReader();
    reader.onload = function(e) {
        var base64Str = e.target.result;

        // Obtenemos el ID del usuario activo en la aplicación
        var userId = App.currentUserId || "currentUser"; 

        // Guardamos la foto real de forma permanente en el nodo de usuarios de Firebase
        firebase.database().ref("users/" + userId + "/avatar").set(base64Str)
            .then(function() {
                alert("✅ ¡Foto de perfil cargada y guardada con éxito!");
                document.getElementById("modalOverlay").classList.add("hidden");
                
                // Actualizamos el círculo de tu perfil en el Dashboard de inmediato
                var frame = document.getElementById("userAvatarFrame");
                if (frame) {
                    frame.innerHTML = `<img src="${base64Str}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
                }
            })
            .catch(function(error) {
                alert("❌ Error de comunicación de red al intentar subir la foto.");
            });
    };

    reader.readAsDataURL(file); // Transforma el archivo de tu PC a texto seguro Base64
};

// =========================================================================
// ACCIÓN B: GUARDAR EMOTICONO SELECCIONADO DIRECTO DE LA RETÍCULA DEL MODAL
// =========================================================================
App.handleSelectEmojiAvatarInline = function(emojiSelected) {
    var userId = App.currentUserId || "currentUser";

    // Guardamos el emoji de forma nativa en la base de datos cloud de la gerencia
    firebase.database().ref("users/" + userId + "/avatar").set(emojiSelected)
        .then(function() {
            alert("✅ Perfil actualizado con el avatar: " + emojiSelected);
            document.getElementById("modalOverlay").classList.add("hidden");
            
            // Actualizamos la pantalla al ras en caliente
            var frame = document.getElementById("userAvatarFrame");
            if (frame) {
                frame.innerHTML = emojiSelected;
            }
        })
        .catch(function() {
            alert("❌ Fallo en el servidor al intentar guardar el avatar.");
        });
};
