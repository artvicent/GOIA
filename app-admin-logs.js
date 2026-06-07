/**
 * ADMINISTRACIÓN PARTE E: VISOR MAESTRO DE LOGS DE AUDITORÍA (app-admin-logs.js)
 * Conexión Directa al Historial Unificado Físico de Red
 */

App.openAuditLogsMenu = function() {
    // 1. Recuperar los logs directamente de la matriz unificada de red
    const logs = AppDB.data.logs || [];
    let rows = "";

    // 2. Renderizar de forma inversa (lo más nuevo arriba)
    for (let i = logs.length - 1; i >= 0; i--) {
        const log = logs[i];
        if (!log.timestamp) continue;
        
        const dateObj = new Date(log.timestamp);
        const timeStr = dateObj.toLocaleTimeString();
        const dateStr = dateObj.toLocaleDateString();

        let actionBadgeColor = "background:#f1f5f9; color:#475569;";
        if (log.action.includes("FAIL") || log.action.includes("DELETE") || log.action.includes("BLOQ") || log.action.includes("LOGOUT")) {
            actionBadgeColor = "background:#fee2e2; color:#b91c1c; font-weight:bold;";
        } else if (log.action.includes("CREATE") || log.action.includes("SUCCESS") || log.action.includes("ASSIGN")) {
            actionBadgeColor = "background:#dcfce7; color:#15803d; font-weight:bold;";
        } else if (log.action.includes("EXECUTE") || log.action.includes("BATCH")) {
            actionBadgeColor = "background:#eff6ff; color:#1d4ed8;";
        }

        rows += `
            <tr style="border-bottom:1px solid #e2e8f0; font-size:11px;">
                <td style="padding:6px; color:#64748b; white-space:nowrap;">${dateStr}<br><small>${timeStr}</small></td>
                <td style="padding:6px; font-weight:bold; color:#0f172a;">${log.user.toUpperCase()}</td>
                <td style="padding:6px; text-align:center;">
                    <span style="font-size:9px; padding:2px 5px; border-radius:4px; ${actionBadgeColor}">${log.action}</span>
                </td>
                <td style="padding:6px; color:#334155; max-width:180px; word-break:break-word;">${log.details || "Sin descripción"}</td>
            </tr>`;
    }

    document.getElementById("modalContent").innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e2e8f0;padding-bottom:0.5rem;margin-bottom:1rem;">
            <h3 style="margin:0;font-size:12px;text-transform:uppercase;font-weight:700;color:#9f1239;">Bitácora de Auditoría Gerencial</h3>
            <button onclick="App.openAdminMenu()" class="btn-secondary" style="padding:2px 6px;font-size:10px;">&larr; Volver</button>
        </div>
        
        <p style="font-size:10px; color:#64748b; margin:0 0 0.75rem 0; text-transform:uppercase; font-weight:bold;">
            Historial unificado: ${logs.length} transacciones registradas de forma segura en disco.
        </p>

        <div style="max-height:320px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:8px;" class="custom-scrollbar">
            <table style="width:100%; border-collapse:collapse; text-align:left;">
                <thead>
                    <tr style="background:#f8fafc; color:#475569; text-transform:uppercase; font-size:9px; border-bottom:1px solid #cbd5e1;">
                        <th style="padding:6px;">Fecha/Hora</th>
                        <th style="padding:6px;">Usuario</th>
                        <th style="padding:6px; text-align:center;">Acción</th>
                        <th style="padding:6px;">Detalles del Movimiento</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows || '<tr><td colspan="4" style="text-align:center; padding:2rem; color:#94a3b8; font-style:italic;">No se registran movimientos en la bitácora aún.</td></tr>'}
                </tbody>
            </table>
        </div>
        
        <div style="margin-top:1rem; text-align:right;" class="no-print">
            <button onclick="window.print()" class="btn-primary" style="padding:0.5rem 1rem; font-size:10px; font-weight:bold; background:#be123c;">🖨️ IMPRIMIR BITÁCORA</button>
        </div>`;
};
