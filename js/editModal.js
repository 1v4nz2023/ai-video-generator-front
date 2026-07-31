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
                    <p id="summary_included" class="summary-text"></p>
                    <div class="footer-actions">
                        <button class="btn-cancel" onclick="closeEditModal()">Cancelar</button>
                        <button class="btn-save" id="btnSave">Guardar cambios</button>
                        <button class="btn-generate-video" id="btnGenerateVideo">Regenerar video</button>
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
                } else if (!response.ok) {
                    let errorMessage = `Error ${response.status}: ${response.statusText}`;
                    try {
                        errorMessage = result.message ?? result.mensaje ?? errorMessage;
                    } catch {
                        // Si no es JSON, usar el mensaje de status
                    }
                    mostrarErrorAlert(`Error al regenerar escena: ${errorMessage}`);
                } else {
                    mostrarRegenerarSuccessModal(result.message ?? result.mensaje ?? 'Escena regenerada con éxito');
                }
            } catch (error) {
                mostrarErrorAlert(`Error de conexión: ${error.message}`);
            } finally {
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

    const btnGenerateVideo = document.getElementById('btnGenerateVideo');
    if (btnGenerateVideo) {
        btnGenerateVideo.addEventListener('click', async function () {
            const sceneCards = document.querySelectorAll('.scene-card');
            const includedScenes = [];

            sceneCards.forEach(card => {
                const checkbox = card.querySelector('.scene-checkbox');
                const numero = checkbox?.dataset.numero;
                const textarea = card.querySelector('.scene-dialogue-textarea');
                const lockedDialogueText = card.querySelector('.locked-dialogue-text');
                const dialogo = textarea?.value ?? (lockedDialogueText?.textContent ?? '');
                const incluido = checkbox?.checked ?? false;
                const titulo = card?.getAttribute('data-titulo') || '';
                const itemId = card?.getAttribute('data-item-id') || '';
                const produccionId = card?.getAttribute('data-produccion-id') || '';
                const previewUrl = card?.getAttribute('data-preview-url') || '';

                if (incluido && dialogo.trim()) {
                    includedScenes.push({
                        numero: Number(numero),
                        titulo,
                        dialogue: dialogo,
                        incluido,
                        item_id: itemId,
                        produccion_id: produccionId,
                        previewUrl
                    });
                }
            });

            if (includedScenes.length === 0) {
                alert('No hay escenas incluidas con diálogo para generar el video.');
                return;
            }

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
                btnGenerateVideo.innerHTML = 'Regenerar video';
            }
        });
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

function mostrarVideoSuccessModal(message) {
    const existing = document.querySelector('.video-success-overlay');
    if (existing) existing.remove();
    
    const html = `
        <div class="video-success-overlay">
            <div class="video-success-modal">
                <div class="video-success-icon">✅</div>
                <h3>Video Regenerado</h3>
                <p>${escaparHTML(message)}</p>
                <button class="btn-video-success-close">Cerrar</button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
    
    const overlay = document.querySelector('.video-success-overlay');
    const closeBtn = overlay.querySelector('.btn-video-success-close');
    
    function cerrarModal() {
        overlay.remove();
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