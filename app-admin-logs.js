/**
 * SISTEMA DE CONTROL DE GESTIONES - NÚCLEO CENTRAL (app-core.js)
 * PARTE 3 DE 3: MATRIZ DE PERMISOS JERÁRQUICOS Y RECUPERACIÓN DE ACCESOS
 */

// CERROJO DE PERMISOS: Validación de jerarquías basada en clases CSS semánticas
App.applySecurityCerberusPermissions = function() {
    if (!this.currentUser) return;

    const btnAdmin = document.getElementById("btnAdminPanel");
    const btnNewAsig = document.getElementById("btnNewAssignment");

    // Consultar el nivel operacional (lvl) sembrado en db.js
    const userRole = this.currentUser.role;
    const roleMeta = AppDB.data.roles[userRole];
    const userLevel = (roleMeta && typeof roleMeta.lvl !== 'undefined') ? roleMeta.lvl : 1;
    const permissions = (roleMeta && roleMeta.perms) ? roleMeta.perms : [];
    const isMaster = (this.currentUser.username === "admin");

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

// Cargar la inicialización por defecto del sistema al levantar la ventana
window.onload = function() {
    App.init();
};
