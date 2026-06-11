/**
 * ADMINISTRACIÓN PARTE D: CATÁLOGO DE GESTIONES DE ADQUIRENCIA (app-admin-managements.js)
 * LÓGICA OPERACIONAL PURA - CERO ATRIBUTOS DE DISEÑO O ESTILOS EN LÍNEA
 */

// Desplegar la matriz de categorías operacionales autorizadas en la gerencia
App.openManagementsMenu = function() {
    let listHtml = "";
    
    if (AppDB.data && AppDB.data.managements) {
        AppDB.data.managements.forEach(function(m) {
            listHtml += `
                <tr>
                    <td><b>ID: ${m.id}</b></td>
                    <td>${m.name}</td>
                    <td class="text-center">
                        <button onclick="App.executeDeleteManagementCloud(${m.id})" class="btn-secondary btn-logout">Eliminar</button>
                    </td>
                </tr>`;
        });
    }

    document.getElementById("modalContent").innerHTML = `
        <div class="modal-inner-header">
            <h3>Catálogo de Gestiones Activas</h3>
            <button onclick="App.openAdminMenu()">&times;</button>
        </div>
        
        <div class="admin-config-card">
            <label>Incorporar Nueva Categoría Operacional</label>
            <div class="input-inline-row">
                <input type="text" id="inputNewMgmtName" class="form-control" placeholder="Ej: Fallas Integración POS">
                <button onclick="App.executeCreateManagementCloud()" class="btn-primary">Registrar</button>
            </div>
        </div>

        <div class="table-container custom-scrollbar">
            <table class="executive-table">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Nombre de la Categoría</th>
                        <th class="text-center">Acción</th>
                    </tr>
                </thead>
                <tbody>
                    ${listHtml || '<tr><td colspan="3" class="text-muted-blue text-center">Sin categorías de gestión en el catálogo.</td></tr>'}
                </tbody>
            </table>
        </div>
        
        <div class="modal-action-row-footer">
            <button onclick="App.openAdminMenu()" class="btn-secondary-cancel">Regresar al Panel</button>
        </div>`;
};

// Crear nueva categoría de adquirencia y sincronizar en la nube
App.executeCreateManagementCloud = function() {
    const inputField = document.getElementById("inputNewMgmtName");
    if (!inputField) return;

    const name = inputField.value.trim();
    if (!name) return alert("Por favor, ingrese un nombre de categoría válido.");

    if (!AppDB.data.managements) AppDB.data.managements = [];

    // Calcular ID autoincremental de control de base de datos
    const nextId = AppDB.data.managements.length > 0 
        ? Math.max(...AppDB.data.managements.map(m => m.id)) + 1 
        : 1;

    AppDB.data.managements.push({
        id: nextId,
        name: name,
        createdBy: App.currentUser.username
    });

    AppDB.save();
    AppDB.addLog(App.currentUser.username, "CREAR_CATALOGO", `Añadió categoría: ${name}`);
    
    alert("Nueva gestión de adquirencia incorporada con éxito.");
    this.openManagementsMenu();
};

// Dar de baja una categoría operacional y registrar auditoría cloud
App.executeDeleteManagementCloud = function(id) {
    if (!AppDB.data.managements) return;
    
    const targetIndex = AppDB.data.managements.findIndex(m => m.id === id);
    if (targetIndex === -1) return;

    const mgmtName = AppDB.data.managements[targetIndex].name;
    const check = confirm(`⚠️ ALERTA DE CONFIGURACIÓN:\n¿Está seguro de que desea eliminar la categoría "${mgmtName}"?\n\nEsto desvinculará los reportes operacionales asociados.`);
    
    if (check) {
        AppDB.addLog(App.currentUser.username, "BORRAR_CATALOGO", `Eliminó categoría: ${mgmtName}`);
        AppDB.data.managements.splice(targetIndex, 1);
        AppDB.save();
        
        alert("Categoría dada de baja en los servidores cloud.");
        this.openManagementsMenu();
    }
};
