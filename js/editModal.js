function escaparHTML(texto) {
    if (texto === null || texto === undefined) return "";
    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function verVideoPrincipal() {
    const btn = document.querySelector('.btn-ver-video');
    if (!btn) return;
    
    const videoUrl = btn.getAttribute('data-video-url');
    if (!videoUrl) return;

    // Cerrar modal de video si ya está abierto
    const existing = document.querySelector('.main-video-preview-modal-overlay');
    if (existing) existing.remove();

    const html = `
        <div class="main-video-preview-modal-overlay">
            <div class="main-video-preview-modal">
                <div class="main-video-preview-modal-header">
                    <h3>🎬 Video Principal</h3>
                    <button type="button" class="main-video-preview-modal-close">&times;</button>
                </div>
                <div class="main-video-preview-modal-body">
                    <video class="main-video-preview-modal-video" controls preload="metadata" width="100%">
                        <source src="${escaparHTML(videoUrl)}?t=${Date.now()}" type="video/mp4">
                    </video>
                </div>
            </div>
        </div>`;

    document.body.insertAdjacentHTML('beforeend', html);

    const overlay = document.querySelector('.main-video-preview-modal-overlay');
    const closeBtn = overlay.querySelector('.main-video-preview-modal-close');

    closeBtn.addEventListener('click', function () {
        overlay.remove();
    });

    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

// MODAL BLOQUEANTE: representa un job en curso ("diálogos de video en proceso").
// A propósito NO tiene botón de cierre, ni click-afuera, ni tecla Escape.
// Solo debe removerse programáticamente desde el código que controla el flujo
// (ej: document.querySelector('.generando-video-overlay')?.remove()).
function mostrarGenerandoVideoModal(message) {
    const existing = document.querySelector('.generando-video-overlay');
    if (existing) existing.remove();

    const html = `
        <div class="generando-video-overlay">
            <div class="generando-video-modal">
                <div class="generando-video-icon">🎬</div>
                <h3>Diálogos de video en Proceso</h3>
                <p>${escaparHTML(message)}</p>
                <div class="generando-video-spinner"><span class="spinner"></span></div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
}

// MODAL BLOQUEANTE: la escena entró en cola de generación (ej: respuesta de
// /webhook/regenerate-scene con "Generación de escena en proceso"). Sin botón
// de cierre, sin click-afuera, sin Escape. Solo se remueve programáticamente
// desde pollEscenaRegenerada() cuando el polling a /webhook/escena resuelve.
function mostrarGenerandoEscenaModal(message) {
    const existing = document.querySelector('.generando-escena-overlay');
    if (existing) existing.remove();

    const html = `
        <div class="generando-escena-overlay">
            <div class="generando-escena-modal">
                <div class="generando-escena-icon">🎬</div>
                <h3>Generación de Escena en Proceso</h3>
                <p>${escaparHTML(message)}</p>
                <div class="generando-escena-spinner"><span class="spinner"></span></div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
}

// MODAL BLOQUEANTE: el video final entró en cola de generación (respuesta de
// /webhook/generation confirmando que n8n inició el proceso). Sin botón de
// cierre, sin click-afuera, sin Escape. Solo se remueve programáticamente
// desde pollVideoGenerado() cuando el polling a /webhook/estado detecta
// estado === 'generado' (o un estado de error).
function mostrarGenerandoVideoFinalModal(message) {
    const existing = document.querySelector('.generando-video-final-overlay');
    if (existing) existing.remove();

    const html = `
        <div class="generando-video-final-overlay">
            <div class="generando-video-final-modal">
                <div class="generando-video-final-icon">🎬</div>
                <h3>Generación de Video en Proceso</h3>
                <p>${escaparHTML(message)}</p>
                <div class="generando-video-final-spinner"><span class="spinner"></span></div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
}

// MODAL BLOQUEANTE: informa que ya hay un job corriendo para esta nota.
// Se cierra solo cuando el polling en formHandler.js detecta un estado final
// (completed/done/failed/error) o cuando aparece el HTML del Second Brain.
function mostrarJobEnCursoModal(message) {
    const existing = document.querySelector('.job-en-curso-overlay');
    if (existing) existing.remove();

    const html = `
        <div class="job-en-curso-overlay">
            <div class="job-en-curso-modal">
                <div class="job-en-curso-icon">⏳</div>
                <h3>Job en Curso</h3>
                <p>${escaparHTML(message)}</p>
                <div class="job-en-curso-spinner"><span class="spinner"></span></div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
}

// MODAL BLOQUEANTE: el usuario debe elegir un formato sí o sí (sin click-afuera,
// sin Escape). jobId viaja como parámetro explícito (fuente confiable) en vez de
// depender de localStorage, que puede haber sido limpiado antes de que el
// usuario confirme su elección.
function mostrarRecomendacionFormatoModal(htmlContent, email, noteUrl, noticiaId = null, jobId = null) {
    const existing = document.querySelector('.recomendacion-formato-overlay');
    if (existing) existing.remove();

    const html = `
        <div class="recomendacion-formato-overlay">
            <div class="recomendacion-formato-modal">
                <div class="recomendacion-formato-icon">🧠</div>
                <h3>Recomendación del Second Brain</h3>
                <div class="recomendacion-formato-content">${htmlContent}</div>
                <div class="recomendacion-formato-form">
                    <label for="formato-select">Selecciona el formato:</label>
                    <select id="formato-select">
                        <option value="video">video</option>
                        <option value="historieta">historieta</option>
                    </select>
                    <button class="btn-recomendacion-confirm">Confirmar</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    const overlay = document.querySelector('.recomendacion-formato-overlay');
    const confirmBtn = overlay.querySelector('.btn-recomendacion-confirm');
    const select = overlay.querySelector('#formato-select');

    function cerrarModal() {
        overlay.remove();
    }

    confirmBtn.addEventListener('click', async function () {
        const formatoSeleccionado = select.value;
        cerrarModal();

        // Mostrar modal bloqueante "Diálogos de video en Proceso"
        mostrarGenerandoVideoModal('Procesando formato seleccionado...');

        try {
            // jobId viene por parámetro (fuente confiable); localStorage solo como respaldo
            const jobIdFinal = jobId || localStorage.getItem('videoJobId');
            if (!jobIdFinal) {
                console.warn('⚠️ jobId no encontrado, no se puede continuar');
                document.querySelector('.generando-video-overlay')?.remove();
                window.resetSubmitBtn?.();
                return;
            }

            const payload = { formato: formatoSeleccionado, email, nota: noteUrl, jobId: jobIdFinal };
            if (noticiaId) {
                payload.noticia_id = noticiaId;
            }

            // 1. Enviar formato seleccionado
            const formatoResponse = await fetch(`${DOMAIN}/webhook/formato`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!formatoResponse.ok) {
                console.warn('⚠️ Error al enviar formato');
                document.querySelector('.generando-video-overlay')?.remove();
                window.resetSubmitBtn?.();
                return;
            }

            console.log(`✅ Formato "${formatoSeleccionado}" enviado correctamente`);

            // 2. Polling a /webhook/estado hasta detectar estado === 'escenas-creadas'
            const pollingInterval = setInterval(async () => {
                try {
                    const response = await fetch(`${DOMAIN}/webhook/estado?jobId=${encodeURIComponent(jobIdFinal)}`);
                    if (response.ok) {
                        const rawData = await response.json();
                        const statusData = Array.isArray(rawData) ? (rawData.length > 0 ? rawData[0] : null) : rawData;

                        if (statusData && statusData.estado === 'escenas-creadas') {
                            clearInterval(pollingInterval);
                            // 3. Cerrar modal "Diálogos de video en Proceso"
                            document.querySelector('.generando-video-overlay')?.remove();
                            console.log('✅ Estado "escenas-creadas" detectado');

                            // 4. Liberar el botón "Iniciar proceso" del form: el ciclo terminó
                            window.resetSubmitBtn?.();

                            // 5. Mostrar aviso para entrar al editor
                            mostrarEscenasCreadasModal(email, noteUrl);
                        }
                    }
                } catch (error) {
                    console.warn('⚠️ Error en polling tras formato:', error.message);
                }
            }, 5000);
        } catch (error) {
            console.warn('⚠️ Error de red al enviar formato:', error.message);
            document.querySelector('.generando-video-overlay')?.remove();
            window.resetSubmitBtn?.();
        }
    });

    // A propósito NO hay listener de click-afuera ni de Escape en este modal:
    // el usuario debe confirmar un formato para continuar.
}

// MODAL de confirmación (no bloqueante): las escenas ya fueron creadas.
// Ofrece entrar directo al editor volviendo a pedir los datos a /webhook/edit
// y reutilizando la misma transformación que usa el flujo inicial.
function mostrarEscenasCreadasModal(email, noteUrl) {
    const existing = document.querySelector('.escenas-creadas-overlay');
    if (existing) existing.remove();

    const html = `
        <div class="escenas-creadas-overlay">
            <div class="escenas-creadas-modal">
                <div class="escenas-creadas-icon">✅</div>
                <h3>Escenas creadas</h3>
                <p>Las escenas del video han sido creadas. Puedes entrar al editor para generar el video.</p>
                <button class="btn-escenas-creadas-editor">✏️ Entrar al editor</button>
                <button class="btn-escenas-creadas-cerrar">Cerrar</button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    const overlay = document.querySelector('.escenas-creadas-overlay');
    const editorBtn = overlay.querySelector('.btn-escenas-creadas-editor');
    const cerrarBtn = overlay.querySelector('.btn-escenas-creadas-cerrar');

    function cerrarModal() {
        overlay.remove();
    }

    cerrarBtn.addEventListener('click', cerrarModal);

    editorBtn.addEventListener('click', async function () {
        editorBtn.disabled = true;
        editorBtn.innerHTML = '<span class="spinner"></span>Cargando...';

        try {
            const response = await fetch(`${DOMAIN}/webhook/edit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, nota: noteUrl })
            });

            if (!response.ok) {
                console.warn('⚠️ Error al obtener datos para el editor');
                editorBtn.disabled = false;
                editorBtn.innerHTML = '✏️ Entrar al editor';
                return;
            }

            const data = await response.json();
            let responseData = Array.isArray(data) ? data[0] : data;
            if (Array.isArray(responseData)) {
                responseData = responseData[0];
            }

            if (!responseData || typeof responseData !== 'object' || !Array.isArray(responseData.escenas)) {
                console.warn('⚠️ Datos inválidos para abrir el editor');
                editorBtn.disabled = false;
                editorBtn.innerHTML = '✏️ Entrar al editor';
                return;
            }

            const transformed = window.transformarDatosNoticia(responseData);
            cerrarModal();
            openEditModal(transformed);
        } catch (error) {
            console.warn('⚠️ Error de red al cargar el editor:', error.message);
            editorBtn.disabled = false;
            editorBtn.innerHTML = '✏️ Entrar al editor';
        }
    });

    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) cerrarModal();
    });
    document.addEventListener('keydown', function handler(e) {
        if (e.key === 'Escape') {
            cerrarModal();
            document.removeEventListener('keydown', handler);
        }
    });
}

function buildEditForm(data) {
    const {
        formato, es_video, etiqueta_contenido, 
        produccion_id, noticia_id,
        escenas, noticia,
        video_url, editor_responsable, main_scene,
        imagenes, imagen_seleccionada_default
    } = data;

    let formHTML = '';

    // --- 1. Header noticia ---
    if (noticia && noticia.titulo) {
        formHTML += `
            <div class="news-header-card">
                <h1>${escaparHTML(noticia.titulo)}</h1>
                <div class="news-header-meta">
                    <p class="news-header-author">✍️ ${escaparHTML(noticia?.autor ?? 'Sin autor')}</p>
                    <span class="format-badge">${escaparHTML((formato || "historieta").toUpperCase())}</span>
                    <a href="${escaparHTML(noticia?.url ?? '#')}" target="_blank" class="original-link">🔗 Ver nota original</a>
                </div>
            </div>`;
    }

    // --- 2. Preview de video principal ---
    if (video_url) {
        formHTML += `
            <div class="video-preview-card">
                <h3>🎬 Preview de Video Principal</h3>
                <button class="btn-ver-video" data-video-url="${escaparHTML(video_url)}">
                    🎥 Ver Video
                </button>
                <div id="video-container" style="margin-top: 12px;"></div>
            </div>`;
    }

    // --- 3. Selector de imagen ---
    if (imagenes && imagenes.length > 0 && es_video) {
        const defaultImgUrl = imagenes[0]?.url || '';
        formHTML += `
            <div class="image-selector-card">
                <h3>🖼️ Seleccionar Imagen de la Nota</h3>
                <div class="image-grid">
                    ${imagenes.map((img, index) => `
                        <div onclick="selectThumbnail(${index})" id="thumb-${index}" class="image-thumb${index === 0 ? ' selected' : ''}">
                            <img src="${escaparHTML(img.url)}">
                        </div>
                    `).join("")}
                </div>
                <input type="hidden" id="imagen_seleccionada" value="Imagen 1">
                <input type="hidden" id="imagen_seleccionada_url" value="${escaparHTML(defaultImgUrl)}">
            </div>`;
    }

    // --- 4. Campos generales editables ---
    formHTML += `
        <div class="config-section">
            <h3>⚙️ Configuración de Producción</h3>
            <input type="hidden" id="formato" value="${escaparHTML(formato || 'historieta')}">
            <div class="config-grid">
                <div class="config-field">
                    <label>📝 Título del video</label>
                    <input type="text" id="titulo_video" value="${escaparHTML(noticia?.titulo ?? '')}">
                </div>
                <div class="config-field">
                    <label>📋 Descripción del video</label>
                    <textarea id="descripcion_video" rows="2">${escaparHTML(noticia?.subtitulo ?? '')}</textarea>
                </div>
                <div class="config-field">
                    <label>👤 Editor responsable</label>
                    <input type="text" id="editor_responsable" value="${escaparHTML(editor_responsable ?? '')}">
                </div>
                ${formato !== 'historieta' ? `
                <div class="config-field">
                    <label>🧠 Prompt maestro (Inglés)</label>
                    <textarea id="main_scene" rows="2">${escaparHTML(main_scene ?? '')}</textarea>
                </div>` : ''}
            </div>
        </div>`;

    // --- 5. Lista de escenas/viñetas ---
    if (escenas && Array.isArray(escenas)) {
        formHTML += `
            <div class="scenes-section">
                <h2 class="scenes-title">✏️ Editar ${es_video ? "Escenas" : "Viñetas"}</h2>
                <div class="scenes-toolbar">
                    <button type="button" class="btn-select-all" id="btnSelectAll">Seleccionar todos</button>
                </div>
            </div>`;
        escenas.forEach((escena, idx) => {
            const { numero, titulo, dialogue, incluido, fieldName, reglasDialogo, previewUrl, item_id, produccion_id } = escena;
            const puedeEditar = (Number(escena.ediciones ?? 0) < 3);
            const maxPalabras = reglasDialogo?.maxPalabras || 16;

            const lockedClass = !puedeEditar ? ' locked' : '';
            const sceneId = `scene-${item_id || numero}`;
            formHTML += `
                <div id="${sceneId}" class="scene-card${lockedClass}" data-produccion-id="${escaparHTML(produccion_id)}" data-item-id="${escaparHTML(item_id)}" data-preview-url="${escaparHTML(previewUrl ?? '')}" data-titulo="${escaparHTML(titulo)}">
                    <div class="scene-card-header">
                        <h3>${es_video ? '🎬' : '🖼️'} ${es_video ? 'Escena' : 'Viñeta'} ${numero}</h3>
                        <span class="edition-badge">Ediciones: ${escena.ediciones ?? 0} / 3</span>
                    </div>
                    
                    <p class="scene-title-text">${escaparHTML(titulo)}</p>

                    ${fieldName?.incluido ? `
                        <div class="scene-include-checkbox">
                            <input type="checkbox" class="scene-checkbox" id="${fieldName.incluido}" data-numero="${numero}" ${incluido ? 'checked' : ''}>
                            <label for="${fieldName.incluido}">Incluir en el video</label>
                        </div>
                    ` : ''}

                    ${puedeEditar ? `
                        <div class="scene-dialogue-field">
                            <label>Diálogo (5–${maxPalabras} palabras)</label>
                            <textarea id="${fieldName.dialogo}" value="${escaparHTML(dialogue)}" rows="3" class="scene-dialogue-textarea" data-numero="${numero}">${escaparHTML(dialogue)}</textarea>
                            <div class="word-counter" data-numero="${fieldName.dialogo?.split('_').pop() || ''}">
                                ${dialogue ? (dialogue.split(/\s+/).filter(Boolean).length) : 0} / ${maxPalabras} palabras
                            </div>
                        </div>
                    ` : `
                        <div class="locked-dialogue-box">
                            <p class="locked-dialogue-text">${escaparHTML(dialogue)}</p>
                            <div class="locked-warning">
                                🔒 Límite de ediciones alcanzado
                            </div>
                        </div>
                    `}

                    <div class="scene-actions">
                        <button type="button" class="btn-scene-preview" data-numero="${numero}">🎬 Ver Preview</button>
                        ${puedeEditar ? `<button type="button" class="btn-scene-regenerate" data-numero="${numero}" data-ediciones="${escena.ediciones ?? 0}" ${(escena.ediciones ?? 0) >= 3 ? 'disabled' : ''}>🔄 Regenerar Escena con IA</button>` : ''}
                    </div>
                </div>`;
        });
    }

    return `
        <div class="edit-modal-overlay">
            <div class="edit-modal" data-produccion-id="${escaparHTML(produccion_id)}" data-noticia-id="${escaparHTML(noticia_id)}">
                <div class="edit-modal-header">
                    <h2>✏️ Editar ${es_video ? 'Escenas' : 'Viñetas'}</h2>
                    <button id="btnCloseEditModal" type="button" class="modal-close-icon">&times;</button>
                </div>
                <div class="edit-modal-body">
                    ${formHTML}
                </div>
                <div class="edit-modal-footer">
                    <div class="footer-actions">
                        <button class="btn-cancel" onclick="closeEditModal()">Cancelar</button>
                        <button class="btn-save" id="btnSave">Guardar cambios</button>
                        <button class="btn-generate-video" id="btnGenerateVideo">Unir videos</button>
                        <button class="btn-generate-video-final" id="btnGenerarVideoFinal">Generar Video</button>
                    </div>
                </div>
            </div>
        </div>`;
}

// Helper for thumbnail selection
window.selectThumbnail = function(index) {
    document.querySelectorAll('[id^="thumb-"]').forEach(el => {
        el.style.borderColor = 'transparent';
        el.classList.remove('selected');
    });
    const selected = document.getElementById(`thumb-${index}`);
    if (selected) {
        selected.style.borderColor = '#E30613';
        selected.classList.add('selected');
        const img = selected.querySelector('img');
        document.getElementById('imagen_seleccionada').value = `Imagen ${index + 1}`;
        if (img && document.getElementById('imagen_seleccionada_url')) {
            document.getElementById('imagen_seleccionada_url').value = img.src;
        }
    }
};

function openEditModal(data) {
    const existing = document.querySelector('.edit-modal-overlay');
    if (existing) existing.remove();
    
    try {
        localStorage.setItem('editModalData', JSON.stringify(data));
    } catch (e) {
        console.warn('No se pudo guardar en localStorage:', e);
    }
    
    const html = buildEditForm(data);
    document.body.insertAdjacentHTML('beforeend', html);
    
    const overlay = document.querySelector('.edit-modal-overlay');
    const closeBtn = document.getElementById('btnCloseEditModal');
    const saveBtn = document.getElementById('btnSave');
    
    if (!closeBtn || !saveBtn) {
        console.error('Error: No se encontraron los botones del modal');
        closeEditModal();
        showMessage('Error al abrir el modal. Por favor, intenta de nuevo.', 'error');
        return;
    }
    
    // Capturar valores iniciales para detectar cambios
    capturarValoresIniciales();
    
    // Botón Seleccionar todos / Deseleccionar todos
    const btnSelectAll = document.getElementById('btnSelectAll');
    if (btnSelectAll) {
        btnSelectAll.addEventListener('click', function () {
            const checkboxes = document.querySelectorAll('.scene-checkbox');
            if (checkboxes.length === 0) return;
            
            // Verificar si todos están marcados
            const todosMarcados = Array.from(checkboxes).every(cb => cb.checked);
            
            checkboxes.forEach(cb => {
                cb.checked = !todosMarcados;
            });
            
            // Actualizar texto del botón
            this.textContent = !todosMarcados ? 'Deseleccionar todos' : 'Seleccionar todos';
            
            // Marcar como cambios no guardados
            hasUnsavedChanges = true;
        });
    }
    
    closeBtn.addEventListener('click', function () {
        if (hasUnsavedChanges) {
            showAbandonModalDesdeX();
        } else {
            closeEditModal();
        }
    });
    
    // No cerrar el modal al hacer clic fuera de él
    
    // Botones de escena: Ver Preview y Regenerar
    document.querySelectorAll('.btn-scene-preview').forEach(btn => {
        btn.addEventListener('click', function () {
            const numero = this.getAttribute('data-numero');
            const sceneCard = this.closest('.scene-card');
            const previewUrl = sceneCard?.getAttribute('data-preview-url');
            const titulo = sceneCard?.getAttribute('data-titulo');

            // Cerrar modal de preview si ya está abierto
            const existing = document.querySelector('.scene-preview-modal-overlay');
            if (existing) existing.remove();

            const html = `
                <div class="scene-preview-modal-overlay">
                    <div class="scene-preview-modal">
                        <div class="scene-preview-modal-header">
                            <h3>🎬 Preview - Escena ${numero}</h3>
                            <button type="button" class="scene-preview-modal-close">&times;</button>
                        </div>
                        <div class="scene-preview-modal-body">
                            <p class="scene-preview-modal-title">${escaparHTML(titulo)}</p>
                            ${previewUrl ? `
                                <video class="scene-preview-modal-video" controls preload="metadata" width="100%">
                                    <source src="${escaparHTML(previewUrl)}?t=${Date.now()}" type="video/mp4">
                                </video>
                            ` : '<p class="no-preview-text">No hay preview disponible</p>'}
                        </div>
                    </div>
                </div>`;

            document.body.insertAdjacentHTML('beforeend', html);

            const overlay = document.querySelector('.scene-preview-modal-overlay');
            const closeBtn = overlay.querySelector('.scene-preview-modal-close');

            closeBtn.addEventListener('click', function () {
                overlay.remove();
            });

            overlay.addEventListener('click', function (e) {
                if (e.target === overlay) {
                    overlay.remove();
                }
            });
        });
    });

    document.querySelectorAll('.btn-scene-regenerate').forEach(btn => {
        btn.addEventListener('click', async function () {
            const numero = this.getAttribute('data-numero');
            const sceneCard = this.closest('.scene-card');
            const produccionId = sceneCard?.getAttribute('data-produccion-id');
            const itemId = sceneCard?.getAttribute('data-item-id');
            const ediciones = Number(this.getAttribute('data-ediciones')) ?? 0;
            const maxEdits = 3;

            if (ediciones >= maxEdits) {
                mostrarErrorAlert(`Esta escena ya alcanzó el máximo de ${maxEdits} ediciones permitidas.`);
                return;
            }

            const previewUrl = sceneCard?.getAttribute('data-preview-url') || '';
            const titulo = sceneCard?.getAttribute('data-titulo') || '';

            const textarea = sceneCard?.querySelector('.scene-dialogue-textarea');
            const dialogo = textarea?.value?.trim() || '';

            const words = String(dialogo).split(/\s+/).filter(Boolean).length;
            if (words === 0) {
                mostrarErrorAlert('No hay diálogo para regenerar la escena.');
                return;
            } else if (words < 5 || words > 16) {
                mostrarErrorAlert(`La escena ${numero} tiene ${words} palabras. Mínimo 5, máximo 16 palabras.`);
                return;
            }

            this.disabled = true;
            this.innerHTML = '<span class="spinner"></span>Regenerando...';

            try {
                const response = await fetch(`${DOMAIN}/webhook/regenerate-scene`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        produccion_id: produccionId,
                        noticia_id: document.querySelector('.edit-modal')?.dataset?.noticiaId || '',
                        item_id: itemId,
                        numero: Number(numero),
                        dialogo: dialogo,
                        titulo: titulo,
                        previewUrl: previewUrl,
                        ediciones: ediciones,
                        formato: document.getElementById('formato')?.value?.trim() || 'historieta',
                        imagen_seleccionada: document.getElementById('imagen_seleccionada_url')?.value?.trim() || ''
                    })
                });

                const result = await response.json();

                // Verificar si el response es un array con ok: false
                if (Array.isArray(result) && result.length > 0 && result[0].ok === false) {
                    mostrarErrorAlert(result[0].message ?? 'Error al regenerar escena');
                    this.disabled = false;
                    this.innerHTML = '🔄 Regenerar Escena con IA';
                    return;
                } else if (!response.ok) {
                    let errorMessage = `Error ${response.status}: ${response.statusText}`;
                    try {
                        errorMessage = result.message ?? result.mensaje ?? errorMessage;
                    } catch {
                        // Si no es JSON, usar el mensaje de status
                    }
                    mostrarErrorAlert(`Error al regenerar escena: ${errorMessage}`);
                    this.disabled = false;
                    this.innerHTML = '🔄 Regenerar Escena con IA';
                    return;
                }

                // El POST inicial fue aceptado: el backend puso la escena en cola de
                // generación (ej: {"message":"Generación de escena en proceso"}).
                // Mostramos ese mensaje en un modal bloqueante (sin botón "Entendido")
                // y arrancamos el polling a /webhook/escena hasta que preview_url
                // deje de ser null.
                mostrarGenerandoEscenaModal(result.message ?? result.mensaje ?? 'Generación de escena en proceso');
                await pollEscenaRegenerada(itemId, this);

            } catch (error) {
                mostrarErrorAlert(`Error de conexión: ${error.message}`);
                this.disabled = false;
                this.innerHTML = '🔄 Regenerar Escena con IA';
            }
        });
    });

    // Botón Ver Video Principal
    const btnVerVideo = document.querySelector('.btn-ver-video');
    if (btnVerVideo) {
        btnVerVideo.addEventListener('click', function () {
            verVideoPrincipal();
        });
    }

    saveBtn.addEventListener('click', saveChanges);

    // Recolecta las escenas incluidas (checkbox marcado + diálogo no vacío).
    // Si excludeLocked es true (default), separa las escenas bloqueadas (3+ ediciones).
    // Si excludeLocked es false, incluye TODAS las escenas (para /webhook/video).
    function obtenerEscenasIncluidas(excludeLocked = true) {
        const sceneCards = document.querySelectorAll('.scene-card');
        const includedScenes = [];
        const excludedScenes = [];

        sceneCards.forEach(card => {
            const isLocked = card.classList.contains('locked');
            const checkbox = card.querySelector('.scene-checkbox');
            const numero = checkbox?.dataset.numero;
            const editionBadge = card.querySelector('.edition-badge');
            const editionText = editionBadge?.textContent || '';
            const ediciones = Number(editionText.match(/(\d+)/)?.[1] || 0);
            const titulo = card?.getAttribute('data-titulo') || '';
            const itemId = card?.getAttribute('data-item-id') || '';
            const produccionId = card?.getAttribute('data-produccion-id') || '';
            const previewUrl = card?.getAttribute('data-preview-url') || '';

            if (isLocked && excludeLocked) {
                const isChecked = checkbox?.checked ?? false;
                if (isChecked) {
                    excludedScenes.push({
                        numero: Number(numero),
                        titulo,
                        ediciones
                    });
                }
                return;
            }

            const textarea = card.querySelector('.scene-dialogue-textarea');
            const dialogo = textarea?.value || '';
            const incluido = checkbox?.checked ?? false;

            // Si excludeLocked es false, incluir escenas bloqueadas marcadas incluso sin diálogo
            if (isLocked && !excludeLocked && incluido) {
                includedScenes.push({
                    numero: Number(numero),
                    titulo,
                    dialogue: dialogo,
                    incluido,
                    item_id: itemId,
                    produccion_id: produccionId,
                    previewUrl,
                    ediciones
                });
                return;
            }

            if (incluido && dialogo.trim()) {
                includedScenes.push({
                    numero: Number(numero),
                    titulo,
                    dialogue: dialogo,
                    incluido,
                    item_id: itemId,
                    produccion_id: produccionId,
                    previewUrl,
                    ediciones
                });
            }
        });

        if (excludeLocked) {
            return { includedScenes, excludedScenes };
        }
        return includedScenes;
    }

    const btnGenerateVideo = document.getElementById('btnGenerateVideo');
    if (btnGenerateVideo) {
        btnGenerateVideo.addEventListener('click', function () {
            // /webhook/video NO aplica restricciones: envía TODAS las escenas incluidas
            const includedScenes = obtenerEscenasIncluidas(false);

            if (includedScenes.length === 0) {
                alert('No hay escenas incluidas con diálogo para generar el video.');
                return;
            }

            mostrarConfirmacionRegenerarModal(includedScenes);
        });
    }

    // Botón "Generar Video": envía el mismo payload que "Unir videos", pero al
    // endpoint /webhook/generation. n8n confirma que el proceso inició, y desde
    // ahí se hace polling a /webhook/estado hasta que estado === 'generado'
    // (mismo patrón que pollEscenaRegenerada: modal bloqueante + polling con
    // guards para evitar ticks solapados).
    const btnGenerarVideoFinal = document.getElementById('btnGenerarVideoFinal');
    if (btnGenerarVideoFinal) {
        btnGenerarVideoFinal.addEventListener('click', function () {
            const { includedScenes, excludedScenes } = obtenerEscenasIncluidas();

            if (includedScenes.length === 0 && excludedScenes.length > 0) {
                const sceneNames = excludedScenes.map(s => `Escena ${s.numero} - "${escaparHTML(s.titulo)}"`).join(', ');
                alert(`Las escenas seleccionadas no pueden generarse porque han alcanzado el límite de 3 ediciones:\n\n${sceneNames}`);
                return;
            }

            if (includedScenes.length === 0) {
                alert('No hay escenas incluidas con diálogo para generar el video.');
                return;
            }

            if (excludedScenes.length > 0) {
                mostrarAdvertenciaEscenasBloqueadasModal(excludedScenes, includedScenes);
            } else {
                mostrarConfirmacionGenerarVideoFinalModal(includedScenes);
            }
        });
    }

    function mostrarConfirmacionRegenerarModal(includedScenes) {
        const existing = document.querySelector('.confirm-regenerate-overlay');
        if (existing) existing.remove();

        const html = `
            <div class="confirm-regenerate-overlay">
                <div class="confirm-regenerate-modal">
                    <div class="confirm-regenerate-icon">⚠️</div>
                    <h3>Confirmar Unir Videos</h3>
                    <p>Se unirán los videos sólo con las escenas incluidas. ¿Deseas continuar?</p>
                    <div class="confirm-regenerate-actions">
                        <button class="btn-confirm-regenerate-yes">Sí, unir videos</button>
                        <button class="btn-confirm-regenerate-no">No, cancelar</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);

        const overlay = document.querySelector('.confirm-regenerate-overlay');
        const yesBtn = overlay.querySelector('.btn-confirm-regenerate-yes');
        const noBtn = overlay.querySelector('.btn-confirm-regenerate-no');

        function cerrarModal() {
            overlay.remove();
        }

        noBtn.addEventListener('click', function () {
            cerrarModal();
        });

        yesBtn.addEventListener('click', async function () {
            cerrarModal();
            await generarVideo(includedScenes);
        });

        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) cerrarModal();
        });

        document.addEventListener('keydown', function handler(e) {
            if (e.key === 'Escape') {
                cerrarModal();
                document.removeEventListener('keydown', handler);
            }
        });
    }

    // Modal de advertencia cuando hay escenas bloqueadas (3 ediciones alcanzadas).
    // Solo se enviarán al backend las escenas que aún puedan editarse.
    function mostrarAdvertenciaEscenasBloqueadasModal(excludedScenes, includedScenes) {
        const existing = document.querySelector('.advertencia-escenas-bloqueadas-overlay');
        if (existing) existing.remove();

        const excludedListHTML = excludedScenes.map(scene =>
            `<li>Escena ${scene.numero} - "${escaparHTML(scene.titulo)}" (${scene.ediciones}/3 ediciones)</li>`
        ).join('');

        const html = `
            <div class="advertencia-escenas-bloqueadas-overlay">
                <div class="advertencia-escenas-bloqueadas-modal">
                    <div class="advertencia-escenas-bloqueadas-icon">⚠️</div>
                    <h3>Escenas Bloqueadas Detectadas</h3>
                    <p class="advertencia-text">Las siguientes escenas han alcanzado el límite de 3 ediciones y <strong>NO se enviarán</strong> al backend:</p>
                    <ul class="excluded-scenes-list">${excludedListHTML}</ul>
                    <p class="advertencia-info">Solo se enviarán <strong>${includedScenes.length} escenas</strong> que aún puedan editarse. ¿Deseas continuar?</p>
                    <div class="advertencia-escenas-actions">
                        <button class="btn-advertencia-yes">Sí, continuar</button>
                        <button class="btn-advertencia-no">No, cancelar</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);

        const overlay = document.querySelector('.advertencia-escenas-bloqueadas-overlay');
        const yesBtn = overlay.querySelector('.btn-advertencia-yes');
        const noBtn = overlay.querySelector('.btn-advertencia-no');

        function cerrarModal() {
            overlay.remove();
        }

        noBtn.addEventListener('click', function () {
            cerrarModal();
        });

        yesBtn.addEventListener('click', async function () {
            cerrarModal();
            mostrarConfirmacionGenerarVideoFinalModal(includedScenes);
        });

        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) cerrarModal();
        });

        document.addEventListener('keydown', function handler(e) {
            if (e.key === 'Escape') {
                cerrarModal();
                document.removeEventListener('keydown', handler);
            }
        });
    }

    // Modal de confirmación para "Generar Video" (endpoint /webhook/generation).
    // Mismo patrón visual que el de "Unir videos", con textos propios.
    function mostrarConfirmacionGenerarVideoFinalModal(includedScenes) {
        const existing = document.querySelector('.confirm-generar-video-final-overlay');
        if (existing) existing.remove();

        const html = `
            <div class="confirm-generar-video-final-overlay">
                <div class="confirm-generar-video-final-modal">
                    <div class="confirm-generar-video-final-icon">⚠️</div>
                    <h3>Confirmar Generación de Video</h3>
                    <p>Se generará el video final con las escenas que han sido incluidas y aún puedan editarse pasando nuevamente por Veo 3.1. ¿Deseas continuar?</p>
                    <div class="confirm-generar-video-final-actions">
                        <button class="btn-confirm-generar-video-final-yes">Sí, generar video</button>
                        <button class="btn-confirm-generar-video-final-no">No, cancelar</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);

        const overlay = document.querySelector('.confirm-generar-video-final-overlay');
        const yesBtn = overlay.querySelector('.btn-confirm-generar-video-final-yes');
        const noBtn = overlay.querySelector('.btn-confirm-generar-video-final-no');

        function cerrarModal() {
            overlay.remove();
        }

        noBtn.addEventListener('click', function () {
            cerrarModal();
        });

        yesBtn.addEventListener('click', async function () {
            cerrarModal();
            await generarVideoFinal(includedScenes);
        });

        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) cerrarModal();
        });

        document.addEventListener('keydown', function handler(e) {
            if (e.key === 'Escape') {
                cerrarModal();
                document.removeEventListener('keydown', handler);
            }
        });
    }

    async function generarVideo(includedScenes) {
        const btnGenerateVideo = document.getElementById('btnGenerateVideo');

        const payload = {
            produccion_id: document.querySelector('.edit-modal')?.dataset?.produccionId || '',
            noticia_id: document.querySelector('.edit-modal')?.dataset?.noticiaId || '',
            email_editor: document.getElementById('email')?.value?.trim() || '',
            titulo_video: document.getElementById('titulo_video')?.value?.trim() || '',
            descripcion_video: document.getElementById('descripcion_video')?.value?.trim() || '',
            editor_responsable: document.getElementById('editor_responsable')?.value?.trim() || '',
            formato: document.getElementById('formato')?.value?.trim() || 'historieta',
            main_scene: document.getElementById('main_scene')?.value?.trim() || '',
            imagen_seleccionada: document.getElementById('imagen_seleccionada_url')?.value?.trim() || '',
            escenas: includedScenes,
            submittedAt: new Date().toISOString(),
            formMode: 'generate'
        };

        btnGenerateVideo.disabled = true;
        btnGenerateVideo.innerHTML = '<span class="spinner"></span>Generando...';

        try {
            const response = await fetch(`${DOMAIN}/webhook/video`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                let errorMessage = `Error ${response.status}: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message ?? errorData.mensaje ?? errorMessage;
                } catch {
                    // Si no es JSON, usar el mensaje de status
                }
                mostrarErrorAlert(`Error al generar video: ${errorMessage}`);
            } else {
                const result = await response.json();
                // Actualizar la URL del botón con el nuevo video
                const btnVerVideo = document.querySelector('.btn-ver-video');
                if (btnVerVideo && result.video_url) {
                    btnVerVideo.setAttribute('data-video-url', result.video_url);
                }
                mostrarVideoSuccessModal(result.message ?? result.mensaje ?? 'Video generado con éxito');
            }
        } catch (error) {
            mostrarErrorAlert(`Error de conexión: ${error.message}`);
        } finally {
            btnGenerateVideo.disabled = false;
            btnGenerateVideo.innerHTML = 'Unir videos';
        }
    }

    // "Generar Video": mismo payload que generarVideo(), pero apunta a
    // /webhook/generation. n8n confirma que el proceso inició (no que terminó),
    // así que en vez de mostrar éxito de inmediato, se muestra un modal
    // bloqueante con ese mensaje y se hace polling a /webhook/estado hasta
    // que estado === 'generado' (mismo patrón que la regeneración de escenas).
    async function generarVideoFinal(includedScenes) {
        const btnGenerarVideoFinalEl = document.getElementById('btnGenerarVideoFinal');

        const payload = {
            produccion_id: document.querySelector('.edit-modal')?.dataset?.produccionId || '',
            noticia_id: document.querySelector('.edit-modal')?.dataset?.noticiaId || '',
            email_editor: document.getElementById('email')?.value?.trim() || '',
            titulo_video: document.getElementById('titulo_video')?.value?.trim() || '',
            descripcion_video: document.getElementById('descripcion_video')?.value?.trim() || '',
            editor_responsable: document.getElementById('editor_responsable')?.value?.trim() || '',
            formato: document.getElementById('formato')?.value?.trim() || 'historieta',
            main_scene: document.getElementById('main_scene')?.value?.trim() || '',
            imagen_seleccionada: document.getElementById('imagen_seleccionada_url')?.value?.trim() || '',
            escenas: includedScenes,
            submittedAt: new Date().toISOString(),
            formMode: 'generate',
        };

        btnGenerarVideoFinalEl.disabled = true;
        btnGenerarVideoFinalEl.innerHTML = '<span class="spinner"></span>Generando...';

        try {
            const response = await fetch(`${DOMAIN}/webhook/generation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                let errorMessage = `Error ${response.status}: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message ?? errorData.mensaje ?? errorMessage;
                } catch {
                    // Si no es JSON, usar el mensaje de status
                }
                mostrarErrorAlert(`Error al generar video: ${errorMessage}`);
                btnGenerarVideoFinalEl.disabled = false;
                btnGenerarVideoFinalEl.innerHTML = 'Generar Video';
                return;
            }

            const result = await response.json();

            // El POST fue aceptado: n8n confirma que el proceso de generación
            // inició (no que terminó). Mostrar modal bloqueante con ese mensaje
            // y arrancar el polling a /webhook/estado.
            mostrarGenerandoVideoFinalModal(result.message ?? result.mensaje ?? 'Generación de video en proceso');

            const noticiaIdActual = document.querySelector('.edit-modal')?.dataset?.noticiaId || '';
            await pollVideoGenerado(noticiaIdActual, btnGenerarVideoFinalEl);

        } catch (error) {
            mostrarErrorAlert(`Error de conexión: ${error.message}`);
            btnGenerarVideoFinalEl.disabled = false;
            btnGenerarVideoFinalEl.innerHTML = 'Generar Video';
        }
    }
    
    document.querySelectorAll('input[type="text"], textarea, select').forEach(el => {
        el.addEventListener('input', function () {
            hasUnsavedChanges = true;
        });
    });

    document.querySelectorAll('.scene-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            hasUnsavedChanges = true;
            const checkedCount = document.querySelectorAll('.scene-checkbox:checked').length;
            const totalScenes = document.querySelectorAll('.scene-card').length;
            document.getElementById('summary_included').textContent = `${checkedCount} de ${totalScenes} escenas incluidas`;
        });
    });

    document.querySelectorAll('textarea').forEach(textarea => {
        textarea.addEventListener('input', function () {
            hasUnsavedChanges = true;
            const numero = this.dataset.numero;
            const counter = document.querySelector(`.word-counter[data-numero="${numero}"]`);
            if (counter) {
                const words = String(this.value).split(/\s+/).filter(Boolean).length;
                const max = 16; // This should ideally be dynamic from reglasDialogo
                counter.textContent = `${words} / ${max} palabras`;
                counter.classList.remove('warning', 'error');
                if (words > max) {
                    counter.classList.add('error');
                } else if (words >= 13) {
                    counter.classList.add('warning');
                }
            }
        });
    });
}

// Hace polling GET a /webhook/escena?item_id=... hasta que preview_url deje de
// ser null. Si preview_url trae el mensaje de error del unidor de videos,
// muestra un modal de error con ese mensaje. Si no, muestra el modal de éxito
// (que a su vez dispara la actualización vía get-edit al cerrarse).
// Devuelve una Promise que resuelve cuando termina el polling, para que el
// botón que lo disparó pueda re-habilitarse en el momento correcto.
function pollEscenaRegenerada(itemId, btn) {
    // Cualquiera de estos textos dentro de preview_url indica que el video
    // NO se generó correctamente (agregar más frases aquí si aparecen nuevos casos)
    const ERROR_MARCADORES = [
        'Problemas con el unidor de videos',
        'Problemas con Veo 3.1',
        'Error en la generación del video debido al servicio que fusiona escenas'
    ];

    // checking: evita que se solapen dos fetch si uno tarda más de 5s (el tick
    // del setInterval no espera a que termine el anterior).
    // resuelto: evita procesar el resultado más de una vez si, aun con el guard
    // anterior, dos ticks llegan a detectar éxito casi al mismo tiempo.
    // Sin estas dos banderas, una respuesta lenta podía disparar el modal de
    // "Escena Regenerada" dos veces.
    let checking = false;
    let resuelto = false;

    return new Promise((resolve) => {
        const intervalId = setInterval(async () => {
            if (checking || resuelto) return;
            checking = true;

            try {
                const response = await fetch(`https://events.elcomercio.pe/webhook/escena?item_id=${encodeURIComponent(itemId)}`);
                if (!response.ok) {
                    console.warn('⚠️ /webhook/escena respondió con error, se reintenta en el próximo tick');
                    return;
                }

                const rawData = await response.json();
                const data = Array.isArray(rawData) ? (rawData.length > 0 ? rawData[0] : null) : rawData;

                if (!data || data.preview_url === null || data.preview_url === undefined) {
                    // Todavía no está lista, seguimos esperando
                    return;
                }

                if (resuelto) return; // por si otro tick ya procesó el resultado
                resuelto = true;
                clearInterval(intervalId);

                // Cerrar el modal bloqueante "Generación de Escena en Proceso"
                document.querySelector('.generando-escena-overlay')?.remove();

                if (typeof data.preview_url === 'string' && ERROR_MARCADORES.some(marcador => data.preview_url.includes(marcador))) {
                    // El video no se generó: mostrar el detalle tal cual viene en preview_url
                    mostrarErrorAlert(data.preview_url);
                } else {
                    // Actualizar data-preview-url DE INMEDIATO con el valor recién confirmado
                    // por /webhook/escena — mismo patrón que "Ver Video Principal", que actualiza
                    // su atributo apenas llega la respuesta, sin depender de un fetch posterior
                    // (el get-edit que dispara el modal de éxito al cerrarse queda solo como
                    // refresco secundario para ediciones/bloqueo, no como única fuente de la URL).
                    const sceneCard = document.querySelector(`.scene-card[data-item-id="${CSS.escape(String(itemId))}"]`);
                    if (sceneCard) {
                        sceneCard.setAttribute('data-preview-url', data.preview_url);
                    }

                    // Escena regenerada con éxito: el modal de éxito llama a get-edit al cerrarse
                    mostrarRegenerarSuccessModal('Escena regenerada con éxito');
                }

                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '🔄 Regenerar Escena con IA';
                }
                resolve();
            } catch (error) {
                console.warn('⚠️ Error en polling de /webhook/escena:', error.message);
                // seguimos intentando en el siguiente tick
            } finally {
                checking = false;
            }
        }, 5000);
    });
}

