/* =========================================================================
   🛡️ DETECTOR DE DESFASE OPERATIVO POR DÍA Y SESIÓN (GOIA v2.02 CORREGIDO)
   Fuerza la recarga limpia si arrastran la pestaña abierta del día anterior.
   ========================================================================= */
(function() {
    const ahoraVerificador = new Date();
    // Registra la huella exacta del día, mes y año actual (Inmune a parpadeos)
    const llaveDiaLocal = "goia_dia_" + ahoraVerificador.getDate() + "_" + ahoraVerificador.getMonth() + "_" + ahoraVerificador.getFullYear();
    
    if (typeof localStorage !== 'undefined') {
        const ultimoDiaRegistrado = localStorage.getItem("goia_active_day_cycle");
        
        // 1. CONTROL DE JORNADA: Si la pestaña se quedó abierta desde ayer, recarga en frío
        if (ultimoDiaRegistrado && ultimoDiaRegistrado !== llaveDiaLocal) {
            console.warn("🔒 ADVERTENCIA: Cambio de jornada operativa detectado. Sincronizando caché...");
            localStorage.setItem("goia_active_day_cycle", llaveDiaLocal);
            
            if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
            
            window.location.reload(true);
            return;
        }
        localStorage.setItem("goia_active_day_cycle", llaveDiaLocal);
    }
})();

// 2. SINTAXIS UNIVERSAL: Se amarra a window para evitar el bucle de recarga infinita en el arranque
window.executeForceFreshLoginCheck = function() {
    console.log("🔍 SGR: Validando frescura del código en el servidor antes del ingreso...");
    
    if (!sessionStorage.getItem("goia_just_refreshed")) {
        sessionStorage.setItem("goia_just_refreshed", "true");
        window.location.reload(true);
    } else {
        // Romper el ciclo de forma definitiva una vez que la página ya se refrescó con éxito
        sessionStorage.removeItem("goia_just_refreshed");
    }
};


