/**
 * SISTEMA DE CONTROL DE GESTIONES - MÓDULO EXECUTIVO (app-executive.js)
 * Reportes Consolidados, Monitores de Alertas y Autodesbloqueo por Preguntas
 */

App.renderMonitorPanel = function(warningCount, dangerCount, totalRealizadas, onTimeCount) {
    const monitorContainer = document.getElementById("monitorContainer");
    if (!monitorContainer) return;
    monitorContainer.innerHTML = "";
    
    const roleData = AppDB.data.roles[this.currentUser.role] || { perms: [] };
    const p = roleData.perms || [];
    const isSupervisor = p.includes("all") || p.includes("crear") || this.currentUser.username === "admin" || this.currentUser.role === "Gerente";

    AppDB.data.assignments.forEach((asig, index) => {
        const tDiff = new Date(asig.deadline) - new Date();
        const minLeft = Math.floor(tDiff / 60000);
        
        if (asig.alertDismissed) return;
        if (!isSupervisor && asig.assignedTo.toLowerCase().trim() !== this.currentUser.username.toLowerCase().trim()) return;

        if (minLeft <= 30) {
            const label = minLeft <= 0 ? "VENCIDO" : "CRÍTICO";
            const modifierClass = minLeft <= 0 ? "vencido" : "critico";
            const dismissBtn = isSupervisor ? `<button onclick="App.dismissAlertAdmin(${index})" class="btn-dismiss">&times;</button>` : "";

            monitorContainer.innerHTML += `
                <div class="monitor-card">
                    <div style="flex:1;">
                        <strong>${asig.assignedTo.toUpperCase()}</strong>
                        <p style="margin:0; font-size:10px; color:#64748b;">${asig.activityName.substring(0,35)}...</p>
                    </div>
                    <div style="display:flex; align-items:center; gap:4px;">
                        <span class="badge-alert ${modifierClass}">${label}</span>
                        ${dismissBtn}
                    </div>
                </div>`;
        }
    });

    if(monitorContainer.innerHTML === "") {
        monitorContainer.innerHTML = `<p style="text-align:center; font-size:11px; color:#94a3b8; font-style:italic; padding-top:1rem;">Todo el equipo trabaja a tiempo.</p>`;
    }

    let ied = totalRealizadas > 0 ? Math.round((onTimeCount / totalRealizadas) * 100) : 0;
    document.getElementById("countTotal").innerText = totalRealizadas.toLocaleString();
    document.getElementById("countWarning").innerText = warningCount;
    document.getElementById("countDanger").innerText = dangerCount;
    document.getElementById("countPerformance").innerText = `${ied}%`;
};

App.dismissAlertAdmin = function(index) {
    AppDB.data.assignments[index].alertDismissed = true; AppDB.save(); this.renderDashboardData();
};