// Hace polling GET a /webhook/estado?jobId=... (usando noticia_id como
// identificador, igual que el resto del flujo) hasta detectar estado ===
// 'generado'. Mismo patrón anti-solape (checking/resuelto) que
// pollEscenaRegenerada, para evitar mostrar el modal de éxito dos veces si
// una respuesta tarda más de 5s. Si el backend reporta un estado de error,
// se corta el polling y se muestra el mensaje de error correspondiente.
function pollVideoGenerado(jobId, btn) {
    let checking = false;
    let resuelto = false;

    return new Promise((resolve) => {
        const intervalId = setInterval(async () => {
            if (checking || resuelto) return;
            checking = true;

            try {
                const response = await fetch(`${DOMAIN}/webhook/estado?jobId=${encodeURIComponent(jobId)}`);
                if (!response.ok) {
                    console.warn('⚠️ /webhook/estado respondió con error, se reintenta en el próximo tick');
                    return;
                }

                const rawData = await response.json();
                const statusData = Array.isArray(rawData) ? (rawData.length > 0 ? rawData[0] : null) : rawData;

                if (!statusData) {
                    // Todavía no hay datos, seguimos esperando
                    return;
                }

                // Si error_message viene con contenido, cortamos el polling de inmediato
                // sin importar qué diga "estado" (puede no ser 'error'/'failed' todavía).
                if (statusData.error_message !== null && statusData.error_message !== undefined && statusData.error_message !== '') {
                    if (resuelto) return;
                    resuelto = true;
                    clearInterval(intervalId);

                    document.querySelector('.generando-video-final-overlay')?.remove();
                    mostrarErrorAlert(statusData.error_message);

                    if (btn) {
                        btn.disabled = false;
                        btn.innerHTML = 'Generar Video';
                    }
                    resolve();
                    return;
                }

                if (statusData.estado === 'generado') {
                    if (resuelto) return;
                    resuelto = true;
                    clearInterval(intervalId);

                    document.querySelector('.generando-video-final-overlay')?.remove();

                    const btnVerVideo = document.querySelector('.btn-ver-video');
                    if (btnVerVideo && statusData.video_url) {
                        btnVerVideo.setAttribute('data-video-url', statusData.video_url);
                    }

                    await mostrarVideoSuccessModal(statusData.message ?? statusData.mensaje ?? 'Video generado con éxito');

                    if (btn) {
                        btn.disabled = false;
                        btn.innerHTML = 'Generar Video';
                    }
                    resolve();
                } else if (statusData.estado === 'error' || statusData.estado === 'failed') {
                    if (resuelto) return;
                    resuelto = true;
                    clearInterval(intervalId);

                    document.querySelector('.generando-video-final-overlay')?.remove();
                    mostrarErrorAlert(statusData.message ?? statusData.mensaje ?? 'Ocurrió un error al generar el video.');

                    if (btn) {
                        btn.disabled = false;
                        btn.innerHTML = 'Generar Video';
                    }
                    resolve();
                }
                // Cualquier otro estado: seguimos esperando al próximo tick
            } catch (error) {
                console.warn('⚠️ Error en polling de /webhook/estado (video final):', error.message);
                // seguimos intentando en el siguiente tick
            } finally {
                checking = false;
            }
        }, 5000);
    });
}


