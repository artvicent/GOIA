/**
 * SISTEMA DE CONTROL DE GESTIONES - MÓDULO CORE TRAZABLE INTERACTIVO (app-core.js)
 * FRAGMENTO 1 DE 2 - CONTROL DE INICIO, SESIÓN Y VALIDACIÓN DE EXPIRACIÓN EN RED
 */

const App = {
    currentUser: null,

        init() {
        this.updateHeaderGerencia();
        this.renderCorporateLogo(); 
        this.checkAutoResetMonthly();
        if (typeof this.renderTopWorker === 'function') this.renderTopWorker();
        setInterval(() => this.refreshTimeAlerts(), 30000);
    },



    updateHeaderGerencia() {
        document.getElementById("displayGerenciaName").innerText = AppDB.data.config.title || "Gerencia de Adquirencia";
    },

    async handleLogin(e) {
        e.preventDefault();
        const user = document.getElementById("loginUser").value.toLowerCase().trim();
        const pass = document.getElementById("loginPass").value;

        const res = await AppDB.login(user, pass);
        if (res.success) {
            this.currentUser = AppDB.data.users[user];
            this.showDashboard();
        } else {
            alert(res.msg);
        }
    },

        logout() {
        // Registrar la salida en la bitácora local de forma directa y segura
        if (this.currentUser && typeof AppDB.addLog === 'function') {
            AppDB.addLog(this.currentUser.username, "LOGOUT", "Cierre de sesion exitoso");
        }
        
        // Limpiar la sesión activa en el hilo de ejecucion
        this.currentUser = null;
        
        // Forzar el cambio visual inmediato ocultando los paneles del Dashboard
        document.getElementById("viewDashboard").classList.add("hidden");
        document.getElementById("topBanner").classList.add("hidden");
        
        // Mostrar la pantalla exterior de login corporativo totalmente despejada
        document.getElementById("viewLogin").classList.remove("hidden");
        document.getElementById("formLogin").reset();
    },


    showDashboard() {
        const lastChange = this.currentUser.passwordChangedDate ? new Date(this.currentUser.passwordChangedDate) : new Date();
        const expiryDays = AppDB.data.config.passwordExpiryDays || 90;
        const diffTime = Math.abs(new Date() - lastChange);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > expiryDays && this.currentUser.username !== "admin") {
            alert(`SU CONTRASEÑA HA EXPIRADO (Límite: ${expiryDays} días). Debe actualizar sus credenciales.`);
            if (typeof App.openForcedPasswordChangeModal === 'function') App.openForcedPasswordChangeModal();
            return;
        }

        document.getElementById("viewLogin").classList.add("hidden");
        document.getElementById("viewDashboard").classList.remove("hidden");
        document.getElementById("topBanner").classList.remove("hidden");

        document.getElementById("dashWelcomeName").innerText = `${this.currentUser.names} ${this.currentUser.lastnames || ""}`;
        document.getElementById("dashUserRole").innerText = this.currentUser.role;

        const avatarFrame = document.getElementById("userAvatarFrame");
        if (this.currentUser.avatar && this.currentUser.avatar.startsWith("data:image")) {
            avatarFrame.innerText = ""; avatarFrame.style.backgroundImage = `url('${this.currentUser.avatar}')`;
        } else {
            avatarFrame.style.backgroundImage = "none"; avatarFrame.innerText = this.currentUser.avatar || "👤";
        }

        const roleData = AppDB.data.roles[this.currentUser.role] || { perms: [] };
        const p = roleData.perms || [];
        const isMaster = p.includes("all") || this.currentUser.username === "admin" || this.currentUser.role === "Administrador" || this.currentUser.role === "Gerente";

        const btnAdmin = document.getElementById("btnAdminPanel");
        const btnNewAsig = document.getElementById("btnNewAssignment");

        if (isMaster || p.includes("crear") || p.includes("modificar")) btnAdmin.classList.remove("hidden");
        else btnAdmin.classList.add("hidden");

        if (isMaster || p.includes("crear")) {
            if (btnNewAsig) btnNewAsig.style.display = "inline-block";
        } else {
            if (btnNewAsig) btnNewAsig.style.display = "none";
        }

        this.renderDashboardData();
        if (typeof this.renderTopWorker === 'function') this.renderTopWorker();
    },

    checkAutoResetMonthly() {
        const now = new Date();
        const currentMonthYear = `${now.getMonth() + 1}-${now.getFullYear()}`;
        const lastReset = localStorage.getItem("LAST_MONTHLY_RESET");

        if (lastReset && lastReset !== currentMonthYear) {
            const oldMonth = lastReset.split("-");
            AppDB.data.assignments.forEach(asig => {
                if (!asig.assignmentPeriod) asig.assignmentPeriod = oldMonth;
            });
            AppDB.save(); localStorage.setItem("LAST_MONTHLY_RESET", currentMonthYear);
        } else if (!lastReset) {
            localStorage.setItem("LAST_MONTHLY_RESET", currentMonthYear);
        }
    }
};
//segunda parte
/**
 * FRAGMENTO 2 DE 2 - TABLEROS CON ESTAMPAS CRONOLÓGICAS DE SOLICITUD Y RESOLUCIÓN
 */

