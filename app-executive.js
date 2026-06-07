/**
 * SISTEMA DE CONTROL DE GESTIONES - MOTOR EJECUTIVO VISUAL (app-executive.js)
 * PARTE 1 DE 3: PROCESAMIENTO DE TIEMPOS, CONTROL DE ALERTAS Y RENDER DE METAS CLOUD
 */

// Función Maestra: Renderizar y procesar la matriz de datos numéricos en pantalla
App.renderDashboardData = function() {
    if (!AppDB.data || !AppDB.data.assignments) return;

    const currentMonthFilter = document.getElementById("filterAuditMonth").value;
    const currentStatusFilter = document.getElementById("filterAssignmentStatus").value;
    const tableBody = document.getElementById("tableAssignmentsBody");
    const monitorContainer = document.getElementById("monitorContainer");

    if (!tableBody) return;
    tableBody.innerHTML = "";

    let totalAssignments = 0;
    let totalWarning = 0;
    let totalDanger = 0;
    let processedTotalCount = 0;
    let metaTotalCount = 0;

    let monitorHtml = "";
    const now = new Date();

    // Filtrar y evaluar las actividades vigentes del ciclo operacional
    AppDB.data.assignments.forEach(function(item, index) {
        if (currentMonthFilter !== "all" && currentMonthFilter !== "current") {
            const itemDate = new Date(item.createdAt || item.timestamp);
            if ((itemDate.getMonth() + 1).toString() !== currentMonthFilter) return;
        }

        let timeRemainingStr = "⏳ Evaluando...";
        let statusClass = "pending";
        let cardAlertClass = "bg-total";

        if (item.status === "completed") {
            timeRemainingStr = "🏁 Culminada";
            statusClass = "completed";
            processedTotalCount += parseInt(item.processed || 0);
            metaTotalCount += parseInt(item.meta || 0);
        } else {
            const deadline = new Date(item.deadline);
            const diffMs = deadline - now;
            const diffMin = Math.ceil(diffMs / 60000);

            metaTotalCount += parseInt(item.meta || 0);
            processedTotalCount += parseInt(item.processed || 0);

            if (diffMin <= 0) {
                timeRemainingStr = "🚨 Vencida";
                statusClass = "expired";
                cardAlertClass = "bg-danger";
                totalDanger++;
            } else if (diffMin <= 30) {
                timeRemainingStr = `⏳ ${diffMin} min restante(s)`;
                statusClass = "warning";
                cardAlertClass = "bg-warning";
                totalWarning++;
            } else {
                const hours = Math.floor(diffMin / 60);
                const mins = diffMin % 60;
                timeRemainingStr = `⏳ ${hours}h ${mins}m`;
                statusClass = "pending";
            }
        }

        if (currentStatusFilter !== "all" && currentStatusFilter !== statusClass) return;

        totalAssignments++;

        let tr = document.createElement("tr");
        tr.className = `status-row-${statusClass}`;
        
        tr.innerHTML = `
            <td><b>${item.name}</b><br><small class="text-muted-blue">${item.managementName || "Caso General"}</small></td>
            <td class="text-center font-bold">${item.meta}</td>
            <td class="text-center">${item.processed}</td>
            <td class="text-center"><span class="badge-reference">${item.reference || "S/R"}</span></td>
            <td class="text-center"><span class="time-label-${statusClass}">${timeRemainingStr}</span></td>
            <td class="text-center">
                <button onclick="App.openUpdateProgressModal(${index})" class="btn-secondary">Progreso</button>
                ${AppDB.data.roles[App.currentUser.role].lvl >= 3 ? `<button onclick="App.deleteAssignmentCloud(${index})" class="btn-secondary btn-logout">Eliminar</button>` : ""}
            </td>
        `;
        tableBody.appendChild(tr);

        // CORRECCIÓN: Alertas limpias sin inyecciones de margen o padding en línea
        if (statusClass === "expired" || statusClass === "warning") {
            monitorHtml += `
                <div class="counter-card ${cardAlertClass} monitor-alert-item">
                    <p class="alert-item-title">⚠️ ALERTA OPERACIONAL</p>
                    <p class="alert-item-body">La actividad <b>${item.name}</b> asignada a la referencia <b>${item.reference || "S/R"}</b> se encuentra en estado crítico.</p>
                </div>`;
        }
    });

    document.getElementById("countTotal").innerText = totalAssignments;
    document.getElementById("countWarning").innerText = totalWarning;
    document.getElementById("countDanger").innerText = totalDanger;

    let ied = 0;
    if (metaTotalCount > 0) {
        ied = Math.round((processedTotalCount / metaTotalCount) * 100);
    }
    document.getElementById("countPerformance").innerText = `${ied}%`;

    if (monitorContainer) {
        if (monitorHtml) {
            monitorContainer.innerHTML = monitorHtml;
        } else {
            monitorContainer.innerHTML = `<p class="monitor-empty-text">Cero alertas. Operación bajo parámetros normales.</p>`;
        }
    }
};
/**
 * SISTEMA DE CONTROL DE GESTIONES - MOTOR EJECUTIVO VISUAL (app-executive.js)
 * PARTE 2 DE 3: PROGRESO DE ACTIVIDADES, ACTUALIZACIÓN DE LOGS Y REPORTES CONSOLIDADOS
 */

