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

    const styles = {
        primary: '#E30613',
        bg: '#F7F7F8',
        card: '#FFFFFF',
        locked: '#F1F1F1',
        warning: '#D97706',
        success: '#16A34A',
        radius: '12px',
        spacing: '16px'
    };

    let formHTML = '';

    // --- 1. Header noticia ---
    if (noticia && noticia.titulo) {
        formHTML += `
            <div style="background: ${styles.card}; padding: 24px; border-radius: ${styles.radius}; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #eee;">
                <h1 style="margin: 0 0 8px 0; font-size: 1.8rem; color: #1a1a2e; font-family: sans-serif; font-weight: bold;">${escaparHTML(noticia.titulo)}</h1>
                <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                    <p style="margin: 0; color: #666;">✍️ ${escaparHTML(noticia?.autor ?? 'Sin autor')}</p>
                    <span style="background: ${styles.primary}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: bold;">${escaparHTML((formato || "historieta").toUpperCase())}</span>
                    <a href="${escaparHTML(noticia?.url ?? '#')}" target="_blank" style="color: ${styles.primary}; text-decoration: none; font-size: 0.9rem;">🔗 Ver nota original</a>
                </div>
            </div>`;
    }

    // --- 2. Preview de video principal ---
    if (video_url) {
        formHTML += `
            <div style="margin-bottom: 24px; background: ${styles.card}; padding: 16px; border-radius: ${styles.radius}; border: 1px solid #eee;">
                <h3 style="margin-top: 0; font-size: 1rem; color: #444;">🎬 Preview de Video Principal</h3>
                <video controls preload="metadata" width="100%" style="max-width:600px; border-radius: 8px; background:#000; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
                    <source src="${escaparHTML(video_url)}" type="video/mp4">
                </video>
            </div>`;
    }

    // --- 3. Selector de imagen ---
    if (imagenes && imagenes.length > 0 && es_video) {
        formHTML += `
            <div style="margin-bottom: 24px; background: ${styles.card}; padding: 20px; border-radius: ${styles.radius}; border: 1px solid #eee;">
                <h3 style="margin-top: 0; font-size: 1rem; color: #444;">🖼️ Seleccionar Imagen de la Nota</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 16px; margin-bottom: 16px;">
                    ${imagenes.map((img, index) => `
                        <div onclick="selectThumbnail(${index})" id="thumb-${index}" style="cursor: pointer; border: 3px solid transparent; border-radius: 8px; overflow: hidden; transition: all 0.2s;">
                            <img src="${escaparHTML(img.url)}" style="width: 100%; height: 100px; object-fit: cover;">
                        </div>
                    `).join("")}
                </div>
                <input type="hidden" id="imagen_seleccionada" value="Imagen 1">
            </div>`;
    }

    // --- 4. Campos generales editables ---
    formHTML += `
        <div style="background: ${styles.bg}; padding: 24px; border-radius: ${styles.radius}; margin-bottom: 32px; border: 1px solid #eee;">
            <h3 style="margin-top: 0; font-size: 1.2rem; color: #1a1a2e;">⚙️ Configuración de Producción</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;">
                <div>
                    <label style="display:block; margin-bottom:8px; font-weight:bold;">📝 Título del video</label>
                    <input type="text" id="titulo_video" value="${escaparHTML(noticia?.titulo ?? '')}" style="width:100%; padding:12px; border-radius:${styles.radius}; border:1px solid #ccc;">
                </div>
                <div>
                    <label style="display:block; margin-bottom:8px; font-weight:bold;">📋 Descripción del video</label>
                    <textarea id="descripcion_video" placeholder="${escaparHTML(noticia?.subtitulo ?? '')}" rows="2" style="width:100%; padding:12px; border-radius:${styles.radius}; border:1px solid #ccc;"></textarea>
                </div>
                <div>
                    <label style="display:block; margin-bottom:8px; font-weight:bold;">👤 Editor responsable</label>
                    <input type="text" id="editor_responsable" value="${escaparHTML(editor_responsable ?? '')}" style="width:100%; padding:12px; border-radius:${styles.radius}; border:1px solid #ccc;">
                </div>
                <div>
                    <label style="display:block; margin-bottom:8px; font-weight:bold;">🧠 Prompt maestro (Inglés)</label>
                    <textarea id="main_scene" placeholder="${escaparHTML(main_scene ?? '')}" rows="2" style="width:100%; padding:12px; border-radius:${styles.radius}; border:1px solid #ccc;"></textarea>
                </div>
            </div>
        </div>`;

    // --- 5. Lista de escenas/viñetas ---
    if (escenas && Array.isArray(escenas)) {
        formHTML += `<h2 style="color: #1a1a2e; margin-bottom: 20px;">✏️ Editar ${es_video ? "Escenas" : "Viñetas"}</h2>`;
        escenas.forEach((escena, idx) => {
            const { numero, titulo, dialogue, incluido, fieldName, reglasDialogo, previewUrl } = escena;
            const puedeEditar = (Number(escena.ediciones ?? 0) < 3);
            const maxPalabras = reglasDialogo?.maxPalabras || 16;

            formHTML += `
                <div class="scene-card" style="background: ${styles.card}; padding: 24px; border-radius: ${styles.radius}; margin-bottom: 24px; border: 1px solid #eee; box-shadow: 0 2px 8px rgba(0,0,0,0.05); ${!puedeEditar ? 'background: ' + styles.locked + ';' : ''}">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h3 style="margin: 0; color: #1a1a2e;">${es_video ? '🎬' : '🖼️'} ${es_video ? 'Escena' : 'Viñeta'} ${numero}</h3>
                        <span style="font-size: 0.8rem; padding: 4px 8px; border-radius: 4px; background: #eee;">Ediciones: ${escena.ediciones ?? 0} / 3</span>
                    </div>
                    
                    <p style="margin-bottom: 16px; font-weight: bold; font-size: 1.1rem;">${escaparHTML(titulo)}</p>

                    ${previewUrl ? `
                        <div style="margin-bottom: 16px;">
                            <p style="font-size: 0.8rem; color: #666; margin-bottom: 4px;">Preview de la escena:</p>
                            <video controls preload="metadata" width="100%" style="max-width:400px; border-radius: 8px; background:#000;">
                                <source src="${escaparHTML(previewUrl)}" type="video/mp4">
                            </video>
                        </div>
                    ` : ''}

                    ${fieldName?.incluido ? `
                        <div style="margin-bottom: 16px;">
                            <input type="checkbox" class="scene-checkbox" id="${fieldName.incluido}" ${incluido ? 'checked' : ''} style="transform: scale(1.2); margin-right: 8px;">
                            <label for="${fieldName.incluido}" style="font-weight: bold;">Incluir en el video</label>
                        </div>
                    ` : ''}

                    ${puedeEditar ? `
                        <div>
                            <label style="display:block; margin-bottom:8px; font-size: 0.9rem;">Diálogo (5–${maxPalabras} palabras)</label>
                            <textarea id="${fieldName.dialogo}" placeholder="${escaparHTML(titulo)}" rows="3" style="width:100%; padding:12px; border-radius:${styles.radius}; border:1px solid #ccc; font-family: inherit;"></textarea>
                            <div class="word-counter" data-numero="${fieldName.dialogo?.split('_').pop() || ''}" style="font-size: 0.8rem; margin-top: 5px; text-align: right;">
                                ${dialogue ? (dialogue.split(/\s+/).filter(Boolean).length) : 0} / ${maxPalabras} palabras
                            </div>
                        </div>
                    ` : `
                        <div style="padding: 12px; border-radius: 8px; background: rgba(0,0,0,0.03); border: 1px dashed #ccc;">
                            <p style="margin: 0; color: #666;">${escaparHTML(dialogue)}</p>
                            <div style="color: ${styles.warning}; font-size: 0.8rem; margin-top: 8px; display: flex; align-items: center; gap: 4px;">
                                🔒 Límite de ediciones alcanzado
                            </div>
                        </div>
                    `}
                </div>`;
        });
    }

    return `
        <div class="edit-modal-overlay">
            <div class="edit-modal" data-produccion-id="${escaparHTML(produccion_id)}" style="max-width: 900px; width: 95%; margin: 40px auto;">
                <div class="edit-modal-header" style="border-bottom: 1px solid #eee; padding-bottom: 16px; margin-bottom: 24px;">
                    <h2 style="margin: 0; font-family: sans-serif; font-weight: bold;">✏️ Editar ${es_video ? 'Escenas' : 'Viñetas'}</h2>
                    <button id="btnCloseEditModal" type="button" style="background: none; border: none; font-size: 2rem; cursor: pointer;">&times;</button>
                </div>
                <div class="edit-modal-body" style="max-height: 70vh; overflow-y: auto; padding-right: 10px;">
                    ${formHTML}
                </div>
                <div class="edit-modal-footer" style="border-top: 1px solid #eee; padding-top: 24px; margin-top: 24px; display: flex; justify-content: space-between; align-items: center;">
                    <p id="summary_included" style="margin: 0; font-weight: bold; color: #666;"></p>
                    <div style="display: flex; gap: 12px;">
                        <button class="btn-cancel" onclick="closeEditModal()" style="padding: 12px 24px; border-radius:${styles.radius}; border: 1px solid #ccc; cursor: pointer;">Cancelar</button>
                        <button class="btn-save" id="btnSave" style="padding: 12px 24px; border-radius:${styles.radius}; background: ${styles.primary}; color: white; border: none; font-weight: bold; cursor: pointer;">Guardar cambios</button>
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
                <h3 style="color:#1a1a2e;font-size:1.2rem;margin-bottom:8px;">¿Deseas abandonar el modo de edición?</h3>
                <p style="color:#555;font-size:0.9rem;margin-bottom:24px;">Los cambios no guardados se perderán.</p>
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
                    <video controls preload="metadata" autoplay style="width:100%;max-height:70vh;background:#000;">
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