App.renderDashboardData = function() {
    const tableBody = document.getElementById("tableAssignmentsBody");
    if (!tableBody) return; tableBody.innerHTML = "";

    let totalRealizadas = 0; let warningCount = 0; let dangerCount = 0; let onTimeCount = 0;

    const roleData = AppDB.data.roles[this.currentUser.role] || { perms: [] };
    const p = roleData.perms || [];
    const isMaster = p.includes("all") || this.currentUser.username === "admin" || this.currentUser.role === "Gerente" || this.currentUser.role === "Administrador";

    let filtered = AppDB.data.assignments || [];
    if (!isMaster) {
        filtered = filtered.filter(asig => asig.assignedTo.toLowerCase().trim() === this.currentUser.username.toLowerCase().trim());
    }

    const selectedPeriod = document.getElementById("filterAuditMonth") ? document.getElementById("filterAuditMonth").value : "current";
    const now = new Date(); const activeMonth = (now.getMonth() + 1).toString();

    if (selectedPeriod === "current") {
        filtered = filtered.filter(asig => !asig.assignmentPeriod || asig.assignmentPeriod === activeMonth);
    } else {
        filtered = filtered.filter(asig => asig.assignmentPeriod === selectedPeriod);
    }

    const filterStatus = document.getElementById("filterAssignmentStatus") ? document.getElementById("filterAssignmentStatus").value : "all";
    if (filterStatus === "pending") filtered = filtered.filter(asig => asig.processed < asig.targetQuantity);
    if (filterStatus === "completed") filtered = filtered.filter(asig => asig.processed >= asig.targetQuantity);
    if (filterStatus === "expired") {
        filtered = filtered.filter(asig => (asig.processed < asig.targetQuantity) && ((new Date(asig.deadline) - new Date()) <= 0));
    }

    if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:2rem; font-style:italic;">No se registran actividades bajo este criterio.</td></tr>`;
        if (typeof this.renderMonitorPanel === 'function') this.renderMonitorPanel(0, 0, 0, 0);
        return;
    }

    filtered.forEach((asig) => {
        const realIndex = AppDB.data.assignments.indexOf(asig);
        const evaluationTime = asig.completionTime ? new Date(asig.completionTime) : new Date();
        const timeDiff = new Date(asig.deadline) - evaluationTime;
        const minutesLeft = Math.floor(timeDiff / 60000);
        
        let timeStr = ""; let rowClass = "";
        const isCompleted = asig.processed >= asig.targetQuantity;

        if (isCompleted) {
            const finalOvertime = asig.overtimeCount || 0;
            rowClass = finalOvertime > 0 ? "row-completed-overtime" : "row-completed-ontime";
            timeStr = finalOvertime > 0 ? "A Destiempo" : "A Tiempo";
        } else {
            if (minutesLeft <= 0) {
                timeStr = "Vencido"; dangerCount++; rowClass = "alert-danger";
            } else if (minutesLeft <= 30) {
                timeStr = `Por vencer (${minutesLeft}m)`; warningCount++; rowClass = "alert-warning";
            } else {
                timeStr = `${minutesLeft} min`;
            }
        }

        totalRealizadas += asig.processed;
        onTimeCount += (asig.processed - (asig.overtimeCount || 0));

        let originDisplay = "";
        if (asig.sourceReference) {
            if (asig.sourceReference.startsWith("http")) {
                originDisplay = `<div style="user-select: text; -webkit-user-select: text;"><a href="${asig.sourceReference}" target="_blank" style="color:#2563eb; font-weight:bold; text-decoration:underline; font-size:10px; display:inline-block; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">🔗 Ir a Zoho Mail</a></div>`;
            } else {
                originDisplay = `<div style="user-select: text; -webkit-user-select: text; font-size:10px; color:#475569; font-weight:600; background:#f1f5f9; padding:2px 4px; border-radius:4px; display:inline-block; word-break:break-all;">${asig.sourceReference}</div>`;
            }
        } else {
            originDisplay = `<span style="color:#94a3b8; font-style:italic; font-size:10px;">No registrado</span>`;
        }

        let actionField = "";
        if (selectedPeriod !== "current") {
            actionField = `<span style="color:#64748b; font-style:italic; font-size:10px;">🔒 Historial</span>`;
        } else if (isCompleted) {
            // MOSTRAR FECHA Y HORA DE RESOLUCIÓN CUANDO ESTÉ CULMINADA
            const resDate = asig.resolvedAt ? asig.resolvedAt : new Date().toLocaleString();
            actionField = `<span class="badge-completed">🏁 CULMINADO</span><br><small style="color:#166534; font-size:9px; font-weight:700;">Resuelto: ${resDate}</small>`;
        } else if (p.includes("ejecutar") || p.includes("all")) {
            const maxAllowed = asig.targetQuantity - asig.processed;
            actionField = `
                <div style="display:flex; flex-direction:column; gap:4px; align-items:center; background:#f8fafc; padding:4px; border-radius:6px; border:1px solid #e2e8f0;">
                    <div style="display:flex; gap:2px; width:100%;">
                        <input type="number" id="inputQty_${realIndex}" min="1" max="${maxAllowed}" value="${maxAllowed}" class="batch-input" style="flex:1;">
                        <button onclick="App.executeBatchManagement(${realIndex})" class="btn-primary" style="padding: 2px 6px; font-size: 10px; border-radius: 4px;">Guardar</button>
                    </div>
                    <input type="text" id="inputSource_${realIndex}" placeholder="Pegue link o escriba Origen" style="width:100%; font-size:10px; padding:3px; border:1px solid #cbd5e1; border-radius:4px; user-select:text; -webkit-user-select:text;">
                </div>`;
        } else {
            actionField = `<span>Solo Lectura</span>`;
        }

        // MOSTRAR FECHA Y HORA DE SOLICITUD ABAJO DEL NOMBRE DE LA ACTIVIDAD
        const reqDate = asig.createdAt ? asig.createdAt : "Fábrica";

        tableBody.innerHTML += `
            <tr class="${rowClass}">
                <td style="padding:0.75rem;">
                    <strong>${asig.activityName}</strong><br>
                    <small style="color:#64748b;">Para: ${asig.assignedTo.toUpperCase()}</small> | 
                    <small style="color:#2563eb; font-weight:600; font-size:9px;">Solicitud: ${reqDate}</small>
                </td>
                <td style="text-align: center;">${asig.targetQuantity}</td>
                <td style="text-align: center; font-weight: bold;">${asig.processed} / ${asig.targetQuantity}</td>
                <td style="text-align: center; padding:0.5rem; max-width:190px;">${originDisplay}</td>
                <td style="text-align: center;" class="text-frozen-status">${timeStr}</td>
                <td style="text-align: center; line-height:1.2;">${actionField}</td>
            </tr>`;
    });

    if (typeof this.renderMonitorPanel === 'function') {
        this.renderMonitorPanel(warningCount, dangerCount, totalRealizadas, onTimeCount);
    }
};