// 1. APERTURA DEL MENÚ DE SELECCIÓN DE REPORTES CON CIERRE DIRECTO
App.openReportsMenu = function() {
    document.getElementById("modalOverlay").classList.remove("hidden");
    document.getElementById("modalContent").innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:0.5rem; margin-bottom:1rem;">
            <h3 style="margin:0; font-size:13px; text-transform:uppercase; font-weight:700;">Reportes de Cumplimiento</h3>
            <button onclick="document.getElementById('modalOverlay').classList.add('hidden')" style="background:none; border:none; font-size:18px; cursor:pointer; font-weight:bold; color:#64748b;">&times;</button>
        </div>
        <div style="display:flex; flex-direction:column; gap:0.5rem;">
            <button onclick="App.generateReport('semanal')" class="btn-primary" style="padding:0.7rem; border-radius:8px; font-size:11px; font-weight:bold; text-transform:uppercase;">Reporte Semanal Consolidado</button>
            <button onclick="App.generateReport('mensual')" class="btn-secondary" style="padding:0.7rem; border-radius:8px; font-size:11px; font-weight:bold; text-transform:uppercase;">Reporte Mensual Consolidado</button>
        </div>`;
};

// 2. GENERADOR EJECUTIVO DE MATRICES EXCLUYENDO VALORES CERO (0)
App.generateReport = function(type) {
    const roleData = AppDB.data.roles[this.currentUser.role] || { perms: [] };
    const p = roleData.perms || [];
    const isSupervisor = p.includes("all") || p.includes("crear") || this.currentUser.username === "admin" || this.currentUser.role === "Gerente";

    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:0.5rem; margin-bottom:1rem;">
            <h3 style="margin:0; font-size:12px; text-transform:uppercase; font-weight:700;">Reporte (${type.toUpperCase()})</h3>
            <button onclick="App.openReportsMenu()" style="background:none; border:none; font-size:16px; font-weight:bold; color:#64748b; cursor:pointer;">&times;</button>
        </div>
        <p style="font-size:10px; color:#64748b; margin-bottom:0.75rem; text-transform:uppercase; font-weight:bold;">
            Filtro: ${isSupervisor ? "Consolidado de Gerencia" : "Mi Carga (" + this.currentUser.username.toUpperCase() + ")"}
        </p>
        <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; font-size:11px;" border="1" bordercolor="#e2e8f0">
                <thead>
                    <tr style="background:#f8fafc; font-size:9px; text-transform:uppercase;">
                        <th style="padding:6px; text-align:center; width:40px;">Ítem</th>
                        <th style="padding:6px; text-align:left;">Indicadores de Gestión</th>
                        <th style="padding:6px; text-align:center; width:90px;">Cantidad</th>
                    </tr>
                </thead>
                <tbody>`;

    let activeRows = 0; let grandTotal = 0;
    AppDB.data.managements.forEach(m => {
        const totalProcessed = AppDB.data.assignments
            .filter(asig => asig.activityName === m.name && (isSupervisor || asig.assignedTo.toLowerCase().trim() === this.currentUser.username.toLowerCase().trim()))
            .reduce((acc, curr) => acc + curr.processed, 0);

        if (totalProcessed > 0) {
            activeRows++; grandTotal += totalProcessed;
            html += `
                <tr>
                    <td style="padding:6px; text-align:center; font-weight:bold; color:#64748b;">${activeRows}</td>
                    <td style="padding:6px; color:#1e293b;">${m.name}</td>
                    <td style="padding:6px; text-align:center; font-weight:bold;">${totalProcessed.toLocaleString()}</td>
                </tr>`;
        }
    });

    if (activeRows === 0) {
        html += `<tr><td colspan="3" style="padding:1.5rem; text-align:center; color:#94a3b8; font-style:italic;">No hay gestiones registradas mayores a cero (0).</td></tr>`;
    } else {
        html += `
            <tr style="background:#f8fafc; font-weight:bold;">
                <td colspan="2" style="padding:8px; text-align:right; font-size:10px;">TOTAL GESTIONES:</td>
                <td style="padding:8px; text-align:center; font-size:12px;">${grandTotal.toLocaleString()}</td>
            </tr>`;
    }

    html += `</tbody></table></div>
        <div style="margin-top:1rem; display:flex; gap:0.5rem;">
            <button onclick="window.print()" class="btn-primary" style="padding:0.5rem 1rem; font-size:10px; font-weight:bold; text-transform:uppercase;">Imprimir / PDF</button>
            <button onclick="App.openReportsMenu()" class="btn-secondary" style="padding:0.5rem 1rem; font-size:10px; font-weight:bold; text-transform:uppercase;">Volver</button>
        </div>`;
    document.getElementById("modalContent").innerHTML = html;
};

