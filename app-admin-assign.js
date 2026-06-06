/**
 * ADMINISTRACIÓN PARTE B: ASIGNACIÓN DE CARGAS CON ESTAMPA DE TIEMPO (app-admin-assign.js)
 */

App.openAssignmentModal = function() {
    var roleData = AppDB.data.roles[this.currentUser.role] || { perms: [] };
    var p = roleData.perms || [];
    var isSupervisor = p.includes("all") || this.currentUser.role === "Gerente" || this.currentUser.role === "Administrador" || this.currentUser.role === "Coordinador";

    var userOptions = "";
    if (isSupervisor) {
        for(var u of Object.keys(AppDB.data.users)) {
            userOptions += `<option value="${u}">${u.toUpperCase()}</option>`;
        }
    } else {
        var myUser = this.currentUser.username;
        userOptions = `<option value="${myUser}">${myUser.toUpperCase()} (Mi Autoasignación)</option>`;
    }

    var activityOptions = "";
    AppDB.data.managements.forEach(function(m) {
        activityOptions += `<option value="${m.name}">${m.id} - ${m.name.substring(0,40)}...</option>`;
    });

    document.getElementById("modalOverlay").classList.remove("hidden");
    document.getElementById("modalContent").innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e2e8f0;padding-bottom:0.5rem;margin-bottom:1rem;">
            <h3 style="margin:0;font-size:12px;text-transform:uppercase;font-weight:700;">Desplegar Carga Laboral</h3>
            <button onclick="document.getElementById('modalOverlay').classList.add('hidden')" style="background:none;border:none;font-size:16px;font-weight:bold;color:#64748b;cursor:pointer;padding:0 5px;">&times;</button>
        </div>
        <form onsubmit="App.executeAssignment(event)" style="display:flex;flex-direction:column;gap:0.75rem;">
            <div>
                <label style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;display:block;margin-bottom:0.25rem;">Destinatario de la Carga</label>
                <select id="asUser" class="form-control">${userOptions}</select>
            </div>
            <div>
                <label style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;display:block;margin-bottom:0.25rem;">Gestión Mandatoria</label>
                <select id="asAct" class="form-control">${activityOptions}</select>
            </div>
            <input type="number" id="asQty" required class="form-control" placeholder="Meta Numérica" min="1">
            <input type="number" id="asTime" required class="form-control" placeholder="Tiempo Límite (Minutos)" min="1">
            
            <div style="display:flex;gap:0.5rem;margin-top:0.5rem;">
                <button type="submit" class="btn-primary" style="flex:2;padding:0.6rem;font-size:11px;">DESPLEGAR CARGA</button>
                <button type="button" onclick="document.getElementById('modalOverlay').classList.add('hidden')" class="btn-secondary" style="flex:1;padding:0.6rem;font-size:11px;background:#f1f5f9;">CANCELAR</button>
            </div>
        </form>`;
};

App.executeAssignment = function(e) {
    e.preventDefault();
    var min = parseInt(document.getElementById("asTime").value);
    var nowObj = new Date();
    var deadlineObj = new Date(nowObj.getTime() + (min * 60000));

    var targetUser = document.getElementById("asUser").value;

    AppDB.data.assignments.push({
        activityName: document.getElementById("asAct").value,
        targetQuantity: parseInt(document.getElementById("asQty").value),
        processed: 0, 
        overtimeCount: 0, 
        durationMinutes: min, 
        createdAt: nowObj.toLocaleString(), // ESTAMPA OBLIGATORIA DE SOLICITUD
        deadline: deadlineObj.toISOString(),
        completionTime: null, // Inicialmente vacío hasta que culmine
        assignedTo: targetUser,
        alertDismissed: false
    });
    
    AppDB.save();
    if(typeof AppDB.addLog === 'function') {
        AppDB.addLog(this.currentUser.username, "ASSIGN_CREATE", `Carga desplegada para: ${targetUser}`);
    }
    
    alert("Carga operativa desplegada con éxito.");
    document.getElementById("modalOverlay").classList.add("hidden");
    this.renderDashboardData();
};
