/**
 * ADMINISTRACIÓN PARTE C: MATRIZ JÓVEN DE PERMISOS Y ROLES (app-admin-roles.js)
 * Permite Crear, Modificar y Asignar Privilegios de Uso en la Base de Datos de Red
 */

// 1. CONTROL DE LA PANTALLA PRINCIPAL DE ROLES
App.openRolesMenu = function() {
    let rows = "";
    // Listar los roles configurados actualmente en la BD local de red
    for (const [roleName, r] of Object.entries(AppDB.data.roles)) {
        // Formatear visualmente la matriz de privilegios que posee el rol
        const p = r.perms || [];
        let badges = "";
        badges += p.includes("crear") ? `<span style="background:#dcfce7;color:#15803d;padding:2px 4px;font-size:9px;border-radius:4px;margin-right:2px;font-weight:bold;">CREAR</span>` : "";
        badges += p.includes("modificar") ? `<span style="background:#eff6ff;color:#1d4ed8;padding:2px 4px;font-size:9px;border-radius:4px;margin-right:2px;font-weight:bold;">MOD</span>` : "";
        badges += p.includes("eliminar") ? `<span style="background:#fee2e2;color:#b91c1c;padding:2px 4px;font-size:9px;border-radius:4px;margin-right:2px;font-weight:bold;">ELI</span>` : "";
        badges += p.includes("ejecutar") ? `<span style="background:#fef3c7;color:#b45309;padding:2px 4px;font-size:9px;border-radius:4px;font-weight:bold;">EJEC</span>` : "";
        if(p.includes("all")) badges = `<span style="background:#f1f5f9;color:#1e293b;padding:2px 4px;font-size:9px;border-radius:4px;font-weight:bold;">TOTAL PRIVILEGIOS</span>`;

        rows += `
            <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:8px;"><strong>${roleName}</strong><br><span style="font-size:10px;color:#64748b;">Jerarquía Nivel: ${r.lvl}</span></td>
                <td style="padding:8px;">${badges || '<span style="color:#94a3b8;font-style:italic;">Sin permisos</span>'}</td>
                <td style="padding:8px;text-align:right;">
                    ${roleName !== "Administrador" && roleName !== "Gerente" ? 
                    `<button onclick="App.deleteRoleAdmin('${roleName}')" style="background:#ef4444;color:white;border:none;padding:2px 6px;font-size:10px;border-radius:4px;cursor:pointer;">❌</button>` : 
                    `<span style="font-size:10px;color:#94a3b8;font-style:italic;">Fijo</span>`}
                </td>
            </tr>`;
    }

    document.getElementById("modalContent").innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e2e8f0;padding-bottom:0.5rem;margin-bottom:1rem;">
            <h3 style="margin:0;font-size:12px;text-transform:uppercase;font-weight:700;">Control de Roles y Privilegios</h3>
            <button onclick="App.openAdminMenu()" class="btn-secondary" style="padding:2px 6px;font-size:10px;">&larr; Volver</button>
        </div>
        
        <!-- Formulario Inline Compacto para dar de alta perfiles -->
        <form onsubmit="App.executeCreateRole(event)" style="background:#f8fafc;padding:0.75rem;border-radius:8px;margin-bottom:1rem;display:flex;flex-direction:column;gap:0.5rem;">
            <div style="display:grid;grid-template-columns:2fr 1fr;gap:0.5rem;">
                <input type="text" id="newRoleName" required class="form-control" placeholder="Nombre de Perfil (Ej: Especialista)" style="background:white;">
                <input type="number" id="newRoleLvl" required class="form-control" placeholder="Jerarquía (1-4)" min="1" max="4" style="background:white;">
            </div>
            
            <!-- Selector estructural de Matriz de Permisos por Casillas -->
            <div>
                <label style="font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;display:block;margin-bottom:0.25rem;">Asignación de Privilegios de Uso</label>
                <div style="display:flex;justify-content:space-between;background:white;padding:6px;border-radius:6px;border:1px solid #e2e8f0;">
                    <label style="font-size:11px;cursor:pointer;"><input type="checkbox" id="pCrear" value="crear"> Crear</label>
                    <label style="font-size:11px;cursor:pointer;"><input type="checkbox" id="pMod" value="modificar"> Modificar</label>
                    <label style="font-size:11px;cursor:pointer;"><input type="checkbox" id="pEli" value="eliminar"> Eliminar</label>
                    <label style="font-size:11px;cursor:pointer;"><input type="checkbox" id="pEjec" value="ejecutar" checked> Ejecutar</label>
                </div>
            </div>
            <button type="submit" class="btn-primary" style="padding:0.5rem;font-size:11px;font-weight:bold;">➕ GUARDAR NUEVO PERFIL</button>
        </form>

        <div style="max-height:180px;overflow-y:auto;" class="custom-scrollbar">
            <table style="width:100%;font-size:11px;border-collapse:collapse;">
                <thead>
                    <tr style="background:#f8fafc;color:#64748b;text-transform:uppercase;font-size:9px;text-align:left;">
                        <th style="padding:6px;">Perfil</th><th style="padding:6px;">Matriz Permisos</th><th style="padding:6px;text-align:right;">Baja</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>`;
};

// 2. PROCESAMIENTO Y CRISTALIZACIÓN DEL NUEVO PERFIL EN RED
App.executeCreateRole = function(e) {
    e.preventDefault();
    const name = document.getElementById("newRoleName").value.trim();
    const lvl = parseInt(document.getElementById("newRoleLvl").value);

    // Sanitización y prevención de colisiones
    if(AppDB.data.roles[name]) return alert("Este perfil ya se encuentra registrado.");

    // Recolectar la matriz seleccionada mediante los checkboxes de la interfaz
    const perms = [];
    if(document.getElementById("pCrear").checked) perms.push("crear");
    if(document.getElementById("pMod").checked) perms.push("modificar");
    if(document.getElementById("pEli").checked) perms.push("eliminar");
    if(document.getElementById("pEjec").checked) perms.push("ejecutar");

    // Guardado jerárquico in situ
    AppDB.data.roles[name] = { lvl: lvl, perms: perms };
    AppDB.save();
    AppDB.addLog(this.currentUser.username, "ROLE_CREATE", name);
    alert(`Perfil ${name.toUpperCase()} creado correctamente con sus permisos desplegados.`);
    this.openRolesMenu();
};

// 3. REMOVER PERFILES DE LA MATRIZ DE SEGURIDAD
App.deleteRoleAdmin = function(roleName) {
    if(!confirm(`¿Desea eliminar permanentemente el perfil ${roleName}? Los usuarios con este rol perderán privilegios.`)) return;
    
    delete AppDB.data.roles[roleName];
    AppDB.save();
    AppDB.addLog(this.currentUser.username, "ROLE_DELETE", roleName);
    alert("Perfil revocado de la base de datos.");
    this.openRolesMenu();
};