// Desplegar la ventana modal para reportar avances de metas y cargas
App.openUpdateProgressModal = function(index) {
    const item = AppDB.data.assignments[index];
    if (!item) return;

    document.getElementById("modalOverlay").classList.remove("hidden");
    document.getElementById("modalContent").innerHTML = `
        <div class="modal-inner-header">
            <h3>Actualizar Progreso de Actividad</h3>
            <button onclick="document.getElementById('modalOverlay').classList.add('hidden')">&times;</button>
        </div>
        
        <div class="admin-config-card">
            <p class="modal-text-bold"><b>Actividad:</b> ${item.name}</p>
            <p class="modal-text-muted"><b>Meta total asignada:</b> ${item.meta} unidades.</p>
            <p class="modal-text-muted-spacer"><b>Procesadas actuales:</b> ${item.processed} unidades.</p>
            
            <div class="form-group">
                <label>Cantidad Adicional Procesada</label>
                <div class="input-inline-row">
                    <input type="number" id="inputAddQty" class="form-control" placeholder="Ej: 5" min="1">
                    <button onclick="App.executeUpdateProgress(${index})" class="btn-primary">Sumar</button>
                </div>
            </div>
            
            <div class="modal-action-row-footer">
                <button onclick="App.markAssignmentAsCompleted(${index})" class="btn-primary btn-success-finish">🏁 Culminar Actividad</button>
            </div>
        </div>
    `;
};

// Procesar el incremento síncrono de metas y registrar en auditoría cloud
App.executeUpdateProgress = function(index) {
    const qtyInput = document.getElementById("inputAddQty");
    if (!qtyInput) return;

    const addQty = parseInt(qtyInput.value);
    if (isNaN(addQty) || addQty <= 0) {
        return alert("Por favor, ingrese una cantidad numérica superior a cero.");
    }

    const item = AppDB.data.assignments[index];
    const newProcessed = parseInt(item.processed || 0) + addQty;

    if (newProcessed > parseInt(item.meta)) {
        return alert("Operación rechazada: La cantidad procesada no puede superar la meta asignada.");
    }

    item.processed = newProcessed;
    
    if (item.processed === parseInt(item.meta)) {
        item.status = "completed";
    }

    AppDB.save();
    AppDB.addLog(App.currentUser.username, "INCREMENTO_META", `Sumó ${addQty} a la actividad: ${item.name}`);
    
    document.getElementById("modalOverlay").classList.add("hidden");
    alert("Progreso sincronizado de forma exitosa en la nube.");
};

// Forzar la culminación de la tarea de forma manual
App.markAssignmentAsCompleted = function(index) {
    const item = AppDB.data.assignments[index];
    item.status = "completed";
    item.processed = item.meta;

    AppDB.save();
    AppDB.addLog(App.currentUser.username, "CULMINAR_TAREA", `Marcó como completada: ${item.name}`);
    
    document.getElementById("modalOverlay").classList.add("hidden");
    alert("Actividad guardada en estado culminado.");
};

