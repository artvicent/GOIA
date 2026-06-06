/**
 * ADMINISTRACIÓN PARTE D: CATÁLOGO DE ACTIVIDADES Y GESTIONES (app-admin-managements.js)
 * Manejo CRUD total de ítems con purga en cascada automatizada para la red
 */

App.openManagementsMenu = function() {
    let rows = "";
    AppDB.data.managements.forEach(m => {
        rows += `
            <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:6px;text-align:center;font-weight:bold;color:#64748b;">${m.id}</td>
                <td style="padding:6px;font-size:11px;color:#1e293b;line-clamp:2;">${m.name}</td>
                <td style="padding:6px;text-align:right;white-space:nowrap;">
                    <button onclick="App.openEditManagementForm(${m.id})" style="background:#2563eb;color:white;border:none;padding:2px 6px;font-size:10px;border-radius:4px;cursor:pointer;margin-right:2px;">✏️</button>
                    <button onclick="App.deleteManagementAdmin(${m.id})" style="background:#ef4444;color:white;border:none;padding:2px 6px;font-size:10px;border-radius:4px;cursor:pointer;">❌</button>
                </td>
            </tr>`;
    });

    document.getElementById("modalContent").innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e2e8f0;padding-bottom:0.5rem;margin-bottom:1rem;">
            <h3 style="margin:0;font-size:12px;text-transform:uppercase;font-weight:700;">Catálogo de Actividades</h3>
            <button onclick="App.openAdminMenu()" class="btn-secondary" style="padding:2px 6px;font-size:10px;">&larr; Volver</button>
        </div>
        
        <form onsubmit="App.executeCreateManagement(event)" style="background:#f8fafc;padding:0.75rem;border-radius:8px;margin-bottom:1rem;display:flex;gap:0.5rem;">
            <input type="text" id="newMgName" required class="form-control" placeholder="Nueva Actividad (Ej: Soporte Pos...)" style="background:white;font-size:11px;">
            <button type="submit" class="btn-primary" style="padding:0 1rem;font-size:11px;font-weight:bold;white-space:nowrap;">➕ AGREGAR</button>
        </form>

        <div style="max-height:240px;overflow-y:auto;" class="custom-scrollbar">
            <table style="width:100%;font-size:11px;border-collapse:collapse;">
                <thead>
                    <tr style="background:#f8fafc;color:#64748b;text-transform:uppercase;font-size:9px;text-align:left;">
                        <th style="padding:6px;text-align:center;width:30px;">ID</th><th style="padding:6px;">Descripción de Gestión</th><th style="padding:6px;text-align:right;">Acción</th>
                    </tr>
                </thead>
                <tbody>${rows || '<tr><td colspan="3" style="text-align:center;color:#94a3b8;padding:1rem;">Catálogo vacío.</td></tr>'}</tbody>
            </table>
        </div>`;
};

App.executeCreateManagement = function(e) {
    e.preventDefault();
    const name = document.getElementById("newMgName").value.trim();
    if(!name) return;

    // Calcular ID correlativo autoincremental
    const nextId = AppDB.data.managements.length > 0 ? Math.max(...AppDB.data.managements.map(m => m.id)) + 1 : 1;
    
    AppDB.data.managements.push({ id: nextId, name: name, createdBy: this.currentUser.username });
    AppDB.save();
    alert("Nueva actividad incorporada al catálogo.");
    this.openManagementsMenu();
};

App.openEditManagementForm = function(id) {
    const m = AppDB.data.managements.find(item => item.id === id);
    document.getElementById("modalContent").innerHTML = `
        <h3 style="font-size:12px;text-transform:uppercase;font-weight:700;margin-bottom:1rem;">Modificar Ítem #${id}</h3>
        <form onsubmit="App.executeEditManagement(event, ${id})" style="display:flex;flex-direction:column;gap:0.75rem;">
            <textarea id="editMgName" required class="form-control" rows="4" style="font-size:11px;">${m.name}</textarea>
            <div style="display:flex;gap:0.5rem;">
                <button type="submit" class="btn-primary" style="flex:2;padding:0.5rem;font-size:11px;">ACTUALIZAR TEXTO</button>
                <button type="button" onclick="App.openManagementsMenu()" class="btn-secondary" style="flex:1;padding:0.5rem;font-size:11px;">VOLVER</button>
            </div>
        </form>`;
};

App.executeEditManagement = function(e, id) {
    e.preventDefault();
    const newName = document.getElementById("editMgName").value.trim();
    const m = AppDB.data.managements.find(item => item.id === id);
    
    // Cambiar en el catálogo maestro
    const oldName = m.name;
    m.name = newName;

    // Actualizar en cascada en la tabla de asignaciones activas de los usuarios
    AppDB.data.assignments.forEach(asig => {
        if(asig.activityName === oldName) asig.activityName = newName;
    });

    AppDB.save();
    alert("Gestión modificada y sincronizada en cascada.");
    this.openManagementsMenu();
};

App.deleteManagementAdmin = function(id) {
    const m = AppDB.data.managements.find(item => item.id === id);
    if(!confirm(`¿Eliminar la gestión: "${m.name.substring(0,40)}..."?\n\n¡ATENCIÓN! Esto removerá permanentemente la actividad y todas sus cantidades acumuladas en los tableros de todos los usuarios.`)) return;

    // Remover del catálogo maestro
    const targetName = m.name;
    AppDB.data.managements = AppDB.data.managements.filter(item => item.id !== id);

    // Purga obligatoria en cascada solicitada
    AppDB.data.assignments = AppDB.data.assignments.filter(asig => asig.activityName !== targetName);

    AppDB.save();
    alert("Gestión purgada del sistema.");
    this.openManagementsMenu();
    if(this.currentUser) this.renderDashboardData();
};
