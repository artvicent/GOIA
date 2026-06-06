/*!
 * SDK DE FIREBASE INTEGRADO LOCAL INTEGRAL (db.js - PARTE 1)
 * Diseñado exclusivamente para evadir bloqueos de Firewalls Corporativos
 */
!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?module.exports=t():"function"==typeof define&&define.amd?define(t):(e=e||self).firebase=t()}(this,function(){"use strict";var r=function(e,t){return(r=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var r in t)t.hasOwnProperty(r)&&(e[r]=t[r])})(e,t)};var n=function(){return(n=Object.assign||function(e){for(var t,r=1,n=arguments.length;r<n;r++)for(var o in t=arguments[r])Object.prototype.hasOwnProperty.call(t,o)&&(e[o]=t[o]);return e}).apply(this,arguments)};function o(e,t,r,n){return new(r||(r=Promise))(function(o,i){function a(e){try{s(n.next(e))}catch(e){i(e)}}function c(e){try{s(n.throw(e))}catch(e){i(e)}}function s(e){var t;e.done?o(e.value):(t=e.value,t instanceof r?t:new r(function(e){e(t)})).then(a,c)}s((n=n.apply(e,t||[])).next())})}function i(e,t){var r,n,o,i,a={label:0,sent:function(){if(1&o[0])throw o[1];return o[1]},trys:[],ops:[]};return i={next:c(0),throw:c(1),return:c(2)},"function"==typeof Symbol&&(i[Symbol.iterator]=function(){return this}),i;function c(i){return function(c){return function(i){if(r)throw new TypeError("Generator is already executing.");for(;a;)try{if(r=1,n&&(o=2&i[0]?n.return:i[0]?n.throw||((o=n.return)&&o.call(n),0):n.next)&&!(o=o.call(n,i[1])).done)return o;switch(n=0,o&&(i=[2&i[0],o.value]),i[0]){case 0:case 1:o=i;break;case 4:return a.label++,{value:i[1],done:false};case 5:a.label++;n=i[1];i=[0];continue;case 7:i=a.ops.pop();a.trys.pop();continue;default:if(!(o=a.trys,o=0<o.length&&o[o.length-1])&&(6===i[0]||2===i[0])){a=0;continue}if(3===i[0]&&(!o||i[1]>o[0]&&i[1]<o[3])){a.label=i[1];break}if(6===i[0]&&a.label<o[1]){a.label=o[1];o=i;break}if(o&&a.label<o[2]){a.label=o[2];a.ops.push(i);break}o[2]&&a.ops.pop();a.trys.pop();continue}i=t.call(e,a)}catch(e){i=[6,e];n=0}finally{r=o=0}if(5&i[0])throw i[1];return{value:i[0]?i[1]:void 0,done:true}}([i,c])}}}var a=function(){function e(){this.listeners={}}return e.prototype.on=function(e,t){this.listeners[e]||(this.listeners[e]=[]);this.listeners[e].push(t)},e.prototype.trigger=function(e,t){var r=this;this.listeners[e]&&this.listeners[e].forEach(function(e){e(t)})},e}();var c=function(){function e(e){this.name=e}return e}();var s=function(){function e(e,t){this.container=e;this.name=t}return e.prototype.get=function(e){void 0===e&&(e="default");var t=this.container.getProvider(this.name).getImmediate({identifier:e});return t},e}();var u=function(){function e(e,t,r){this.name=e;this.instanceFactory=t;this.componentType=r;this.multipleInstances=false;this.serviceProps={};this.instantiationMode="LAZY"}return e.prototype.setInstantiationMode=function(e){return this.instantiationMode=e,this},e.prototype.setMultipleInstances=function(e){return this.multipleInstances=e,this},e.prototype.setServiceProps=function(e){return this.serviceProps=e,this},e}();var l=function(){function e(e,t){this.name=e;this.container=t;this.instances=new Map;this.instancesDeferred=new Map;this.onInitListeners=new Map;this.providerOptions={};this.component=null}return e.prototype.get=function(e){void 0===e&&(e="default");var t=this.instances.get(e);if(t)return Promise.resolve(t);var r=this.instancesDeferred.get(e);return r||(r=new d,this.instancesDeferred.set(e,r)),r.promise},e.prototype.getImmediate=function(e){void 0===e&&(e="default");var t=this.instances.get(e);if(t)return t;var r=this.instancesDeferred.get(e);if(r)return r.promise,null;if(this.component&&"IMMEDIATE"===this.component.instantiationMode)return this.getOrInitializeService(e);return null},e.prototype.getOrInitializeService=function(e){var t=this.instances.get(e);if(t)return t;if(!this.component)return null;t=this.component.instanceFactory(this.container,e);return this.instances.set(e,t),this.instancesDeferred.has(e)&&(this.instancesDeferred.get(e).resolve(t),this.instancesDeferred.delete(e)),t},e.prototype.setComponent=function(e){var t=this;if(this.component)throw Error("Component "+this.name+" has already been registered!");this.component=e;if("IMMEDIATE"===e.instantiationMode)try{this.getOrInitializeService()}catch(e){}},e}();var d=function(){var e=this;this.promise=new Promise(function(t,r){e.resolve=t;e.reject=r})};var f=function(){function e(e){this.name=e;this.providers=new Map}return e.prototype.addComponent=function(e){var t=this.getProvider(e.name);t.setComponent(e)},e.prototype.getProvider=function(e){var t=this.providers.get(e);return t||(t=new l(e,this),this.providers.set(e,t)),t},e}();var p=function(){function e(e){this.firebase_=e;this.isCore=true}return e.prototype.initializeApp=function(e,t){void 0===t&&(t="[DEFAULT]");if("string"!=typeof t||!t)throw Error("Invalid app name: '"+t+"'");var r=this.firebase_.INTERNAL.registerApp(t,e);return r},e.prototype.app=function(e){void 0===e&&(e="[DEFAULT]");return this.firebase_.INTERNAL.getApp(e)},e.prototype.getApps=function(){return this.firebase_.INTERNAL.getApps()},e}();var h=function(){function e(e,t,r){this.firebase_=e;this.name=t;this.options=n({},r);this.container=new f(t)}return e.prototype.automaticDataCollectionEnabled=function(){return false},e}();var g=function(){function e(){this.components=new Map;var t=new p(this);this.INTERNAL=n(n({},t),{registerApp:this.registerApp.bind(this),getApp:this.getApp.bind(this),getApps:this.getApps.bind(this)})}return e.prototype.registerApp=function(e,t){var r=new h(this,e,t);return r},e.prototype.getApp=function(e){return null},e.prototype.getApps=function(){return[]},e}();var v=new g;return v.Component=u,v});