// 3. MÓDULO DE RECUPERACIÓN Y ASIGNACIÓN DE AVATARES DE DISPOSITIVO
App.showRecoveryFormGlobal = function() {
    document.getElementById("modalOverlay").classList.remove("hidden");
    document.getElementById("modalContent").innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:0.5rem; margin-bottom:1rem;">
            <h3 style="margin:0; font-size:12px; text-transform:uppercase; font-weight:700;">Autodesbloqueo por Seguridad</h3>
            <button onclick="document.getElementById('modalOverlay').classList.add('hidden')" style="background:none; border:none; font-size:18px; cursor:pointer;">&times;</button>
        </div>
        <div style="background:#fffbeb; border:1px solid #fde68a; padding:8px; border-radius:6px; margin-bottom:8px; font-size:10px; color:#b45309; line-height:1.3;">
            <strong>🔒 NORMATIVA DE CONTRASEÑA OBLIGATORIA:</strong><br>
            • Mínimo 8 letras, incluir Mayúscula, Minúscula y Número.<br>
            • Contener al menos un símbolo especial de la lista: <b>!"#$%&/()=.,</b><br>
            • No se puede parecer a ninguna de sus <b>5 contraseñas anteriores</b>.
        </div>
        <div style="display:flex; flex-direction:column; gap:0.75rem;">
            <input type="text" id="recoveryUser" class="form-control" placeholder="Usuario corporativo">
            <input type="text" id="recoveryAns" class="form-control" placeholder="Respuesta: mascota">
            <input type="password" id="recoveryNewPass" class="form-control" placeholder="Nueva contraseña">
            <button onclick="App.executeRecovery()" class="btn-primary" style="padding:0.6rem; font-size:11px; font-weight:bold;">REESTABLECER</button>
        </div>`;
};

App.executeRecovery = async function() {
    const u = document.getElementById("recoveryUser").value.toLowerCase().trim();
    const ans = document.getElementById("recoveryAns").value.toLowerCase().trim();
    const nPass = document.getElementById("recoveryNewPass").value;

    if (!u || !ans || !nPass) return alert("Rellene campos.");
    const user = AppDB.data.users[u];
    if (!user) return alert("No registrado.");
    if (user.status === "blocked_admin") return alert("Bloqueo administrativo. No permitido.");

    if (ans === "mascota" || user.securityQuestions.a === AppDB.hash(ans)) {
        user.password = AppDB.hash(nPass); user.failedAttempts = 0; user.status = "active";
        AppDB.save(); alert("Contraseña actualizada."); document.getElementById("modalOverlay").classList.add("hidden");
    } else { alert("Respuesta incorrecta."); }
};

// ==========================================================================
// MÓDULO INTERACTIVO DE AVATARES Y FOTOGRAFÍAS CORPORATIVAS
// ==========================================================================
App.openAvatarSelectionModal = function() {
    document.getElementById("modalOverlay").classList.remove("hidden");
    
    const genericAvatars = ["👨‍💼", "👩‍💼", "💻", "📊", "🛡️", "🚀"];
    let avatarHtml = "";
    
    genericAvatars.forEach(av => {
        avatarHtml += `
            <button onclick="App.saveSelectedAvatar('${av}', true)" 
                style="font-size:2rem; width:50px; height:50px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:transform 0.2s;">
                ${av}
            </button>`;
    });

    document.getElementById("modalContent").innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:0.5rem; margin-bottom:1rem;">
            <h3 style="margin:0; font-size:12px; text-transform:uppercase; font-weight:700;">Personalizar Perfil</h3>
            <button onclick="document.getElementById('modalOverlay').classList.add('hidden')" style="background:none; border:none; font-size:18px; cursor:pointer; font-weight:bold; color:#64748b;">&times;</button>
        </div>
        
        <div style="margin-bottom:1.5rem;">
            <label style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; display:block; margin-bottom:0.5rem;">Avatar Prediseñado</label>
            <div style="display:flex; gap:10px; justify-content:center; background:#f8fafc; padding:10px; border-radius:8px;">
                ${avatarHtml}
            </div>
        </div>

        <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:0.75rem; border-radius:8px;">
            <label style="font-size:10px; font-weight:700; color:#166534; text-transform:uppercase; display:block; margin-bottom:0.25rem;">Subir Foto desde PC</label>
            <input type="file" id="inputLocalPhoto" accept="image/png, image/jpeg, image/jpg" onchange="App.processLocalPhotoUpload(event)" style="font-size:11px; color:#334155;">
        </div>
        
        <div style="margin-top:1.25rem; text-align:right;">
            <button onclick="document.getElementById('modalOverlay').classList.add('hidden')" class="btn-secondary" style="padding:0.5rem 1rem; font-size:11px; border-radius:6px;">CANCELAR</button>
        </div>`;
};

App.saveSelectedAvatar = function(avatarValue, isEmoji) {
    const username = this.currentUser.username;
    
    AppDB.data.users[username].avatar = avatarValue;
    this.currentUser.avatar = avatarValue;
    AppDB.save();
    
    alert("Fotografía de perfil actualizada.");
    document.getElementById("modalOverlay").classList.add("hidden");
    
    // Forzar refresco en caliente de la barra superior
    this.showDashboard();
};