App.executeBatchManagement = function(realIndex) {
    const asig = AppDB.data.assignments[realIndex];
    const inputVal = parseInt(document.getElementById(`inputQty_${realIndex}`).value);
    const sourceVal = document.getElementById(`inputSource_${realIndex}`).value.trim();

    if (isNaN(inputVal) || inputVal <= 0) return alert("Cantidad inválida.");
    const remaining = asig.targetQuantity - asig.processed;
    if (inputVal > remaining) return alert("Exceso rechazado.");

    if (sourceVal !== "") asig.sourceReference = sourceVal;

    const timeDiff = new Date(asig.deadline) - new Date();
    asig.processed += inputVal;
    if (Math.floor(timeDiff / 60000) <= 0) asig.overtimeCount = (asig.overtimeCount || 0) + inputVal;
    
    // Al completarse la meta, se sella físicamente la estampa de resolución
    if (asig.processed >= asig.targetQuantity) {
        asig.completionTime = new Date().toISOString();
        asig.resolvedAt = new Date().toLocaleString(); // ESTAMPA OBLIGATORIA DE RESOLUCIÓN
        asig.assignmentPeriod = (new Date().getMonth() + 1).toString();
    }

    AppDB.save(); this.renderDashboardData();
};

App.refreshTimeAlerts = function() {
    if (this.currentUser) this.renderDashboardData();
};

// ==========================================================================
// RENDERIZADO INMUNE DEL LOGO POR ACTUALIZACIÓN DE SRC DIRECTO (ANTI-CORS)
// ==========================================================================
App.renderCorporateLogo = function() {
    var imgElement = document.getElementById("appLogoImg");
    if (imgElement) {
        // Añadir una estampa de tiempo al link de la imagen para obligar a Windows a leer del disco
        var antiCacheToken = new Date().getTime();
        imgElement.src = "logo_gerencia.png?v=" + antiCacheToken;
        imgElement.style.display = "block";
        
        // Mantener oculto el emoji de respaldo porque la imagen ya cargó
        var fallback = document.getElementById("appLogoFallback");
        if (fallback) fallback.style.display = "none";
    }
};


document.addEventListener("DOMContentLoaded", () => App.init());