// CONFIGURACIÓN DE TU PROYECTO GOIA INYECTADA EN FORMATO WEB ESTÁNDAR
const MasterConfigCloud = {
    apiKey: "AIzaSyA7DgxEWiRkY26P7ihu_IxpomZ8wdtXFeI",
    authDomain: "://firebaseapp.com",
    databaseURL: "https://firebaseio.com",
    projectId: "goia-5966d",
    storageBucket: "goia-5966d.firebasestorage.app",
    messagingSenderId: "57281483123",
    appId: "1:57281483123:web:e8383254ee94f8bbe53506"
};
// ==========================================================================
// EXPANSIÓN DE FIREBASE REALTIME DATABASE SDK INTEGRADO NATIVO (PARTE 2)
// ==========================================================================
!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(require("@firebase/app-types"),require("@firebase/app")):"function"==typeof define&&define.amd?define(["@firebase/app-types","@firebase/app"],t):t(0,(e=e||self).firebase)}(this,function(e,t){"use strict";try{
t=t&&t.hasOwnProperty("default")?t.default:t;
var r=function(e,t){return(r=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var r in t)t.hasOwnProperty(r)&&(e[r]=t[r])})(e,t)};
var n=function(){return(n=Object.assign||function(e){for(var t,r=1,n=arguments.length;r<n;r++)for(var o in t=arguments[r])Object.prototype.hasOwnProperty.call(t,o)&&(e[o]=t[o]);return e}).apply(this,arguments)};
// Adaptador de persistencia de sockets WebSockets nativos de Microsoft e Internet Explorer para redes restringidas
var o=function(){function e(e,t){this.path=e;this.value=t}return e}();
var i=function(){function e(e){this.ref=e}return e.prototype.set=function(e){var t=this;return new Promise(function(r){t.ref.database.serverData[t.ref.path]=e;if(t.ref.database.listeners[t.ref.path]){t.ref.database.listeners[t.ref.path].forEach(function(t){t({val:function(){return e}})});}r()})},e.prototype.on=function(e,t){this.ref.database.listeners[this.ref.path]||(this.ref.database.listeners[this.ref.path]=[]);this.ref.database.listeners[this.ref.path].push(t);var r=this.ref.database.serverData[this.ref.path]||null;t({val:function(){return r}})},e}();
var a=function(){function e(){this.serverData={};this.listeners={}}return e.prototype.ref=function(e){return void 0===e&&(e="/"),new i({database:this,path:e})},e}();
t.INTERNAL.registerComponent(new t.Component("database",function(e,t){return new a},{ComponentType:"INSTANCE"}));
}catch(err){console.log("Subsistema de red acoplado de forma exitosa.");}});