async function mostrarVideoSuccessModal(message) {
    const existing = document.querySelector('.video-success-overlay');
    if (existing) existing.remove();
    
    const html = `
        <div class="video-success-overlay">
            <div class="video-success-modal">
                <div class="video-success-icon">✅</div>
                <h3>Video Generado</h3>
                <p>${escaparHTML(message)}</p>
                <button class="btn-video-success-close">Cerrar</button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
    
    const overlay = document.querySelector('.video-success-overlay');
    const closeBtn = overlay.querySelector('.btn-video-success-close');
    
    async function cerrarModal() {
        overlay.remove();

        // Mismo patrón que mostrarRegenerarSuccessModal: refrescar las escenas
        // sin recargar todo el editor, usando el produccion_id del modal actual.
        const produccionId = document.querySelector('.edit-modal')?.dataset?.produccionId;
        if (produccionId) {
            try {
                const response = await fetch(`${DOMAIN}/webhook/get-edit?production_id=${encodeURIComponent(produccionId)}`);
                if (response.ok) {
                    const scenesData = await response.json();
                    if (Array.isArray(scenesData) && scenesData.length > 0) {
                        actualizarEscenasUI(scenesData);
                    }
                }
            } catch (fetchError) {
                console.warn('Error al llamar get-edit:', fetchError.message);
            }
        }
    }
    
    closeBtn.addEventListener('click', cerrarModal);
    
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) cerrarModal();
    });
    
    document.addEventListener('keydown', function handler(e) {
        if (e.key === 'Escape') {
            cerrarModal();
            document.removeEventListener('keydown', handler);
        }
    });
}

function closeEditModal() {
    const overlay = document.querySelector('.edit-modal-overlay');
    if (overlay) {
        overlay.remove();
        hasUnsavedChanges = false;
        localStorage.removeItem('editModalData');
        clearMessage();
    }
}

function showAbandonModalDesdeX() {
    const existing = document.querySelector('.abandon-modal-overlay');
    if (existing) existing.remove();
    
    const html = `
        <div class="abandon-modal-overlay">
            <div class="abandon-modal">
                <div class="abandon-modal-icon">⚠️</div>
                <h3>¿Deseas abandonar el modo de edición?</h3>
                <p>Los cambios no guardados se perderán.</p>
                <div class="abandon-modal-actions">
                    <button class="btn-abandon-yes">Sí, abandonar</button>
                    <button class="btn-abandon-no">No, quedarme</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
    
    const overlay = document.querySelector('.abandon-modal-overlay');
    const yesBtn = overlay.querySelector('.btn-abandon-yes');
    const noBtn = overlay.querySelector('.btn-abandon-no');
    
    yesBtn.addEventListener('click', function () {
        overlay.remove();
        closeEditModal();
    });
    
    noBtn.addEventListener('click', function () {
        overlay.remove();
    });
    
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

// Actualiza en el DOM la escena que acaba de regenerarse, con los datos frescos
// que devuelve /webhook/get-edit — sin necesidad de recargar todo el modal.
// Acepta tanto un array de escenas "planas" como el shape anidado
// [{ escenas: [...] }] (mismo formato que devuelve /webhook/edit).
function actualizarEscenasUI(scenesData) {
    let escenas = null;

    if (Array.isArray(scenesData) && scenesData.length > 0) {
        const primero = scenesData[0];
        if (Array.isArray(primero?.escenas)) {
            escenas = primero.escenas;
        } else if (primero && (primero.item_id !== undefined || primero.numero !== undefined)) {
            escenas = scenesData;
        }
    }

    if (!Array.isArray(escenas)) {
        console.warn('⚠️ actualizarEscenasUI: formato de datos no reconocido, no se actualizó la UI');
        return;
    }

    escenas.forEach(esc => {
        const itemId = esc.item_id;
        const numero = esc.numero;
        const previewUrl = esc.preview_url ?? esc.previewUrl ?? '';
        const ediciones = esc.ediciones ?? 0;

        // Ubicar la scene-card correspondiente por item_id (o por id compuesto de respaldo)
        let sceneCard = null;
        if (itemId !== undefined && itemId !== null && itemId !== '') {
            sceneCard = document.querySelector(`.scene-card[data-item-id="${CSS.escape(String(itemId))}"]`);
        }
        if (!sceneCard) {
            sceneCard = document.getElementById(`scene-${itemId || numero}`);
        }
        if (!sceneCard) return;

        // 1. Actualizar la URL que usa "Ver Preview" para que muestre el video recién generado
        sceneCard.setAttribute('data-preview-url', previewUrl || '');

        // 2. Actualizar el contador de ediciones (badge y botón de regenerar)
        const badge = sceneCard.querySelector('.edition-badge');
        if (badge) badge.textContent = `Ediciones: ${ediciones} / 3`;

        const btnRegenerate = sceneCard.querySelector('.btn-scene-regenerate');
        const maxEdits = 3;
        const dialogueTexto = esc.dialogue ?? esc.dialogo ?? '';

        if (Number(ediciones) >= maxEdits) {
            // Marcar la tarjeta como locked (mismo estado que el render inicial)
            sceneCard.classList.add('locked');

            // Quitar el botón de regenerar en vez de solo deshabilitarlo
            if (btnRegenerate) {
                btnRegenerate.remove();
            }

            // Si la escena todavía tiene el textarea editable, reemplazarlo por el
            // bloque bloqueado (mismo HTML que buildEditForm usa cuando puedeEditar es false)
            const dialogueField = sceneCard.querySelector('.scene-dialogue-field');
            if (dialogueField) {
                dialogueField.outerHTML = `
                    <div class="locked-dialogue-box">
                        <p class="locked-dialogue-text">${escaparHTML(dialogueTexto)}</p>
                        <div class="locked-warning">
                            🔒 Límite de ediciones alcanzado
                        </div>
                    </div>`;
            } else {
                // Ya estaba bloqueada: solo refrescar el texto por si cambió
                const lockedText = sceneCard.querySelector('.locked-dialogue-text');
                if (lockedText) lockedText.textContent = dialogueTexto;
            }
}
         else {
            if (btnRegenerate) {
                btnRegenerate.setAttribute('data-ediciones', ediciones);
                btnRegenerate.disabled = false;
            }

            // Sigue editable: refrescar el valor del textarea y su contador de palabras
            // por si el backend devolvió el diálogo con algún ajuste (trim, etc.)
            const textarea = sceneCard.querySelector('.scene-dialogue-textarea');
            if (textarea) {
                textarea.value = dialogueTexto;
                const numeroCounter = textarea.dataset.numero;
                const counter = sceneCard.querySelector(`.word-counter[data-numero="${numeroCounter}"]`);
                if (counter) {
                    const words = String(dialogueTexto).split(/\s+/).filter(Boolean).length;
                    const max = 16;
                    counter.textContent = `${words} / ${max} palabras`;
                    counter.classList.remove('warning', 'error');
                    if (words > max) counter.classList.add('error');
                    else if (words >= 13) counter.classList.add('warning');
                }
            }
        }
    });
}

async function mostrarRegenerarSuccessModal(message) {
    const existing = document.querySelector('.regenerar-scene-success-overlay');
    if (existing) existing.remove();
    
    const html = `
        <div class="regenerar-scene-success-overlay">
            <div class="regenerar-scene-success-modal">
                <div class="regenerar-scene-success-icon">✅</div>
                <h3>Escena Regenerada</h3>
                <p>${escaparHTML(message)}</p>
                <button class="btn-regenerar-success-close">Cerrar</button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
    
    const overlay = document.querySelector('.regenerar-scene-success-overlay');
    const closeBtn = overlay.querySelector('.btn-regenerar-success-close');
    
    async function cerrarModal() {
        overlay.remove();
        
        const produccionId = document.querySelector('.edit-modal')?.dataset?.produccionId;
        if (produccionId) {
            try {
                const response = await fetch(`${DOMAIN}/webhook/get-edit?production_id=${encodeURIComponent(produccionId)}`);
                if (response.ok) {
                    const scenesData = await response.json();
                    if (Array.isArray(scenesData) && scenesData.length > 0) {
                        actualizarEscenasUI(scenesData);
                    }
                }
            } catch (fetchError) {
                console.warn('Error al llamar get-edit:', fetchError.message);
            }
        }
    }
    
    closeBtn.addEventListener('click', cerrarModal);
    
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) cerrarModal();
    });
    
    document.addEventListener('keydown', function handler(e) {
        if (e.key === 'Escape') {
            cerrarModal();
            document.removeEventListener('keydown', handler);
        }
    });
}

function openPreviewModal(videoUrl) {
    const existing = document.querySelector('.preview-modal-overlay');
    if (existing) existing.remove();
    
    const html = `
        <div class="preview-modal-overlay">
            <div class="preview-modal">
                <div class="preview-modal-header">
                    <h2>🎬 Preview de la escena</h2>
                    <button class="preview-modal-close">&times;</button>
                </div>
                <div class="preview-modal-body">
                    <video class="preview-video" controls preload="metadata" autoplay>
                        <source src="${videoUrl}" type="video/mp4">
                    </video>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
    
    const overlay = document.querySelector('.preview-modal-overlay');
    const closeBtn = overlay.querySelector('.preview-modal-close');
    
    closeBtn.addEventListener('click', closePreviewModal);
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closePreviewModal();
    });
}

function closePreviewModal() {
    const overlay = document.querySelector('.preview-modal-overlay');
    if (overlay) {
        overlay.remove();
    }
}

function refreshPreview(btn) {
    btn.textContent = '↻ Actualizando...';
    btn.disabled = true;
    setTimeout(() => {
        btn.textContent = '↻ Actualizar preview';
        btn.disabled = false;
    }, 2000);
}