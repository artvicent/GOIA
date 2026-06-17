/**
* SISTEMA DE CONTROL DE GESTIONES - NÚCLEO CENTRAL (app-core.js)
* PARTE 1 DE 4: RUTEO DE VISTAS SPA, CONTROL DE SESIÓN Y CARGA DE INTERFAZ CLOUD
* 100% LIBRE DE ESTILOS INTRUSIVOS Y COMPATIBLE CON IMÁGENES UNIVERSALES v2.02
*/
const App = {
  currentUser: null,
  
  init() {
    console.log("Inicializando núcleo transaccional GOIA v2.02...");
    
    // Inicializar el estado de la interfaz ocultando el banner superior de fábrica
    const topBanner = document.getElementById("topBanner");
    if (topBanner) {
      topBanner.classList.add("hidden");
    }
    
    // RESPALDO DE CONTROL DE RED: Si la base de datos falló o se vació, inyectamos un nodo ficticio para que el sistema no muera
    if (typeof AppDB === 'undefined' || !AppDB.data) {
        console.warn("⚠️ ALERTA: Red Cloud caída. Inicializando entorno de contingencia local.");
        window.AppDB = window.AppDB || {};
        AppDB.data = AppDB.data || { config: { passwordExpiryDays: 90 }, roles: { "Administrador": { lvl: 3 } } };
        AppDB.login = async function() { return { success: false, msg: "Modo contingencia activo." }; };
    }

    // SINCRONIZACIÓN UNIVERSAL EN FRÍO DEL LOGO INSTITUCIONAL
    if (AppDB.data && AppDB.data.config && AppDB.data.config.brandLogoBase64) {
      const logoImg = document.getElementById("appLogoImg");
      if (logoImg) {
        logoImg.src = AppDB.data.config.brandLogoBase64;
      }
    }
    this.showView("viewLogin");
  },

  // Ruteador lógico SPA puro basado en clases CSS .hidden
  showView(viewId) {
    const views = ["viewLogin", "viewDashboard"];
    views.forEach(function(id) {
      const el = document.getElementById(id);
      if (el) {
        if (id === viewId) {
          el.classList.remove("hidden");
        } else {
          el.classList.add("hidden");
        }
      }
    });
  },

  // Cargar los letreros y componentes dinámicos del perfil al ingresar con éxito
  setupDashboardView() {
    if (!this.currentUser) return;
    
    const welcomeName = document.getElementById("dashWelcomeName");
    const userRole = document.getElementById("dashUserRole");
    const avatarFrame = document.getElementById("userAvatarFrame");
    
    if (welcomeName) {
      // Corrección de respaldo si entras por bypass de hardware
      welcomeName.innerText = `${this.currentUser.names || 'Admin'} ${this.currentUser.lastnames || 'Raíz'}`;
    }
    if (userRole) {
      userRole.innerText = this.currentUser.role;
    }
    
    // SINCRONIZACIÓN UNIVERSAL DE LA FOTO DEL COLABORADOR
    if (this.currentUser.avatarData) {
      if (avatarFrame) {
        avatarFrame.innerHTML = `<img src="${this.currentUser.avatarData}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" alt="Avatar">`;
      }
    } else {
      if (avatarFrame) {
        avatarFrame.innerText = this.currentUser.avatar || "👤";
      }
    }
    
    // Mostrar el banner superior de control de forma limpia
    const topBanner = document.getElementById("topBanner");
    if (topBanner) {
      topBanner.classList.remove("hidden");
    }
    
    // Protección para evitar caídas si las funciones secundarias no cargaron
    if (typeof this.applySecurityCerberusPermissions === "function") {
        this.applySecurityCerberusPermissions();
    }
    
    this.showView("viewDashboard");
    
    // Disparar render de tablas operacionales del archivo app-executive
    if (typeof App.renderDashboardData === "function") {
      App.renderDashboardData();
    }
  }
};

/**
 * SISTEMA DE CONTROL DE GESTIONES - NÚCLEO CENTRAL (app-core.js)
 * PARTE 2 DE 4: PROCESAMIENTO DE LOGIN, CONTROL DE INTENTOS Y CIERRE DE SESIÓN CORREGIDO
 */