// Abrir el menú ejecutivo de reportes consolidados y auditoría mensual
// Abrir el menú ejecutivo de reportes consolidados y auditoría con exportación PDF
App.openReportsMenu = function() {
    document.getElementById("modalOverlay").classList.remove("hidden");
    
    let totalMeta = 0;
    let totalProcessed = 0;
    
    AppDB.data.assignments.forEach(function(item) {
        totalMeta += parseInt(item.meta || 0);
        totalProcessed += parseInt(item.processed || 0);
    });

    let eficienciaGeneral = totalMeta > 0 ? Math.round((totalProcessed / totalMeta) * 100) : 0;

    document.getElementById("modalContent").innerHTML = `
        <div class="modal-inner-header">
            <h3>📊 Reporte Operacional General</h3>
            <button onclick="document.getElementById('modalOverlay').classList.add('hidden')">&times;</button>
        </div>
        
        <div class="admin-config-card report-card-gap">
            <p class="report-meta-text"><b>Ciclo Evaluado:</b> Año en Curso 2026</p>
            <p class="report-data-text"><b>Volumen de Metas Cargadas:</b> ${totalMeta} items.</p>
            <p class="report-data-text"><b>Volumen de Gestiones Procesadas:</b> ${totalProcessed} items.</p>
            <p class="report-efficiency-text"><b>Índice Neto de Eficiencia (IED):</b> ${eficienciaGeneral}%</p>
            
            <div class="modal-divider-line"></div>
            
            <!-- MÓDULO EXPORTADOR DE ALTO NIVEL PARA LA GERENCIA -->
            <label class="report-export-label-title">📦 MÓDULO DE EXPORTACIÓN EXCEL / PDF</label>
            <div class="report-buttons-grid-layout">
                <button onclick="App.executeExportDataToPDF('SEMANAL')" class="btn-primary-export bg-sky-export">
                    📄 GENERAR REPORTE SEMANAL (.PDF)
                </button>
                <button onclick="App.executeExportDataToPDF('MENSUAL')" class="btn-primary-export bg-navy-export">
                    📅 GENERAR REPORTE MENSUAL (.PDF)
                </button>
            </div>
            
            <div class="modal-divider-line"></div>
            <p class="report-footer-disclaimer">Este balance consolida todas las actividades de Pin Pagos, desinstalaciones y requerimientos de Help Desk procesados de forma global por el equipo.</p>
        </div>
    `;
};

// Controlador de impresión y empaquetado nativo PDF
App.executeExportDataToPDF = function(tipoReporte) {
    if (!App.currentUser) return;
    
    alert(`⏳ Procesando algoritmo de compilación...\nGenerando reporte consolidadado ${tipoReporte} en formato PDF portable de la Gerencia.`);
    
    // Al invocar el controlador de impresión nativo del motor Chromium,
    // el navegador web compilará la hoja de estilos custom.css optimizada para PDF.
    window.print();
    
    AppDB.addLog(App.currentUser.username, "EXPORTAR_PDF", `Exportó balance consolidado de tipo: ${tipoReporte}`);
};

/**
 * SISTEMA DE CONTROL DE GESTIONES - MOTOR EJECUTIVO VISUAL (app-executive.js)
 * PARTE 3 DE 3: ELIMINACIÓN CLOUD, PODIO DE MÉRITO Y MENÚ DE AVATARES PERSONALIZADOS
 */

// Eliminar actividad de forma permanente de la nube de Firebase
App.deleteAssignmentCloud = function(index) {
    const item = AppDB.data.assignments[index];
    if (!item) return;

    const check = confirm(`⚠️ ALERTA DE AUDITORÍA:\n¿Está completamente seguro de que desea eliminar permanentemente la actividad "${item.name}" de la nube?`);
    if (check) {
        AppDB.addLog(App.currentUser.username, "ELIMINACION_TAREA", `Eliminó la actividad: ${item.name}`);
        AppDB.data.assignments.splice(index, 1);
        AppDB.save();
        alert("Actividad eliminada y sincronizada en la red.");
    }
};