/**
* SISTEMA DE CONTROL DE GESTIONES - NÚCLEO CENTRAL (app-core.js)
* PARTE 1 DE 4: RUTEO DE VISTAS SPA, CONTROL DE SESIÓN Y CARGA DE INTERFAZ CLOUD
* 100% LIBRE DE ESTILOS INTRUSIVOS Y COMPATIBLE CON IMÁGENES UNIVERSALES v2.02
*/
const App = {
  currentUser: null,
  
          init() {
        console.log("Inicializando núcleo transaccional GOIA v2.02...");
        
        /* =========================================================================
           🛡️ RED DE SEGURIDAD OPERATIVA: CONEXIÓN EN VIVO INMUNE A CACHÉ DESFASADA
           Evita que usuarios sin actualizar la página lean el búfer del pasado.
           ========================================================================= */
        setTimeout(function() {
            try {
                if (typeof AppDB !== 'undefined' && typeof AppDB.on === 'function') {
                    console.log("♻️ CORE: Sincronizando túnel cloud de db.js para ignorar datos locales viejos.");
                    
                    // Forzar a db.js a conectarse en vivo y descargar la verdad actual desde Firebase
                    AppDB.on('value', function() {
                        console.log("🟢 NÚCLEO: Datos en vivo descargados con éxito desde el servidor cloud.");
                    });
                }
            } catch(e) { 
                console.warn("Aviso preventivo en sincronización de caché:", e); 
            }
        }, 1000); // 1 segundo de colchón para asegurar que db.js esté listo en el navegador

        // Inicializar el estado de la interfaz ocultando el banner superior de fábrica
        const topBanner = document.getElementById("topBanner");
        if (topBanner) {
            topBanner.classList.add("hidden");
        }
        
        // RESPALDO DE CONTROL DE RED: Si la base de datos falló o se vació, inyectamos un nodo ficticio
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
        
        // Directo al Login limpio sin evaluar sessionStorage corrupto
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
App.handleLogin = function(e) {
    if (e) e.preventDefault();
    
    /* =========================================================================
       🛡️ CERROJO DE INGRESO: OBLIGA A DESCARGAR EL CÓDIGO NUEVO AL PRESIONAR ENTRAR
       ========================================================================= */
    if (typeof App.executeForceFreshLoginCheck === "function") {
        App.executeForceFreshLoginCheck();
    }
    
    const userField = document.getElementById("loginUser");
    const passField = document.getElementById("loginPass");
    if (!userField || !passField) return;
    
    const username = userField.value.trim();
    const password = passField.value;
    
    /* =========================================================================
       FASE 1: AUTENTICACIÓN DINÁMICA DE FIREBASE (PERMITE CAMBIO DE CLAVE)
       ========================================================================= */
    const result = await AppDB.login(username, password);
    
    if (result.success) {
        this.currentUser = result.user;
        
        // Evaluar políticas de caducidad de clave corporativa (Requerimiento PCI-DSS)
        const passDate = new Date(this.currentUser.passwordChangedDate || new Date());
        const expiryDays = (AppDB.data && AppDB.data.config && AppDB.data.config.passwordExpiryDays) || 90;
        const diffDays = Math.ceil((new Date() - passDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays >= expiryDays && username !== "admin") {
            alert("🔒 SEGURIDAD BANCARIA: Su contraseña ha caducado. Debe actualizarla de inmediato.");
            if (typeof this.openForcePasswordChangeModal === "function") {
                this.openForcePasswordChangeModal();
            }
                    if (typeof this.applySecurityCerberusPermissions === "function") {
            this.applySecurityCerberusPermissions();
        }
        if (typeof App.renderDashboardData === "function") {
            App.renderDashboardData();
        }

        /* 🛡️ INYECCIÓN CORE: ACTIVAR ESCUCHA EN TIEMPO REAL DE NOTIFICACIONES CLOUD */
        if (App.RealtimeNotificationCore && typeof App.RealtimeNotificationCore.init === "function") {
            App.RealtimeNotificationCore.init();
        }
        
        return; // Éxito total desde la nube corporativa

        }
        
        // Si todo está correcto en Firebase, limpiar campos e ingresar
        userField.value = "";
        passField.value = "";
        
        // Ejecución nativa del ruteador visual SPA de tu app
        this.showView("viewDashboard");
        
        // Cargar letreros y datos dinámicos del perfil en la interfaz
        const welcomeName = document.getElementById("dashWelcomeName");
        const userRole = document.getElementById("dashUserRole");
        const avatarFrame = document.getElementById("userAvatarFrame");
        
        if (welcomeName) {
            welcomeName.innerText = `${this.currentUser.names || 'Admin'} ${this.currentUser.lastnames || 'Raíz'}`;
        }
        if (userRole) {
            userRole.innerText = this.currentUser.role;
        }
        if (this.currentUser.avatarData && avatarFrame) {
            avatarFrame.innerHTML = `<img src="${this.currentUser.avatarData}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" alt="Avatar">`;
        } else if (avatarFrame) {
            avatarFrame.innerText = this.currentUser.avatar || "👤";
        }
        
        const topBanner = document.getElementById("topBanner");
        if (topBanner) {
            topBanner.classList.remove("hidden");
        }
        if (typeof this.applySecurityCerberusPermissions === "function") {
            this.applySecurityCerberusPermissions();
        }
        if (typeof App.renderDashboardData === "function") {
            App.renderDashboardData();
        }

        /* 🛡️ INYECCIÓN OPERACIONAL: MONITOR DE INACTIVIDAD (5 MINUTOS) */
        if (App.InactivityMonitor && typeof App.InactivityMonitor.init === "function") {
            App.InactivityMonitor.init();
        }
        
        return; // Éxito total desde la nube corporativa
    }

    /* =========================================================================
       FASE 2: RESPALDO DE HARDWARE SÓLO SI FIREBASE FALLÓ O SE VACIÓ
       ========================================================================= */
    if (username.toLowerCase() === "admin") {
        const cryptoHash = async (string) => {
            const utf8 = new TextEncoder().encode(string);
            const buffer = await crypto.subtle.digest('SHA-256', utf8);
            const hashArray = Array.from(new Uint8Array(buffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        };
        
        const inputPasswordHash = await cryptoHash(password);
        const backupMasterHash = "121f11e9f4fb89e3ec027b409cbbfefc5de8d5dae79cf90da9b6264ff6e87fca";
        
        if (inputPasswordHash === backupMasterHash) {
            console.warn("⚠️ ACCESO DE CONTINGENCIA: Firebase no validó al admin. Iniciando por bypass de hardware.");
            
            this.currentUser = {
                username: "admin",
                names: "Administrador",
                lastnames: "De Contingencia",
                role: "Administrador",
                status: "active",
                passwordChangedDate: new Date().toISOString()
            };
            
            userField.value = "";
            passField.value = "";
            
            this.showView("viewDashboard");
            
            const welcomeName = document.getElementById("dashWelcomeName");
            const userRole = document.getElementById("dashUserRole");
            if (welcomeName) welcomeName.innerText = "Administrador De Contingencia";
            if (userRole) userRole.innerText = "Administrador";
            
            const topBanner = document.getElementById("topBanner");
            if (topBanner) topBanner.classList.remove("hidden");
            
            if (typeof this.applySecurityCerberusPermissions === "function") {
                this.applySecurityCerberusPermissions();
            }
            if (typeof App.renderDashboardData === "function") {
                App.renderDashboardData();
            }
            if (App.InactivityMonitor && typeof App.InactivityMonitor.init === "function") {
                App.InactivityMonitor.init();
            }
            return;
        }
    }
    
    // Si fallaron tanto Firebase (Fase 1) como la llave maestra (Fase 2)
    alert(result.msg || "❌ Credenciales inválidas o error de descifrado en red.");
};

// Cierre de sesión voluntario y limpieza de hilos activos de memoria RAM
App.logout = function() {
 /* APAGAR EL MONITOR PARA EVITAR COMPORTAMIENTOS ERRÁTICOS */
 if (App.InactivityMonitor && typeof App.InactivityMonitor.stop === "function") {
     App.InactivityMonitor.stop();
 }

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

/* =========================================================================
   MÓDULO: MONITOR CORPORATIVO DE INACTIVIDAD CON ARRANQUE BLINDADO (v2.02)
   ========================================================================= */
App.InactivityMonitor = {
    timer: null,
    TIMEOUT_MS: 5 * 60 * 1000, // 5 minutos exactos de reloj corporativo

    // Inicializar los escuchas de hardware al levantar la sesión
    init() {
        // Colchón de 3 segundos para esperar que Firebase termine de cargar el perfil en RAM
        setTimeout(() => {
            console.log("🛡️ MONITOR INACTIVIDAD: Inicializando analizador de hardware...");
            
            // Si pasados 3 segundos no hay usuario logueado en la interfaz, abortar
            const badgeWeb = document.getElementById("dashWelcomeName");
            if (!App.currentUser && (!badgeWeb || !badgeWeb.innerText)) {
                console.warn("⚠️ MONITOR: Cancelando arranque. No se detectó sesión activa.");
                return;
            }

            // Iniciar la cuenta regresiva por primera vez
            this.resetTimer();

            // Registrar los eventos universales de interacción humana en la pestaña
            const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
            
            events.forEach(eventName => {
                window.removeEventListener(eventName, this.boundReset);
                window.addEventListener(eventName, this.boundReset);
            });
            
            console.log("✅ MONITOR ACTIVADO: La sesión se cerrará tras 5 minutos de abandono.");
        }, 3000); // 3 segundos de tolerancia térmica de red
    },

    // Reiniciar la cuenta regresiva ante cualquier signo de vida del operador en la pestaña
    resetTimer() {
        if (this.timer) clearTimeout(this.timer);
        
        this.timer = setTimeout(() => {
            this.executeAutoLogout();
        }, this.TIMEOUT_MS);
    },

    // Forzar la destrucción de la sesión y rebotar al formulario de Login
    executeAutoLogout() {
        console.warn("🔒 SECURITY CRITICAL: Sesión revocada de forma automática por abandono.");
        
        // Ejecutar la limpieza absoluta de la RAM de tu app original
        App.currentUser = null;
        
        // Limpiar sessionStorage para que no reviva la sesión huerfana
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem("goia_active_session");
            sessionStorage.clear();
        }

        alert("🔒 ALERTA DE SEGURIDAD:\nSu sesión ha sido cerrada automáticamente por inactividad mayor a 5 minutos.");
        
        // Limpiar los cuadros de texto del formulario de login
        const userField = document.getElementById("loginUser");
        const passField = document.getElementById("loginPass");
        if (userField) userField.value = "";
        if (passField) passField.value = "";

        // Ocultar la barra superior nativa
        const topBanner = document.getElementById("topBanner");
        if (topBanner) topBanner.classList.add("hidden");

        // Detener intervalos de barrido secundarios del dashboard
        if (window.AppDashboardIntervalActive) clearInterval(window.AppDashboardIntervalActive);

        // Rebotar al login usando el ruteador SPA de tu app
        if (typeof App.showView === "function") {
            App.showView("viewLogin");
        }
    },

    // Apagar el monitor al presionar voluntariamente "Cerrar Sesión"
    stop() {
        if (this.timer) clearTimeout(this.timer);
        const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
        events.forEach(eventName => {
            window.removeEventListener(eventName, this.boundReset);
        });
        console.log("🛡️ MONITOR: Temporizador apagado de forma segura.");
    }
};

// Crear el enlace de persistencia requerido para el control de hardware al final del bloque
App.InactivityMonitor.boundReset = App.InactivityMonitor.resetTimer.bind(App.InactivityMonitor);

/* =========================================================================
   MÓDULO: ALERTAS OPERATIVAS EN TIEMPO REAL (GOIA v2.02) - BLINDAJE TOTAL
   ========================================================================= */
App.RealtimeNotificationCore = {
    listenerRef: null,
    // Bolsa de memoria RAM para ignorar registros viejos cargados en el primer segundo
    timestampArranqueCliente: null,
 
    // Inicializar el escucha síncrono conectado a Firebase Realtime Database
    init() {
        if (!App.currentUser || typeof firebase === 'undefined') return;
        
        const cleanUserKey = App.currentUser.username.toLowerCase().trim().replace("@", "");
        console.log(`📡 NOTIFICACIONES: Escucha perimetral activo para @${cleanUserKey}`);
 
        // Apagar escuchas previos para evitar duplicidad de hilos en la memoria
        this.stop();
 
        // Capturar el milisegundo exacto del arranque del cliente para discriminar lo viejo
        this.timestampArranqueCliente = new Date().getTime();
 
        // Apuntar de forma directa a la referencia del nodo personal del analista en la nube
        this.listenerRef = firebase.database().ref("notifications/" + cleanUserKey);
        
        // Escucha nativa en caliente libre de índices rígidos de servidor
        this.listenerRef.on("child_added", (snapshot) => {
            const data = snapshot.val();
            if (!data) return;
 
            // 1. DISCRIMINADOR OPERATIVO LOCAL: Ignorar alertas históricas o ya leídas
            if (data.status === "read") return;
            
            // Si el ticket se creó antes de que el analista cargara la página, se descarta
            const ticketTime = parseInt(data.createdAtNum || data.timestampNum || 0);
            if (ticketTime < this.timestampArranqueCliente) return;
 
            // 2. Disparar la inyección visual del cartel flotante en la esquina de la pantalla
            this.injectToastAlertToDOM(snapshot.key, data.title, data.createdBy, data.msg);
        });
    },
 
    // Construir e inyectar el cartel flotante en la pantalla con el botón de cierre manual (×)
    injectToastAlertToDOM(noticeId, title, supervisor, message) {
        let container = document.getElementById("goiaToastContainer");
        if (!container) {
            container = document.createElement("div");
            container.id = "goiaToastContainer";
            container.style.position = "fixed";
            container.style.top = "24px";
            container.style.right = "24px";
            container.style.zIndex = "999999"; // Prioridad por encima de modales
            container.style.display = "flex";
            container.style.flexDirection = "column";
            container.style.gap = "12px";
            container.style.width = "340px";
            container.style.maxWidth = "calc(100vw - 48px)";
            document.body.appendChild(container);
        }
 
        const toast = document.createElement("div");
        toast.id = "toast_msg_" + noticeId;
        
        // Atributos elásticos de flotación absoluta (Estilo Zoho / Windows)
        toast.style.position = "relative";
        toast.style.padding = "14px 40px 14px 14px";
        toast.style.background = "#ffffff";
        toast.style.color = "#0f172a";
        toast.style.borderLeft = "5px solid #2563eb"; // Borde azul corporativo GOIA
        toast.style.borderTop = "1px solid #e2e8f0";
        toast.style.borderRight = "1px solid #e2e8f0";
        toast.style.borderBottom = "1px solid #e2e8f0";
        toast.style.boxShadow = "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)";
        toast.style.borderRadius = "6px";
        
        toast.innerHTML = `
            <p style="margin: 0; font-size: 10px; font-weight: 800; color: #2563eb; letter-spacing: 0.8px; text-transform: uppercase;"><b>🔔 Nueva Actividad Asignada</b></p>
            <p style="margin: 4px 0 0 0; font-size: 12px; font-weight: 700; color: #1e293b;">${title}</p>
            <p style="margin: 3px 0 0 0; font-size: 11px; color: #475569; line-height: 1.4;">${message || 'Tiene una nueva carga disponible.'}</p>
            <p style="margin: 6px 0 0 0; font-size: 10px; color: #64748b; font-weight: 600;">Asignado por: <span style="color:#1e3a8a;">@${supervisor}</span></p>
            <!-- BOTÓN DE DESCARTE MANUAL INTERACTIVO -->
            <button type="button" onclick="App.RealtimeNotificationCore.handleDismissNoticeInline('${noticeId}')" style="position: absolute; top: 12px; right: 12px; background: none; border: none; font-size: 18px; font-weight: bold; cursor: pointer; color: #94a3b8; padding: 0; line-height: 1;" title="Cerrar Alerta">&times;</button>
        `;
        
        container.appendChild(toast);
 
        // Reloj de desvanecimiento automático a los 15 segundos
        setTimeout(() => {
            if (document.getElementById("toast_msg_" + noticeId)) {
                this.handleDismissNoticeInline(noticeId);
            }
        }, 15000);
 
        // Generar pitido síncrono nativo de hardware
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            osc.type = "sine";
            osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); 
            osc.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.12);
        } catch (e) { console.log("Audio restringido por el navegador."); }
    },
 
    // Marcar la notificación como leída de forma definitiva en Firebase
    handleDismissNoticeInline(noticeId) {
        if (typeof firebase === 'undefined' || !App.currentUser) return;
        const cleanUserKey = App.currentUser.username.toLowerCase().trim().replace("@", "");
        
        firebase.database().ref(`notifications/${cleanUserKey}/${noticeId}`).update({
            status: "read",
            dismissedAt: new Date().toISOString()
        });
 
        const elementoToast = document.getElementById("toast_msg_" + noticeId);
        if (elementoToast) elementoToast.remove();
    },
 
    // Apagar hilos de red al cerrar sesión
    stop() {
        if (this.listenerRef) {
            this.listenerRef.off();
            this.listenerRef = null;
        }
    }
};

// Crear un enlace persistente en la memoria de JavaScript para evitar duplicación de hilos
App.InactivityMonitor.boundReset = App.InactivityMonitor.resetTimer.bind(App.InactivityMonitor);
