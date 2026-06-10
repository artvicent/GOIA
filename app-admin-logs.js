/**
 * PLATAFORMA DE CONTROL DE GESTIONES EJECUTIVAS - GOIA v2.02
 * MÓDULO: HISTORIAL DE AUDITORÍA INTERNA CLOUD (app-admin-logs.js)
 */

App.openAuditLogsMenu = function() {
    // 1. Mostrar la capa flotante del modal
    document.getElementById("modalOverlay").classList.remove("hidden");
    
    // 2. Inyectar la estructura base de la interfaz de auditoría
    document.getElementById("modalContent").innerHTML = `
        <div class="modal-inner-header">
            <h3>📋 HISTORIAL DE AUDITORÍA INTERNA (LOGS)</h3>
            <button onclick="App.openAdminMenu()" class="btn-secondary" style="font-size:12px; padding:4px 10px;">&larr; Volver</button>
        </div>
        
        <div class="admin-config-form-layout" style="gap:1rem; margin-bottom: 1rem;">
            <div class="admin-config-card" style="padding:0.75rem; background:#f8fafc; border:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:11px; font-weight:700; color:#475569;">ESTADO DE TRANSPORTE DIGITAL:</span>
                <span style="font-size:10px; font-weight:700; color:#16a34a; background:#dcfce7; padding:2px 6px; border-radius:4px;">100% INMUNE A BORRADOS LOCALES</span>
            </div>
        </div>

        <div class="table-container custom-scrollbar" style="max-height:350px; overflow-y:auto; border: 1px solid #e2e8f0;">
            <table class="executive-table" style="width:100%;">
                <thead>
                    <tr style="background:#f1f5f9;">
                        <th style="font-size:10px; padding:8px 4px; text-align:left; color:#475569;">MARCA TEMPORAL (UTC)</th>
                        <th style="font-size:10px; padding:8px 4px; text-align:left; color:#475569;">USUARIO</th>
                        <th style="font-size:10px; padding:8px 4px; text-align:left; color:#475569;">ACCIÓN</th>
                        <th style="font-size:10px; padding:8px 4px; text-align:left; color:#475569;">DESCRIPCIÓN OPERACIONAL</th>
                    </tr>
                </thead>
                <tbody id="tableAuditLogsBody">
                    <tr><td colspan="4" style="text-align:center; padding:1rem; color:#64748b; font-size:12px;">Extrayendo trazas de la nube...</td></tr>
                </tbody>
            </table>
        </div>
    `;

    // 3. Ejecutar el renderizado de los datos vivos de auditoría
    App.handleRenderAuditLogsTable();
};

App.handleRenderAuditLogsTable = function() {
    var tbody = document.getElementById("tableAuditLogsBody");
    if (!tbody) return;

    var html = "";

    // Verificar si existen logs sembrados en la memoria viva de AppDB
    if (typeof AppDB !== 'undefined' && AppDB.data && AppDB.data.logs) {
        var logsData = AppDB.data.logs;

        // Si es un objeto en vez de un array (común en Firebase), lo convertimos
        var logsArray = [];
        if (Array.isArray(logsData)) {
            logsArray = logsData;
        } else if (typeof logsData === 'object') {
            Object.keys(logsData).forEach(function(key) {
                logsArray.push(logsData[key]);
            });
        }

        // Si no hay registros guardados en la nube
        if (logsArray.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:1rem; color:#94a3b8; font-size:11px;">No existen trazas de auditoría registradas en este ciclo cloud.</td></tr>`;
            return;
        }

        // Ordenar los logs para mostrar los más recientes arriba (Cronología Inversa)
        logsArray.sort(function(a, b) {
            return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
        });

        // Iterar y construir las filas semánticas de la tabla
        logsArray.forEach(function(log) {
            if (!log) return;
            
            // Formatear la fecha ISO a algo legible
            var dateFormatted = "Sin Registro";
            if (log.timestamp) {
                var d = new Date(log.timestamp);
                dateFormatted = d.toLocaleDateString() + " " + d.toLocaleTimeString();
            }

            // Aplicar un color sutil al tipo de acción para mejorar la visualización técnica
            var actionColor = "#1e293b";
            if (log.action && log.action.includes("ERROR")) actionColor = "#dc2626";
            if (log.action && log.action.includes("CREAR")) actionColor = "#2563eb";
            if (log.action && log.action.includes("ELIMINAR")) actionColor = "#b91c1c";
            if (log.action && log.action.includes("RECUPERACION")) actionColor = "#16a34a";

            html += `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="font-size:11px; padding:6px 4px; color:#64748b; white-space:nowrap;">${dateFormatted}</td>
                    <td style="font-size:11px; padding:6px 4px; font-weight:700; color:#334155;">@${log.user || 'sistema'}</td>
                    <td style="font-size:10px; padding:6px 4px;"><span style="font-weight:700; color:${actionColor}; background:#f8fafc; padding:2px 4px; border:1px solid #e2e8f0; border-radius:3px;">${log.action || 'LOG'}</span></td>
                    <td style="font-size:11px; padding:6px 4px; color:#475569; max-width:250px; overflow:hidden; text-overflow:ellipsis;" title="${log.detail || ''}">${log.detail || 'Sin detalles'}</td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    } else {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:1rem; color:#ef4444; font-size:11px;">⚠️ Error de enlace: El motor AppDB.data.logs no está disponible.</td></tr>`;
    }
};
