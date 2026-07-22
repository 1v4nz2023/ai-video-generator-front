function buildEditForm(data) {
    const {
        formato, es_video, etiqueta_contenido, emoji_contenido,
        produccion_id, noticia_id,
        noticia,
        total_dialogos,
        escenas
    } = data;

    const { titulo, descripcion, editor_responsable, main_scene, url, autor } = noticia;

    let scenesHTML = '';

    for (const escena of escenas) {
        const numero = escena.numero;
        const tituloEscena = escena.titulo ?? `Escena ${numero}`;
        const nombreSpeaker = escena.nombre_speaker ?? escena.speaker ?? "Sin personaje";
        const icono = escena.icono ?? "💬";
        const dialogo = escena.dialogo ?? "";
        const ediciones = escena.ediciones ?? 0;
        const maxEdiciones = escena.max_ediciones ?? 3;
        const puedeEditar = escena.puede_editar ?? true;
        const incluido = escena.incluido ?? true;
        const previewSrc = escena.preview_url?.trim() || "";

        scenesHTML += `
            <div class="scene-card" data-ediciones="${ediciones}" data-max-ediciones="${maxEdiciones}">
                <div class="scene-header">
                    <h3>${emoji_contenido} ${etiqueta_contenido} ${numero}</h3>
                    <p><strong>${escaparHTML(tituloEscena)}</strong></p>
                </div>

                <div class="scene-field">
                    <label>Incluir en el video</label>
                    <input type="checkbox" class="scene-checkbox" data-numero="${numero}" ${incluido ? 'checked' : ''}>
                </div>

                <div class="scene-field">
                    <p>
                        <strong>Ediciones:</strong>
                        <span class="ediciones-count" data-numero="${numero}">${ediciones}</span> / ${maxEdiciones}
                        <span class="limite-alcanzado" data-numero="${numero}" style="color:#b91c1c;${!puedeEditar ? '' : 'display:none;'}">⚠ Límite alcanzado</span>
                    </p>
                </div>

                <div class="scene-field">
                    <label>${icono} ${escaparHTML(nombreSpeaker)} (mínimo 5 y máximo 16 palabras)</label>
                    ${puedeEditar
                        ? `<textarea class="scene-dialogue" data-numero="${numero}" data-original="${escaparHTML(dialogo)}" placeholder="Diálogo de la escena..." rows="3">${escaparHTML(dialogo)}</textarea>
                        <div class="word-counter" data-numero="${numero}">${escaparHTML(dialogo) ? escaparHTML(String(dialogo).split(/\s+/).filter(Boolean).length) : 0} / 16 palabras</div>`
                        : `<p class="locked-dialogue">${escaparHTML(dialogo)}</p>`
                    }
                </div>

                ${previewSrc
                    ? `<div class="scene-preview-actions">
                        <button class="btn-preview" onclick="openPreviewModal('${escaparHTML(previewSrc).replace(/'/g, "\\'")}')">
                            ▶ Ver preview
                        </button>
                        <button class="btn-refresh-preview" onclick="refreshPreview(this)">
                            ↻ Actualizar preview
                        </button>
                      </div>`
                    : `<div class="scene-preview-actions">
                        <button class="btn-refresh-preview" onclick="refreshPreview(this)">
                            ↻ Actualizar preview
                        </button>
                      </div>`
                }
            </div>
        `;
    }

    return `
        <div class="edit-modal-overlay">
            <div class="edit-modal" data-produccion-id="${escaparHTML(produccion_id)}">
                <div class="edit-modal-header">
                    <h2>✏️ Editar ${es_video ? 'Escenas' : 'Viñetas'}</h2>
                    <button id="btnCloseEditModal" type="button">&times;</button>
                </div>

                <div class="edit-modal-body">
                    <div class="news-info">
                        <h3>📰 Información de la noticia</h3>
                        <div class="news-title">${escaparHTML(titulo)}</div>
                        <div class="news-desc">${escaparHTML(descripcion)}</div>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Autor</label>
                                <span>${escaparHTML(autor)}</span>
                            </div>
                            <div class="info-item">
                                <label>ID Noticia</label>
                                <span>${escaparHTML(noticia_id)}</span>
                            </div>
                            <div class="info-item">
                                <label>URL</label>
                                <a href="${escaparHTML(url)}" target="_blank">Abrir noticia original</a>
                            </div>
                            <div class="info-item">
                                <label>Total de ${etiqueta_contenido}s</label>
                                <span>${total_dialogos}</span>
                            </div>
                            <div class="info-item">
                                <label>Formato</label>
                                <span>${formato?.toUpperCase() || 'VIDEO'}</span>
                            </div>
                            <div class="info-item">
                                <label>Producción ID</label>
                                <span>${escaparHTML(produccion_id)}</span>
                            </div>
                        </div>
                    </div>

                    <div class="video-fields">
                        <h3>📝 Datos del video</h3>
                        <div class="form-row">
                            <div class="form-group-inline">
                                <label for="titulo_video">Título del video</label>
                                <input type="text" id="titulo_video" value="${escaparHTML(titulo)}" placeholder="Título del video">
                            </div>
                            <div class="form-group-inline">
                                <label for="descripcion_video">Descripción</label>
                                <input type="text" id="descripcion_video" value="${escaparHTML(descripcion)}" placeholder="Descripción del video">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group-inline">
                                <label for="editor_responsable">Editor responsable</label>
                                <input type="text" id="editor_responsable" value="${escaparHTML(editor_responsable)}" placeholder="correo@ejemplo.com">
                            </div>
                            <div class="form-group-inline">
                                <label for="main_scene">Escenario (en inglés)</label>
                                <input type="text" id="main_scene" value="${escaparHTML(main_scene)}" placeholder="Main scene description">
                            </div>
                        </div>
                    </div>

                    <div class="scenes-list">
                        <h3>✏️ Editar ${es_video ? 'escenas' : 'viñetas'}</h3>
                        <p style="color:#555;margin-bottom:16px;">Puedes modificar los diálogos antes de continuar con la producción del ${es_video ? 'video' : 'la historieta'}.</p>
                        ${scenesHTML}
                    </div>
                </div>

                <div class="edit-modal-footer">
                    <button class="btn-cancel" onclick="closeEditModal()">Cancelar</button>
                    <button class="btn-save" id="btnSave">Guardar cambios</button>
                </div>
            </div>
        </div>
    `;
}

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
        console.log('Close button clicked');
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

    document.querySelectorAll('.scene-dialogue').forEach(textarea => {
        textarea.addEventListener('input', function () {
            hasUnsavedChanges = true;
            const numero = this.dataset.numero;
            const counter = document.querySelector(`.word-counter[data-numero="${numero}"]`);
            if (counter) {
                const words = String(this.value).split(/\s+/).filter(Boolean).length;
                counter.textContent = `${words} / 16 palabras`;
                counter.classList.remove('warning', 'error');
                if (words > 16) {
                    counter.classList.add('error');
                } else if (words >= 13) {
                    counter.classList.add('warning');
                }
            }
        });
    });

    document.querySelectorAll('.scene-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            hasUnsavedChanges = true;
        });
    });

    document.getElementById('titulo_video').addEventListener('input', function () {
        hasUnsavedChanges = true;
    });

    document.getElementById('descripcion_video').addEventListener('input', function () {
        hasUnsavedChanges = true;
    });

    document.getElementById('editor_responsable').addEventListener('input', function () {
        hasUnsavedChanges = true;
    });

    document.getElementById('main_scene').addEventListener('input', function () {
        hasUnsavedChanges = true;
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