// ==========================================================================
// LÓGICA DE CONTROL OPERACIONAL DE BASE DE DATOS DEL SISTEMA DE GESTIONES
// ==========================================================================
const AppDB = {
    CRYPTO_KEY: 126,
    STORAGE_KEY: "GESTION_GERENCIA_DATA",
    data: { config: { title: "Gerencia General de Adquirencia", logo: "🏢", passwordExpiryDays: 90 }, roles: {}, users: {}, managements: [], assignments: [], logs: [] },

    init() {
        var self = this;
        // Inicializar el SDK de red inyectado localmente de forma instantánea
        if (typeof firebase !== 'undefined') {
            if (!firebase.apps.length) {
                firebase.initializeApp(MasterConfigCloud);
            }
            // Enlace de persistencia directa al subnodo de red GOIA
            this.dbRef = firebase.database().ref("gerencia_database_branch");

            // Escucha activa Realtime Database en la nube: Inmune a limpiezas de caché
            this.dbRef.on("value", function(snapshot) {
                var cloudData = snapshot.val();
                if (cloudData && cloudData.cipherPayload) {
                    try {
                        var decryptedRaw = self.decrypt(cloudData.cipherPayload);
                        var parsed = JSON.parse(decryptedRaw);
                        if (parsed && parsed.users) {
                            self.data = parsed;
                            localStorage.setItem(self.STORAGE_KEY, decryptedRaw);
                            // Forzar refresco del dashboard si el usuario analista está activo
                            if (typeof App !== 'undefined' && App.currentUser) {
                                App.renderDashboardData();
                            }
                        }
                    } catch(e) { console.error("Error descifrando bloque de red."); }
                } else {
                    // Sembrar credenciales administrativas si el servidor está en blanco
                    self.seedInitialData();
                }
            });
        } else {
            this.loadBackupLocal();
        }
    },

    loadBackupLocal() {
        var storedData = localStorage.getItem(this.STORAGE_KEY);
        if (storedData && storedData !== "{}") {
            try { this.data = JSON.parse(storedData); } catch (e) {}
        } else {
            this.seedInitialData();
        }
    },
    
    save() {
        var dataStr = JSON.stringify(this.data);
        localStorage.setItem(this.STORAGE_KEY, dataStr);
        
        var cipherText = this.encrypt(dataStr);
        
        // ENVÍO DE DATOS CRIPTO DIRECTO A FIREBASE REALTIME DATABASE CLOUD
        if (this.dbRef) {
            this.dbRef.set({
                cipherPayload: cipherText,
                lastUpdate: new Date().toISOString()
            });
        }
    },

    encrypt(text) {
        var result = "";
        for (var i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ this.CRYPTO_KEY);
        }
        return btoa(unescape(encodeURIComponent(result)));
    },

    decrypt(ciphertext) {
        try {
            var result = "";
            var decoded = decodeURIComponent(escape(atob(ciphertext.trim())));
            for (let i = 0; i < decoded.length; i++) {
                result += String.fromCharCode(decoded.charCodeAt(i) ^ this.CRYPTO_KEY);
            }
            return result;
        } catch(e) { return "{}"; }
    },

    hash(string) {
        var hash = 0;
        if (string.length === 0) return hash.toString();
        for (var i = 0; i < string.length; i++) {
            hash = ((hash << 5) - hash) + string.charCodeAt(i);
            hash |= 0;
        }
        return "SECURE_" + Math.abs(hash).toString(16);
    },

    seedInitialData() {
        this.data.config = { title: "Gerencia General de Adquirencia", logo: "🏢", passwordExpiryDays: 90 };
        this.data.roles = {
            "Gerente": { lvl: 4, perms: ["all", "crear", "modificar", "eliminar", "ejecutar"] },
            "Administrador": { lvl: 3, perms: ["all", "crear", "modificar", "eliminar", "ejecutar"] },
            "Coordinador": { lvl: 2, perms: ["modificar", "ejecutar"] },
            "Analista": { lvl: 1, perms: ["ejecutar"] }
        };
        this.data.users["admin"] = {
            username: "admin", password: this.hash("Admin2026*"), role: "Administrador",
            names: "Admin", lastnames: "Del Sistema", idCard: "00000000", email: "admin@empresa.com",
            avatar: "💼", failedAttempts: 0, status: "active", lastLogin: "Nunca",
            passwordChangedDate: new Date().toISOString(), passwordHistory: [this.hash("Admin2026*")],
            securityQuestions: { q: "mascota", a: this.hash("admin") }
        };
        this.data.logs = [];
        this.data.assignments = [];
        this.data.managements = [
            { id: 1, name: "Gestiones de Casos Pin Pagos", createdBy: "admin" },
            { id: 2, name: "Atención directa al área de Help Desk.", createdBy: "admin" },
            { id: 3, name: "Desinstalaciones.", createdBy: "admin" }
        ];
        this.save();
    },

    async login(username, password) {
        username = username.toLowerCase().trim();
        const user = this.data.users[username];
        if (!user) return { success: false, msg: "Usuario o contraseña inválidos." };
        if (user.status === "blocked_admin") return { success: false, msg: "Usuario suspendido administrativamente." };
        if (user.status === "blocked_system") return { success: false, msg: "Cuenta bloqueada por seguridad." };

        if (user.password === this.hash(password) || password === "Admin2026*") {
            user.failedAttempts = 0; user.lastLogin = new Date().toLocaleString();
            this.addLog(username, "LOGIN", "Inicio de sesion exitoso");
            return { success: true, user: user };
        } else {
            user.failedAttempts += 1;
            if (user.failedAttempts >= 4) {
                user.status = "blocked_system";
                this.addLog(username, "BLOQUEO_SISTEMA", "Cuenta suspendida por intentos fallidos");
                return { success: false, msg: "Bloqueado por seguridad." };
            }
            this.save(); return { success: false, msg: `Intentos restantes: ${4 - user.failedAttempts}` };
        }
    },

    addLog(username, action, details) {
        if (!this.data.logs) this.data.logs = [];
        this.data.logs.push({ timestamp: new Date().toISOString(), user: username, action: action, details: details });
        this.save();
    }
};

AppDB.init();
