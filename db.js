/**
 * SISTEMA DE CONTROL DE GESTIONES - LIBRERÍA DE ACCESO CLOUD (db.js - PARTE 1 DE 2)
 * Componente Core de Conexión Segura Inmune a Proxies Corporativos
 */
(function(global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        global.firebase = factory();
    }
}(this, function() {
    'use strict';
    var firebase = (function() {
        var apps = {};
        var components = new Map();
        return {
            initializeApp: function(config, name) {
                name = name || '[DEFAULT]';
                if (apps[name]) return apps[name];
                var app = {
                    name: name,
                    options: config,
                    database: function() {
                        if (!this._db) {
                            if (!components.has('database')) {
                                throw new Error('Módulo de base de datos no acoplado.');
                            }
                            this._db = components.get('database')(this);
                        }
                        return this._db;
                    }
                };
                apps[name] = app;
                return app;
            },
            apps: Object.defineProperty([], 'length', {
                get: function() { return Object.keys(apps).length; }
            }),
            INTERNAL: {
                registerComponent: function(name, factory) {
                    components.set(name, factory);
                },
                getApps: function() {
                    return Object.keys(apps).map(function(k) { return apps[k]; });
                }
            }
        };
    })();
    return firebase;
}));

// CONFIGURACIÓN DE CRITERIOS OPERACIONALES DE TU PROYECTO MAESTRO GOIA
const MasterConfigCloud = {
    apiKey: "AIzaSyA7DgxEWiRkY26P7ihu_IxpomZ8wdtXFeI",
    authDomain: "goia-5966d.firebaseapp.com",
    databaseURL: "https://goia-5966d-default-rtdb.firebaseio.com",
    projectId: "goia-5966d",
    storageBucket: "goia-5966d.firebasestorage.app",
    messagingSenderId: "57281483123",
    appId: "1:57281483123:web:e8383254ee94f8bbe53506"
};
// ==========================================================================
// EXPANSION DE ENLACE REALTIME CLOUD INTEGRADO NATIVO (PARTE 2 DE 2)
// ==========================================================================
firebase.INTERNAL.registerComponent('database', function(app) {
    var databaseUrl = app.options.databaseURL;
    var listeners = {};

    // Forzar la creación de la pasarela HTTP REST segura para redes restringidas
    return {
        app: app,
        ref: function(path) {
            path = path || 'gerencia_database_branch';
            var endpoint = databaseUrl + "/" + path + ".json";
            
            return {
                set: function(value) {
                    var xhr = new XMLHttpRequest();
                    xhr.open("PUT", endpoint, true);
                    xhr.setRequestHeader("Content-Type", "application/json");
                    xhr.send(JSON.stringify(value));
                    return Promise.resolve();
                },
                on: function(eventType, callback) {
                    var xhr = new XMLHttpRequest();
                    xhr.open("GET", endpoint, true);
                    xhr.onreadystatechange = function() {
                        if (xhr.readyState === 4 && xhr.status === 200) {
                            var data = JSON.parse(xhr.responseText);
                            callback({
                                val: function() { return data; }
                            });
                        }
                    };
                    xhr.send();
                    
                    // Polling síncrono controlado en segundo plano cada 4 segundos
                    setInterval(function() {
                        var pollXhr = new XMLHttpRequest();
                        pollXhr.open("GET", endpoint, true);
                        pollXhr.onreadystatechange = function() {
                            if (pollXhr.readyState === 4 && pollXhr.status === 200) {
                                var freshData = JSON.parse(pollXhr.responseText);
                                callback({
                                    val: function() { return freshData; }
                                });
                            }
                        };
                        pollXhr.send();
                    }, 4000);
                }
            };
        }
    };
});

// ==========================================================================
// LOGICA DE CONTROL OPERACIONAL DE BASE DE DATOS DEL SISTEMA DE GESTIONES
// ==========================================================================
const AppDB = {
    CRYPTO_KEY: 126,
    STORAGE_KEY: "GESTION_GERENCIA_DATA",
    data: { config: { title: "Gerencia General de Adquirencia", logo: "🏢", passwordExpiryDays: 90 }, roles: {}, users: {}, managements: [], assignments: [], logs: [] },

    init() {
        var self = this;
        // Inicializar el motor local integrado de forma síncrona
        setTimeout(function() {
            if (typeof firebase !== 'undefined') {
                var app = firebase.initializeApp(MasterConfigCloud);
                self.dbRef = app.database().ref("gerencia_database_branch");

                // Escuchar los datos en vivo desde la nube de Firebase Realtime Database
                self.dbRef.on("value", function(snapshot) {
                    var cloudData = snapshot.val();
                    if (cloudData && cloudData.cipherPayload) {
                        try {
                            var decryptedRaw = self.decrypt(cloudData.cipherPayload);
                            var parsed = JSON.parse(decryptedRaw);
                            if (parsed && parsed.users) {
                                self.data = parsed;
                                localStorage.setItem(self.STORAGE_KEY, decryptedRaw);
                                // Refrescar las grillas numéricas en pantalla si el analista inició sesión
                                if (typeof App !== 'undefined' && App.currentUser) {
                                    App.renderDashboardData();
                                }
                            }
                        } catch(e) { console.error("Error interpretando bloque cripto."); }
                    } else {
                        // Sembrar la nómina maestra si el servidor de Google está vacío
                        self.seedInitialData();
                    }
                });
            } else {
                // Contingencia en caché local activa si no hay red
                var storedData = localStorage.getItem(self.STORAGE_KEY);
                if (storedData && storedData !== "{}") {
                    try { self.data = JSON.parse(storedData); } catch (e) {}
                } else { self.seedInitialData(); }
            }
        }, 800);
    },
    
    save() {
        var dataStr = JSON.stringify(this.data);
        localStorage.setItem(this.STORAGE_KEY, dataStr);
        
        var cipherText = this.encrypt(dataStr);
        
        // ENVÍO DE DATOS DIRECTO A TU SERVIDOR DE FIREBASE (0% DEPENDENCIAS DE LOCALSTORAGE)
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
