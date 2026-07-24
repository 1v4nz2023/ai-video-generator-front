function escaparHTML(texto) {
    if (texto === null || texto === undefined) return "";
    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
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
                <video class="main-video" controls preload="metadata" width="100%">
                    <source src="${escaparHTML(video_url)}" type="video/mp4">
                </video>
            </div>`;
    }

    // --- 3. Selector de imagen ---
    if (imagenes && imagenes.length > 0 && es_video) {
        formHTML += `
            <div class="image-selector-card">
                <h3>🖼️ Seleccionar Imagen de la Nota</h3>
                <div class="image-grid">
                    ${imagenes.map((img, index) => `
                        <div onclick="selectThumbnail(${index})" id="thumb-${index}" class="image-thumb">
                            <img src="${escaparHTML(img.url)}">
                        </div>
                    `).join("")}
                </div>
                <input type="hidden" id="imagen_seleccionada" value="Imagen 1">
            </div>`;
    }

    // --- 4. Campos generales editables ---
    formHTML += `
        <div class="config-section">
            <h3>⚙️ Configuración de Producción</h3>
            <div class="config-grid">
                <div class="config-field">
                    <label>📝 Título del video</label>
                    <input type="text" id="titulo_video" value="${escaparHTML(noticia?.titulo ?? '')}">
                </div>
                <div class="config-field">
                    <label>📋 Descripción del video</label>
                    <textarea id="descripcion_video" placeholder="${escaparHTML(noticia?.subtitulo ?? '')}" rows="2"></textarea>
                </div>
                <div class="config-field">
                    <label>👤 Editor responsable</label>
                    <input type="text" id="editor_responsable" value="${escaparHTML(editor_responsable ?? '')}">
                </div>
                <div class="config-field">
                    <label>🧠 Prompt maestro (Inglés)</label>
                    <textarea id="main_scene" placeholder="${escaparHTML(main_scene ?? '')}" rows="2"></textarea>
                </div>
            </div>
        </div>`;

    // --- 5. Lista de escenas/viñetas ---
    if (escenas && Array.isArray(escenas)) {
        formHTML += `<h2 class="scenes-title">✏️ Editar ${es_video ? "Escenas" : "Viñetas"}</h2>`;
        escenas.forEach((escena, idx) => {
            const { numero, titulo, dialogue, incluido, fieldName, reglasDialogo, previewUrl } = escena;
            const puedeEditar = (Number(escena.ediciones ?? 0) < 3);
            const maxPalabras = reglasDialogo?.maxPalabras || 16;

            const lockedClass = !puedeEditar ? ' locked' : '';
            formHTML += `
                <div class="scene-card${lockedClass}">
                    <div class="scene-card-header">
                        <h3>${es_video ? '🎬' : '🖼️'} ${es_video ? 'Escena' : 'Viñeta'} ${numero}</h3>
                        <span class="edition-badge">Ediciones: ${escena.ediciones ?? 0} / 3</span>
                    </div>
                    
                    <p class="scene-title-text">${escaparHTML(titulo)}</p>

                    ${previewUrl ? `
                        <div class="scene-preview">
                            <p class="scene-preview-label">Preview de la escena:</p>
                            <video class="scene-preview-video" controls preload="metadata" width="100%">
                                <source src="${escaparHTML(previewUrl)}" type="video/mp4">
                            </video>
                        </div>
                    ` : ''}

                    ${fieldName?.incluido ? `
                        <div class="scene-include-checkbox">
                            <input type="checkbox" class="scene-checkbox" id="${fieldName.incluido}" ${incluido ? 'checked' : ''}>
                            <label for="${fieldName.incluido}">Incluir en el video</label>
                        </div>
                    ` : ''}

                    ${puedeEditar ? `
                        <div class="scene-dialogue-field">
                            <label>Diálogo (5–${maxPalabras} palabras)</label>
                            <textarea id="${fieldName.dialogo}" placeholder="${escaparHTML(titulo)}" rows="3" class="scene-dialogue-textarea"></textarea>
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
                </div>`;
        });
    }

    return `
        <div class="edit-modal-overlay">
            <div class="edit-modal modal-overlay-structure" data-produccion-id="${escaparHTML(produccion_id)}">
                <div class="edit-modal-header modal-header-structure">
                    <h2>✏️ Editar ${es_video ? 'Escenas' : 'Viñetas'}</h2>
                    <button id="btnCloseEditModal" type="button" class="modal-close-icon">&times;</button>
                </div>
                <div class="edit-modal-body modal-body-structure">
                    ${formHTML}
                </div>
                <div class="edit-modal-footer modal-footer-structure">
                    <p id="summary_included" class="summary-text"></p>
                    <div class="footer-actions">
                        <button class="btn-cancel" onclick="closeEditModal()">Cancelar</button>
                        <button class="btn-save" id="btnSave">Guardar cambios</button>
                    </div>
                </div>
            </div>
        </div>`;
}

// Helper for thumbnail selection
window.selectThumbnail = function(index) {
    document.querySelectorAll('[id^="thumb-"]').forEach(el => {
        el.style.borderColor = 'transparent';
    });
    const selected = document.getElementById(`thumb-${index}`);
    if (selected) {
        selected.style.borderColor = '#E30613'; // --color-primary
        document.getElementById('imagen_seleccionada').value = `Imagen ${index + 1}`;
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
    
    closeBtn.addEventListener('click', function () {
        if (hasUnsavedChanges) {
            showAbandonModalDesdeX();
        } else {
            closeEditModal();
        }
    });
    
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
            if (hasUnsavedChanges) {
                showAbandonModalDesdeX();
            } else {
                closeEditModal();
            }
        }
    });
    
    saveBtn.addEventListener('click', saveChanges);
    
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