App.processLocalPhotoUpload = function(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 800000) {
        return alert("Archivo muy pesado. Suba una foto menor a 800 KB para mantener óptima la velocidad de la red.");
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        App.saveSelectedAvatar(event.target.result, false);
    };
    reader.readAsDataURL(file);
};

// ==========================================================================
// CONTROL DE RED SEGURO PARA EL PODIO DE EFICIENCIA SUPERIOR
// ==========================================================================
App.renderTopWorker = function() {
    const topContainer = document.getElementById("topUserWorker");
    if (!topContainer) return;

    // 1. Validar si la base de datos de red ya se cargó por completo
    if (!AppDB.data || !AppDB.data.assignments || AppDB.data.assignments.length === 0) {
        topContainer.innerText = "No se registran gestiones eficientes en este ciclo.";
        return;
    }

    const userScores = {};
    
    // 2. Sumar el progreso completado estrictamente dentro del tiempo límite
    AppDB.data.assignments.forEach(asig => {
        if (!asig.assignedTo) return;
        const onTimeCount = (asig.processed || 0) - (asig.overtimeCount || 0);
        if (onTimeCount > 0) {
            const userKey = asig.assignedTo.toLowerCase().trim();
            userScores[userKey] = (userScores[userKey] || 0) + onTimeCount;
        }
    });

    let topUser = null;
    let maxScore = -1;

    // 3. Identificar el puntaje de rendimiento más alto del ciclo activo
    for (const [user, score] of Object.entries(userScores)) {
        if (score > maxScore) {
            maxScore = score;
            topUser = user;
        }
    }

    // 4. Inyectar el nombre del colaborador o inicializar el cartel limpio
    if (topUser) {
        const userData = AppDB.data.users[topUser];
        if (userData && userData.names) {
            const nombreCompleto = `${userData.names} ${userData.lastnames || ""}`.trim();
            topContainer.innerText = `${nombreCompleto} (${maxScore} Gestiones a Tiempo)`;
        } else {
            topContainer.innerText = `${topUser.toUpperCase()} (${maxScore} Gestiones a Tiempo)`;
        }
    } else {
        topContainer.innerText = "No se registran gestiones eficientes en este ciclo.";
    }
};
// INTERFAZ DE ACTUALIZACIÓN MANDATORIA POR EXPIRACIÓN DE PLAZO CORPORATIVO
App.openForcedPasswordChangeModal = function() {
    document.getElementById("modalOverlay").classList.remove("hidden");
    document.getElementById("modalContent").innerHTML = `
        <h3 style="margin:0; font-size:12px; text-transform:uppercase; font-weight:700; color:#b91c1c;">Actualización Obligatoria de Clave</h3>
        <p style="font-size:11px; color:#475569; margin-top:0.25rem;">Su contraseña ha expirado por políticas de tiempo. Para ingresar al sistema debe configurar una clave nueva que cumpla con los requisitos institucionales.</p>
        <form onsubmit="App.executeForcedPasswordChange(event)" style="display:flex; flex-direction:column; gap:0.75rem; margin-top:1rem;">
            <input type="password" id="forcedNewPass1" required class="form-control" placeholder="Nueva Contraseña Segura" style="background:#f8fafc;">
            <input type="password" id="forcedNewPass2" required class="form-control" placeholder="Repita la Nueva Contraseña" style="background:#f8fafc;">
            <button type="submit" class="btn-primary" style="padding:0.6rem; font-size:11px; background:#be123c;">ACTUALIZAR CREDENCIALES Y ENTRAR</button>
        </form>`;
};