/**
* SISTEMA DE CONTROL DE GESTIONES - NÚCLEO CENTRAL (app-core.js)
* PARTE 2 DE 4: PROCESAMIENTO DE LOGIN, CONTROL DE INTENTOS Y CIERRE DE SESIÓN CORREGIDO
*/
App.handleLogin = async function(e) {
    e.preventDefault();
    
    const userField = document.getElementById("loginUser");
    const passField = document.getElementById("loginPass");
    if (!userField || !passField) return;
    
    const username = userField.value.trim();
    const password = passField.value;
    
    /* =========================================================================
       PUERTA DE ENLACE DE EMERGENCIA: BYPASS DE HARDWARE (GOIA v2.02)
       ========================================================================= */
    if (username.toLowerCase() === "admin" && password === "AdminSeguro2026$#") {
        console.warn("🔒 ACCESO DE RECUPERACIÓN: Autenticación maestra forzada por hardware.");
        
        // Objeto de usuario raíz simulado con máxima jerarquía
        this.currentUser = {
            username: "admin",
            names: "Administrador",
            lastnames: "General",
            role: "Administrador",
            status: "active",
            passwordChangedDate: new Date().toISOString()
        };
        
        // Limpiar los cuadros de texto del formulario
        userField.value = "";
        passField.value = "";
        
        // Inicializar la interfaz operativa
        this.setupDashboardView();
        return; // Detiene el flujo e ignora la base de datos vacía
    }
    
    /* =========================================================================
       FLUJO ORDINARIO DE LA PLATAFORMA CLOUD (CONEXIÓN CON FIREBASE)
       ========================================================================= */
    const result = await AppDB.login(username, password);
    
    if (result.success) {
        this.currentUser = result.user;
        
        // Evaluar políticas de caducidad de clave corporativa (Requerimiento PCI-DSS)
        const passDate = new Date(this.currentUser.passwordChangedDate);
        const expiryDays = (AppDB.data && AppDB.data.config && AppDB.data.config.passwordExpiryDays) || 90;
        const diffDays = Math.ceil((new Date() - passDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays >= expiryDays && username !== "admin") {
            alert("🔒 SEGURIDAD BANCARIA: Su contraseña ha caducado. Debe actualizarla de inmediato.");
            if (typeof this.openForcePasswordChangeModal === "function") {
                this.openForcePasswordChangeModal();
            }
            return;
        }
        
        // Si la clave es la de fábrica, forzar la actualización preventiva
        if (password === "Admin2026*" && username === "admin") {
            alert("⚠️ ALERTA: Utiliza la contraseña genérica. Modifíquela por políticas de resguardo.");
            if (typeof this.openForcePasswordChangeModal === "function") {
                this.openForcePasswordChangeModal();
            }
            return;
        }
        
        userField.value = "";
        passField.value = "";
        
        // Levantar la pantalla principal sincronizada universalmente
        this.setupDashboardView();
        
    } else {
        alert(result.msg);
    }
};


// Cierre de sesión voluntario y limpieza de hilos activos de memoria RAM
App.logout = function() {
    if (this.currentUser) {
        AppDB.addLog(this.currentUser.username, "LOGOUT", "Cierre de sesion voluntario.");
    }
    this.currentUser = null;
    
    const userField = document.getElementById("loginUser");
    const passField = document.getElementById("loginPass");
    if (userField) userField.value = "";
    if (passField) passField.value = "";
    
    const topBanner = document.getElementById("topBanner");
    if (topBanner) {
        topBanner.classList.add("hidden");
    }
    
    this.showView("viewLogin");
    alert("Sesión finalizada de forma segura.");
};
/**
 * SISTEMA DE CONTROL DE GESTIONES - NÚCLEO CENTRAL (app-core.js)
 * PARTE 3 DE 4: MATRIZ DE PERMISOS JERÁRQUICOS Y RECUPERACIÓN DE ACCESOS
 */

// CERROJO DE PERMISOS: Validación de jerarquías basada en clases CSS semánticas
App.applySecurityCerberusPermissions = function() {
    if (!this.currentUser) return;
    
    /* =========================================================================
       BYPASS DE SEGURIDAD OPERATIVA: DESTRABAR USUARIO ADMIN EN CALIENTE
       ========================================================================= */
    const isMaster = (this.currentUser.username === "admin");
    
    // Si entraste usando la clave de hardware de emergencia, forzamos la liberación del objeto en memoria
    if (isMaster) {
        if (typeof AppDB !== 'undefined' && AppDB.data && AppDB.data.users) {
            // Si el objeto admin existe en el JSON de Firebase pero dice bloqueado, lo reescribimos
            if (AppDB.data.users["admin"]) {
                AppDB.data.users["admin"].status = "active";
                AppDB.data.users["admin"].failedAttempts = 0;
            } else {
                // Si el nodo desapareció por completo al limpiar la BD, lo volvemos a fundar en frío
                AppDB.data.users["admin"] = {
                    username: "admin",
                    names: "Administrador",
                    lastnames: "De Fábrica",
                    role: "Administrador",
                    status: "active",
                    failedAttempts: 0,
                    passwordChangedDate: new Date().toISOString()
                };
            }
            
            // Si tu motor db.js tiene activa la función para guardar, la disparamos
            if (typeof AppDB.save === "function") {
                AppDB.save(); 
                console.log("🔒 NÚCLEO GOIA: Estado del Administrador liberado y guardado en Firebase.");
            }
        }
    }
 
    const btnAdmin = document.getElementById("btnAdminPanel");
    const btnNewAsig = document.getElementById("btnNewAssignment");
    
    const userRole = this.currentUser.role;
    const roleMeta = (AppDB.data && AppDB.data.roles && AppDB.data.roles[userRole]) ? AppDB.data.roles[userRole] : { lvl: 3 };
    const userLevel = (roleMeta && typeof roleMeta.lvl !== 'undefined') ? roleMeta.lvl : 1;
    const permissions = (roleMeta && roleMeta.perms) ? roleMeta.perms : [];
 
    // REGLA DE ORO PCI: Solo Administradores (lvl 3) o Gerentes (lvl 4) ven Ajustes y Usuarios
    if (btnAdmin) {
        if (isMaster || userLevel >= 3) {
            btnAdmin.classList.remove("hidden");
        } else {
            btnAdmin.classList.add("hidden");
        }
    }
 
    // CONTROL DE ASIGNACIÓN: El comportamiento visual se delega 100% a la clase .hidden
    if (btnNewAsig) {
        if (isMaster || userLevel >= 3 || permissions.includes("crear")) {
            btnNewAsig.classList.remove("hidden");
        } else {
            btnNewAsig.classList.add("hidden");
        }
    }
};


// Abrir formulario corporativo de blanqueo o recuperación de accesos bloqueados
App.showRecoveryFormGlobal = function() {
    document.getElementById("modalOverlay").classList.remove("hidden");
    document.getElementById("modalContent").innerHTML = `
        <div class="modal-inner-header">
            <h3>Restablecer Credenciales de Acceso</h3>
            <button onclick="document.getElementById('modalOverlay').classList.add('hidden')">&times;</button>
        </div>
        
        <form id="fRecovery" onsubmit="App.executeRecoveryWorkflow(event)" class="admin-config-card">
            <div class="form-group">
                <label>Usuario Corporativo Afectado</label>
                <input type="text" id="recUser" required class="form-control" placeholder="Ej: jperez">
            </div>
            
            <div class="form-group mt-2">
                <label>Pregunta de Seguridad Obligatoria</label>
                <input type="text" class="form-control" value="¿Cuál es el nombre de su primera mascota?" disabled>
            </div>
            
            <div class="form-group mt-2">
                <label>Respuesta Secreta de Validación</label>
                <input type="text" id="recAnswer" required class="form-control" placeholder="Escriba su respuesta">
            </div>
            
            <div class="form-group mt-2">
                <label>Nueva Contraseña Solicitada</label>
                <input type="password" id="recNewPass" required class="form-control" placeholder="••••••••">
            </div>
            
            <div class="modal-action-row-footer">
                <button type="submit" class="btn-primary-submit">Blanquear Acceso</button>
                <button type="button" onclick="document.getElementById('modalOverlay').classList.add('hidden')" class="btn-secondary-cancel">Cancelar</button>
            </div>
        </form>
    `;
};

// Procesar el flujo de recuperación y desbloqueo cloud en caliente
App.executeRecoveryWorkflow = function(e) {
    e.preventDefault();
    
    const u = document.getElementById("recUser").value.toLowerCase().trim();
    const ans = document.getElementById("recAnswer").value.toLowerCase().trim();
    const newPass = document.getElementById("recNewPass").value;
    
    const user = AppDB.data.users[u];
    if (!user) return alert("Operación rechazada: El usuario ingresado no existe en la nómina cloud.");
    
    // Validar concordancia de respuesta con el Hash sembrado en la base de datos
    if (user.securityQuestions && user.securityQuestions.a === AppDB.hash(ans)) {
        
        // Ejecutar validación de robustez de contraseña nativa
        if (typeof App.validatePasswordStrength === "function") {
            const check = App.validatePasswordStrength(newPass);
            if (!check.valid) return alert(check.msg);
        }
        const hashedNewPass = AppDB.hash(newPass);
        
        // Actualizar datos, reiniciar intentos fallidos y desbloquear cuenta
        user.password = hashedNewPass;
        user.failedAttempts = 0;
        user.status = "active";
        user.passwordChangedDate = new Date().toISOString();
        if (!user.passwordHistory) user.passwordHistory = [];
        user.passwordHistory.push(hashedNewPass);
        
        AppDB.save();
        AppDB.addLog(u, "RECUPERACION_EXITOSA", "El usuario restableció su clave y desbloqueó la cuenta.");
        
        document.getElementById("modalOverlay").classList.add("hidden");
        alert("¡AUTENTICACIÓN INTEGRAL CONCLUIDA! Su contraseña ha sido modificada y su cuenta se encuentra activa.");
    } else {
        alert("Validación fallida: La respuesta secreta ingresada es incorrecta.");
    }
};
/* =========================================================================
   MÓDULO DE PROCESAMIENTO, BLINDAJE Y TRANSMISIÓN DE IMÁGENES A LA NUBE (v2.02)
   ========================================================================= */

// 1. Procesar y transmitir la foto del Colaborador a Firebase Cloud
App.handleUploadUserAvatarCloud = function(inputElement) {
    if (!inputElement || !inputElement.files || inputElement.files.length === 0) return;
    
    var file = inputElement.files[0]; // Extraer el archivo real de la PC
    
    // Filtro estricto: Máximo 800KB para resguardar la velocidad de red del cifrado XOR
    if (file.size > 800 * 1024) {
        alert("⚠️ Archivo excedido: Para optimizar el rendimiento entre terminales, la foto de perfil no debe superar los 800 KB.");
        return;
    }

    var reader = new FileReader();
    reader.onload = function(e) {
        var base64Image = e.target.result;
        
        if (typeof AppDB === 'undefined' || !AppDB.data) {
            alert("Error: El motor AppDB no está disponible.");
            return;
        }
        
        var currentUserKey = (App.currentUser && App.currentUser.username) ? App.currentUser.username : "admin";
        if (!AppDB.data.users) AppDB.data.users = {};
        if (AppDB.data.users[currentUserKey]) {
            // SE ALMACENA DIRECTAMENTE EN LA NUBE DE GOOGLE FIREBASE
            AppDB.data.users[currentUserKey].avatarData = base64Image;
        }
        
        AppDB.addLog(currentUserKey, "CARGA_AVATAR", "El usuario actualizó su foto de perfil de forma universal.");
        
        // Transmisión digital inmediata con empaquetado seguro
        AppDB.save();

        // Actualizar el elemento visual en caliente
        var frame = document.getElementById("userAvatarFrame");
        if (frame) {
            frame.innerHTML = `<img src="${base64Image}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" alt="Avatar">`;
        }
        alert("¡Éxito! Foto de perfil blindada en la nube. Se visualizará igual en cualquier computadora.");
    };
    reader.readAsDataURL(file);
};

// 2. Procesar y transmitir el Logotipo de la Gerencia a Firebase Cloud
App.handleUploadBrandLogoCloud = function(inputElement) {
    if (!inputElement || !inputElement.files || inputElement.files.length === 0) return;
    
    var file = inputElement.files[0]; // Extraer el archivo de logotipo de la PC
    
    if (file.size > 1024 * 1024) {
        alert("⚠️ Archivo excedido: El logotipo corporativo universal no debe superar 1 Megabyte (1MB).");
        return;
    }

    var reader = new FileReader();
    reader.onload = function(e) {
        var base64Logo = e.target.result;
        
        if (typeof AppDB === 'undefined' || !AppDB.data) {
            alert("Error: El motor AppDB no está disponible.");
            return;
        }
        if (!AppDB.data.config) AppDB.data.config = {};
        
        // SE EMBALA EN EL NODO CENTRAL DE CONFIGURACIÓN GLOBAL TRANSMITIDO
        AppDB.data.config.brandLogoBase64 = base64Logo;
        
        var currentUserKey = (App.currentUser && App.currentUser.username) ? App.currentUser.username : "admin";
        AppDB.addLog(currentUserKey, "MODIFICAR_LOGO_CORP", "Se ha actualizado el logotipo institucional de la pantalla de acceso universal.");
        
        AppDB.save();

        // Refrescar el elemento visual en la pantalla de login de inmediato
        var logoImg = document.getElementById("appLogoImg");
        if (logoImg) {
            logoImg.src = base64Logo;
        }
        alert("¡Éxito! Logotipo de la gerencia actualizado globalmente en internet.");
    };
    reader.readAsDataURL(file);
};

// =========================================================================
// DISPARADOR GLOBAL DE ARRANQUE CON RETARDO DE RED (WINDOW ONLOAD)
// =========================================================================
window.onload = function() {
    // Retardo controlado de red (600ms) para garantizar que db.js descargó y descifró el árbol antes de inicializar la interfaz
    setTimeout(function() {
        if (typeof App.init === "function") {
            App.init();
        }
    }, 600);
};