// Algoritmo de Evaluación de Desempeño: Calcular y proyectar el Top Colaborador
App.calculateMeritPodiumPerformance = function() {
    const topUserField = document.getElementById("topUserWorker");
    if (!topUserField || !AppDB.data || !AppDB.data.assignments || AppDB.data.assignments.length === 0) {
        if (topUserField) topUserField.innerText = "Sin registros acumulados";
        return;
    }

    let userScores = {};

    AppDB.data.assignments.forEach(function(item) {
        if (item.status === "completed" && item.createdBy) {
            const user = item.createdBy.toUpperCase();
            const score = parseInt(item.processed || 0);
            userScores[user] = (userScores[user] || 0) + score;
        }
    });

    let topUser = null;
    let maxScore = -1;

    for (const [user, score] of Object.entries(userScores)) {
        if (score > maxScore) {
            maxScore = score;
            topUser = user;
        }
    }

    if (topUser && maxScore > 0) {
        topUserField.innerText = `${topUser} (${maxScore} Gestiones)`;
    } else {
        topUserField.innerText = "Analizando ciclo activo...";
    }
};

// Abrir modal de créditos e información del entorno cloud seguro
App.openAboutModal = function() {
    document.getElementById("modalOverlay").classList.remove("hidden");
    document.getElementById("modalContent").innerHTML = `
        <div class="modal-inner-header">
            <h3>ℹ️ Acerca del Sistema</h3>
            <button onclick="document.getElementById('modalOverlay').classList.add('hidden')">&times;</button>
        </div>
        
        <div class="admin-config-card about-modal-card-labels">
            <p><b>PLATAFORMA:</b> Control de Gestiones Ejecutivas (GOIA)</p>
            <p><b>GERENCIA:</b> Gerencia General de Adquirencia</p>
            <p><b>EDICIÓN:</b> v2.0.3 - Cloud Integrado Blindado</p>
            <p><b>SEGURIDAD:</b> Arquitectura de datos externa síncrona enlazada con Firebase Realtime Database y protección de token anónimo de Google.</p>
            <div class="modal-divider-line"></div>
            <p class="about-modal-footer">Desarrollado para la automatización de cargas de trabajo corporativas y cumplimiento estricto de ANS. &copy; 2026 Todos los derechos reservados.</p>
        </div>
    `;
};

// Abrir el selector dinámico de avatares e insignias del perfil
App.openAvatarSelectionModal = function() {
    document.getElementById("modalOverlay").classList.remove("hidden");
    
    const avatares = ["👤", "💼", "🏢", "📈", "💻", "🚀", "🛡️", "👑", "🔥", "⚡"];
    let htmlAvatares = "";

    avatares.forEach(function(avatar) {
        htmlAvatares += `
            <button onclick="App.executeChangeAvatarCloud('${avatar}')" class="btn-secondary avatar-selector-grid-item">
                ${avatar}
            </button>`;
    });

    document.getElementById("modalContent").innerHTML = `
        <div class="modal-inner-header">
            <h3>Seleccionar Insignia / Avatar</h3>
            <button onclick="document.getElementById('modalOverlay').classList.add('hidden')">&times;</button>
        </div>
        
        <p class="avatar-modal-description">Elija el icono representativo que se desplegará junto a su nombre en la barra del Dashboard principal:</p>
        
        <div class="avatar-buttons-grid-layout">
            ${htmlAvatares}
        </div>
    `;
};

// Registrar el nuevo icono de identidad en la nube de Google
App.executeChangeAvatarCloud = function(nuevoAvatar) {
    if (!App.currentUser) return;

    const username = App.currentUser.username.toLowerCase();
    if (AppDB.data.users[username]) {
        AppDB.data.users[username].avatar = nuevoAvatar;
        App.currentUser.avatar = nuevoAvatar;
        
        const frame = document.getElementById("userAvatarFrame");
        if (frame) frame.innerText = nuevoAvatar;

        AppDB.save();
        AppDB.addLog(username, "CAMBIO_AVATAR", `Actualizó su insignia a: ${nuevoAvatar}`);
        
        document.getElementById("modalOverlay").classList.add("hidden");
        alert("Insignia de perfil actualizada de forma exitosa.");
    }
};

// Disparar el recálculo analítico automático de eficiencia cada 5 segundos
setInterval(function() {
    if (typeof App !== 'undefined' && App.currentUser) {
        App.calculateMeritPodiumPerformance();
    }
}, 5000);