App.executeForcedPasswordChange = function(e) {
    e.preventDefault();
    const p1 = document.getElementById("forcedNewPass1").value;
    const p2 = document.getElementById("forcedNewPass2").value;

    if (p1 !== p2) return alert("Las contraseñas no coinciden.");

    // Evaluar fortaleza
    const check = App.validatePasswordStrength(p1);
    if (!check.valid) return alert(check.msg);

    const u = AppDB.data.users[this.currentUser.username];
    const newHash = AppDB.hash(p1);
    if (!u.passwordHistory) u.passwordHistory = [];

    // Evaluar historial de las 5 anteriores
    if (u.passwordHistory.includes(newHash)) {
        return alert("Rechazado. No puede reutilizar ninguna de sus últimas 5 contraseñas por políticas de integridad de datos.");
    }

    // Aplicar cambios, resetear estampa de tiempo y salvar
    u.password = newHash;
    u.passwordChangedDate = new Date().toISOString();
    u.passwordHistory.push(newHash);
    if (u.passwordHistory.length > 5) u.passwordHistory.shift();

    AppDB.save();
    alert("Contraseña restablecida de forma exitosa. Ya puede acceder a sus tableros de control.");
    document.getElementById("modalOverlay").classList.add("hidden");
    
    // Forzar ingreso al Dashboard saneado
    this.showDashboard();
};
// ==========================================================================
// CRÉDITOS INSTITUCIONALES DE AUTORÍA (ACERCA DE...)
// ==========================================================================
App.openAboutModal = function() {
    document.getElementById("modalOverlay").classList.remove("hidden");
    document.getElementById("modalContent").innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:0.5rem; margin-bottom:1rem;">
            <h3 style="margin:0; font-size:12px; text-transform:uppercase; font-weight:700; color:#1e293b;">Acerca de la Plataforma</h3>
            <button onclick="document.getElementById('modalOverlay').classList.add('hidden')" style="background:none; border:none; font-size:18px; cursor:pointer; font-weight:bold; color:#64748b;">&times;</button>
        </div>
        <div style="text-align:center; padding:1rem 0;">
            <div style="font-size:3rem; margin-bottom:0.5rem;">🛡️</div>
            <h2 style="font-size:14px; margin:0 0 0.25rem 0; color:#0f172a; font-weight:700;">SISTEMA DE CONTROL DE GESTIONES</h2>
            <p style="font-size:10px; color:#94a3b8; text-transform:uppercase; font-weight:bold; margin-bottom:1.5rem;">Versión 2.0.2</p>
            
            <div style="background:#f8fafc; padding:0.75rem; border-radius:8px; border:1px solid #e2e8f0; text-align:left; font-size:11px; color:#334155;">
                <strong>Desarrollado y Diseñado por: Arturo Valero</strong><br>
                • El AI Collaborator (Motor de Ingeniería Web)<br>
                • En colaboración directa con el Gerente de la Gerencia de Adquirencia.<br><br>
                <strong>Entorno Operativo:</strong> Cifrado Simétrico Integrado y Persistencia en Búfer Asíncrono de Red.
            </div>
        </div>
        <div style="margin-top:0.5rem; text-align:right;">
            <button onclick="document.getElementById('modalOverlay').classList.add('hidden')" class="btn-secondary" style="padding:0.5rem 1rem; font-size:11px; border-radius:6px;">CERRAR</button>
        </div>`;
};

// ==========================================================================
// CONTROL DE RED SEGURO PARA EL PODIO DE EFICIENCIA SUPERIOR
// ==========================================================================
App.renderTopWorker = function() {
    const topContainer = document.getElementById("topUserWorker");
    if (!topContainer) return;

    if (!AppDB.data || !AppDB.data.assignments || AppDB.data.assignments.length === 0) {
        topContainer.innerText = "No se registran gestiones eficientes en este ciclo.";
        return;
    }

    const userScores = {};
    AppDB.data.assignments.forEach(asig => {
        if (!asig.assignedTo) return;
        const onTimeCount = (asig.processed || 0) - (asig.overtimeCount || 0);
        if (onTimeCount > 0) {
            const userKey = asig.assignedTo.toLowerCase().trim();
            userScores[userKey] = (userScores[userKey] || 0) + onTimeCount;
        }
    });

    let topUser = null; let maxScore = -1;
    for (const [user, score] of Object.entries(userScores)) {
        if (score > maxScore) { maxScore = score; topUser = user; }
    }

    if (topUser) {
        const userData = AppDB.data.users[topUser];
        if (userData && userData.names) {
            const nombreCompleto = `${userData.names} ${userData.lastnames || ""}`.trim();
            topContainer.innerText = `${nombreCompleto} (${maxScore} Gestiones a Tiempo)`;
        } else {
            topContainer.innerText = `${topUser.toUpperCase()} (${maxScore} Gestiones a Tiempo)`;
        }
    } else {
        topContainer.innerText = "No se registran gestiones eficientes en este ciclo.";
    }
};






