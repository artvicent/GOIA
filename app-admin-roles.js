/**
 * ADMINISTRACIÓN PARTE C: SEGURIDAD, ROLES Y PERMISOS DE NÓMINA (app-admin-roles.js)
 * LOGICA OPERACIONAL PURA - CERO ATRIBUTOS DE DISEÑO O ESTILOS EN LÍNEA
 */

// Desplegar la matriz jerárquica de roles vigentes en la gerencia
App.openRolesMenu = function() {
    let html = `
        <div class="modal-inner-header">
            <h3>Jerarquías y Permisos del Sistema</h3>
            <button onclick="App.openAdminMenu()">&times;</button>
        </div>
        <div class="table-container custom-scrollbar">
            <table class="executive-table">
                <thead>
                    <tr>
                        <th>Rol Corporativo</th>
                        <th>Nivel</th>
                        <th>Permisos Asignados</th>
                    </tr>
                </thead>
                <tbody>`;

    if (AppDB.data && AppDB.data.roles) {
        for (const [roleName, roleMeta] of Object.entries(AppDB.data.roles)) {
            const permisosStr = (roleMeta.perms && roleMeta.perms.length > 0) 
                ? roleMeta.perms.join(", ") 
                : "Ninguno";
                
            html += `
                <tr>
                    <td><b>${roleName}</b></td>
                    <td class="text-center font-bold">${roleMeta.lvl}</td>
                    <td><span class="badge-reference">${permisosStr}</span></td>
                </tr>`;
        }
    }

    html += `
                </tbody>
            </table>
        </div>
        <div class="modal-action-row-footer">
            <button onclick="App.openAdminMenu()" class="btn-secondary-cancel">Regresar al Panel</button>
        </div>`;

    document.getElementById("modalContent").innerHTML = html;
};

// Validar jerarquía estricta de un usuario antes de ejecutar acciones de red
App.validateUserHierarchyPermission = function(requiredLevel) {
    if (!App.currentUser || !AppDB.data || !AppDB.data.roles) return false;
    
    const userRole = App.currentUser.role;
    const roleMeta = AppDB.data.roles[userRole];
    const currentLevel = (roleMeta && typeof roleMeta.lvl !== 'undefined') ? roleMeta.lvl : 1;
    
    return currentLevel >= requiredLevel;
};
