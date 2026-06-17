/**
 * ADMINISTRACIÓN PARTE D: CATÁLOGO DE GESTIONES DE ADQUIRENCIA (app-admin-managements.js)
 * LÓGICA OPERACIONAL PURA - CERO ATRIBUTOS DE DISEÑO O ESTILOS EN LÍNEA
 * VERSIÓN PROTEGIDA v2.02 - INMUNE A CAÍDAS Y REINICIOS DE BASE DE DATOS
 */

// Desplegar la matriz de categorías operacionales autorizadas en la gerencia
App.openManagementsMenu = function() {
    // 1. CONTROL DE RED PREVENTIVO: Asegurar la existencia de la estructura de datos
    if (!AppDB || !AppDB.data) {
        alert("Error: El motor transaccional de datos no se encuentra inicializado.");
        return;
    }
    
    // Normalizar la rama del catálogo si Firebase la devolvió vacía o corrupta
    if (!AppDB.data.managements) {
        AppDB.data.managements = [];
    }

    let listHtml = "";
    
    // Asegurar compatibilidad matemática si Firebase descarga los datos como objeto mapeado
    const managementsArray = Array.isArray(AppDB.data.managements) 
        ? AppDB.data.managements 
        : Object.values(AppDB.data.managements);

    managementsArray.forEach(function(m) {
        if (!m) return;
        listHtml += `
            <tr>
                <td><b>ID: ${m.id}</b></td>
                <td>${m.name}</td>
                <td class="text-center">
                    <button onclick="App.executeDeleteManagementCloud(${m.id})" class="btn-secondary btn-logout" type="button">Eliminar</button>
                </td>
            </tr>`;
    });

    document.getElementById("modalContent").innerHTML = `
        <div class="modal-inner-header">
            <h3>Catálogo de Gestiones Activas</h3>
            <button onclick="App.openAdminMenu()">&times;</button>
        </div>
        
        <div class="admin-config-card">
            <label>Incorporar Nueva Categoría Operacional</label>
            <div class="input-inline-row">
                <input type="text" id="inputNewMgmtName" class="form-control" placeholder="Ej: Fallas Integración POS">
                <button onclick="App.executeCreateManagementCloud()" class="btn-primary" type="button">Registrar</button>
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

    // Forzar inicialización de arreglo limpio si la base de datos está en blanco
    if (!AppDB.data.managements) {
        AppDB.data.managements = [];
    }

    const managementsArray = Array.isArray(AppDB.data.managements) 
        ? AppDB.data.managements 
        : Object.values(AppDB.data.managements);

    // Calcular ID autoincremental seguro evitando colapsos de vectores vacíos
    const nextId = managementsArray.length > 0 
        ? Math.max(...managementsArray.map(m => m ? parseInt(m.id || 0) : 0)) + 1 
        : 1;

    const activeUser = (App.currentUser && App.currentUser.username) ? App.currentUser.username : "admin";

    // Inyectar el nuevo registro al listado operacional
    AppDB.data.managements.push({
        id: nextId,
        name: name,
        createdBy: activeUser
    });

    // Guardar cambios ejecutando la encriptación nativa de tu AppDB
    AppDB.save();
    
    // Registrar evento en las trazas de auditoría cloud
    if (typeof AppDB.addLog === "function") {
        AppDB.addLog(activeUser, "CREAR_CATALOGO", `Añadió categoría: ${name}`);
    }
    
    alert("Nueva gestión de adquirencia incorporada con éxito.");
    this.openManagementsMenu();
};

// Dar de baja una categoría operacional y registrar auditoría cloud
App.executeDeleteManagementCloud = function(id) {
    if (!AppDB.data.managements) return;
    
    // Convertir a estructura de arreglo seguro para poder usar findIndex
    if (!Array.isArray(AppDB.data.managements)) {
        AppDB.data.managements = Object.values(AppDB.data.managements);
    }
    
    const targetIndex = AppDB.data.managements.findIndex(m => m && m.id === id);
    if (targetIndex === -1) return;

    const mgmtName = AppDB.data.managements[targetIndex].name;
    const check = confirm(`⚠️ ALERTA DE CONFIGURACIÓN:\n¿Está seguro de que desea eliminar la categoría "${mgmtName}"?\n\nEsto desvinculará los reportes operacionales asociados.`);
    
    if (check) {
        const activeUser = (App.currentUser && App.currentUser.username) ? App.currentUser.username : "admin";
        
        if (typeof AppDB.addLog === "function") {
            AppDB.addLog(activeUser, "BORRAR_CATALOGO", `Eliminó categoría: ${mgmtName}`);
        }
        
        AppDB.data.managements.splice(targetIndex, 1);
        AppDB.save();
        
        alert("Categoría dada de baja en los servidores cloud.");
        this.openManagementsMenu();
    }
};
