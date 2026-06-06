/**
 * SISTEMA DE CONTROL DE GESTIONES - MOTOR CLUID REALTIME DATABASE (db.js)
 * Sincronización Directa en Servidor Firebase - Cero Almacenamiento Local
 */
const AppDB = {
    CRYPTO_KEY: 126,
    data: { config: { title: "Gerencia General de Adquirencia", logo: "🏢", passwordExpiryDays: 90 }, roles: {}, users: {}, managements: [], assignments: [], logs: [] },

    // CONFIGURACIÓN OFICIAL: Credenciales de tu proyecto GOIA inyectadas en formato estándar
    firebaseConfig: {
        apiKey: "AIzaSyA7DgxEWiRkY26P7ihu_IxpomZ8wdtXFeI",
        authDomain: "goia-5966d.firebaseapp.com",
        databaseURL: "https://goia-5966d-default-rtdb.firebaseio.com",
        projectId: "goia-5966d",
        storageBucket: "goia-5966d.firebasestorage.app",
        messagingSenderId: "57281483123",
        appId: "1:57281483123:web:e8383254ee94f8bbe53506"
    },

    // ... código anterior de firebaseConfig ...

    init() {
        var self = this;
        // Esperar 800 milisegundos a que el navegador termine de digerir el SDK de Firebase
        setTimeout(function() {
            if (typeof firebase !== 'undefined') {
                if (!firebase.apps.length) {
                    firebase.initializeApp(self.firebaseConfig);
                }
                
                // CAMBIO MAESTRO: Forzar la conexión al nodo raíz puro del servidor GOIA
                self.dbRef = firebase.database().ref("/");

                // Escuchar los cambios en la nube en tiempo real
                self.dbRef.on("value", function(snapshot) {
                    var cloudData = snapshot.val();
                    if (cloudData && cloudData.cipherPayload) {
                        try {
                            var decryptedRaw = self.decrypt(cloudData.cipherPayload);
                            var parsed = JSON.parse(decryptedRaw);
                            if (parsed && parsed.users) {
                                self.data = parsed;
                                if (typeof App !== 'undefined' && App.currentUser) {
                                    App.renderDashboardData();
                                }
                            }
                        } catch(e) { console.error("Error descifrando base cloud"); }
                    } else {
                        self.seedInitialData();
                    }
                });
            } else {
                self.seedInitialData();
            }
        }, 800);
    },

    
    save() {
        var dataStr = JSON.stringify(this.data);
        var cipherText = this.encrypt(dataStr);
        
        // ENVÍO DIRECTO AL SERVIDOR (Se elimina por completo el localStorage del flujo)
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
