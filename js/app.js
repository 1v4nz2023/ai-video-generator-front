const form = document.getElementById('loginForm');
const messageEl = document.getElementById('message');
const submitBtn = document.getElementById('submitBtn');

function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = 'message ' + type;
}

function clearMessage() {
    messageEl.className = 'message';
}

function escaparHTML(texto) {
    if (texto === null || texto === undefined) return "";
    return String(texto)
        .replace(/`/g, "&#96;")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

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

let hasUnsavedChanges = false;

window.addEventListener('beforeunload', function (e) {
    if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Tienes cambios no guardados. Si sales se perderán.';
        return 'Tienes cambios no guardados. Si sales se perderán.';
    }
});

function showAbandonModal() {
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
        localStorage.removeItem('editModalData');
        window.location.href = 'index.html';
    });

    noBtn.addEventListener('click', function () {
        overlay.remove();
        hasUnsavedChanges = true;
    });

    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
            overlay.remove();
            hasUnsavedChanges = true;
        }
    });
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

function getFormData() {
    const sceneCards = document.querySelectorAll('.scene-card');
    const payload = {
        email: document.getElementById('email').value.trim().toLowerCase(),
        nota: document.getElementById('noteUrl').value.trim(),
        produccion_id: document.querySelector('.edit-modal')?.dataset?.produccionId || '',
        titulo_video: document.getElementById('titulo_video').value.trim(),
        descripcion_video: document.getElementById('descripcion_video').value.trim(),
        editor_responsable: document.getElementById('editor_responsable').value.trim(),
        main_scene: document.getElementById('main_scene').value.trim(),
        submittedAt: new Date().toISOString(),
        formMode: 'edit'
    };

    const dialogos = {};

    sceneCards.forEach(card => {
        const numero = card.querySelector('.scene-checkbox')?.dataset.numero;
        const incluido = card.querySelector('.scene-checkbox')?.checked;
        const textarea = card.querySelector('.scene-dialogue');
        const lockedDialogue = card.querySelector('.locked-dialogue');
        const dialogo = textarea?.value ?? (lockedDialogue?.textContent ?? '');

        if (numero) {
            dialogos[numero] = {
                numero,
                dialogue: dialogo,
                incluido
            };

            payload[`dialogo_escena_${numero}`] = dialogo;
            payload[`incluido_escena_${numero}`] = incluido ? ['Incluir'] : [];
        }
    });

    return payload;
}

/**
 * Recorre las scene-cards y, para cada textarea editable cuyo valor
 * cambió respecto al último guardado (data-original), incrementa el
 * contador de ediciones en el DOM. Si llega al máximo, bloquea el campo.
 */
function actualizarContadoresEdicion() {
    const sceneCards = document.querySelectorAll('.scene-card');

    sceneCards.forEach(card => {
        const textarea = card.querySelector('.scene-dialogue');
        if (!textarea) return; // ya estaba bloqueada (locked-dialogue), no aplica

        const numero = textarea.dataset.numero;
        const original = textarea.dataset.original ?? '';
        const actual = textarea.value;

        if (actual === original) return; // sin cambios reales, no cuenta como edición

        const maxEdiciones = parseInt(card.dataset.maxEdiciones || '3', 10);
        let ediciones = parseInt(card.dataset.ediciones || '0', 10) + 1;
        card.dataset.ediciones = ediciones;
        textarea.dataset.original = actual; // reset para la próxima comparación

        const counterEl = card.querySelector(`.ediciones-count[data-numero="${numero}"]`);
        if (counterEl) counterEl.textContent = ediciones;

        if (ediciones >= maxEdiciones) {
            const limiteEl = card.querySelector(`.limite-alcanzado[data-numero="${numero}"]`);
            if (limiteEl) limiteEl.style.display = 'inline';

            // Bloquear el campo al llegar al máximo de ediciones
            const dialogueField = textarea.closest('.scene-field');
            const wordCounter = dialogueField.querySelector('.word-counter');
            const valorFinal = actual;

            textarea.remove();
            if (wordCounter) wordCounter.remove();

            const locked = document.createElement('p');
            locked.className = 'locked-dialogue';
            locked.textContent = valorFinal;
            dialogueField.appendChild(locked);
        }
    });
}

async function saveChanges() {
    const sceneCards = document.querySelectorAll('.scene-card');
    const sceneData = [];

    sceneCards.forEach(card => {
        const numero = card.querySelector('.scene-checkbox')?.dataset.numero;
        const textarea = card.querySelector('.scene-dialogue');
        const lockedDialogue = card.querySelector('.locked-dialogue');
        const dialogo = textarea?.value ?? (lockedDialogue?.textContent ?? '');
        const words = String(dialogo).split(/\s+/).filter(Boolean).length;

        if (words > 0) {
            sceneData.push({ numero, words });
        }
    });

    const invalidScenes = sceneData.filter(s => s.words < 5 || s.words > 16);

    if (invalidScenes.length > 0) {
        const messages = invalidScenes.map(s =>
            `Escena ${s.numero}: ${s.words} palabras (mínimo 5, máximo 16)`
        );
        alert('Diálogos inválidos:\n\n' + messages.join('\n'));
        return;
    }

    const btn = document.getElementById('btnSave');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>Guardando...';

    const data = getFormData();

    try {
        const response = await fetch('https://n8n.ec.pe/webhook/save-edits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        let result;
        try {
            result = await response.json();
        } catch (parseError) {
            throw new Error('La respuesta del servidor no es un JSON válido');
        }

        // Actualizar contador de ediciones para las escenas que cambiaron
        actualizarContadoresEdicion();

        hasUnsavedChanges = false;
        localStorage.removeItem('editModalData');

        const mensaje = result.mensaje ?? 'Operación completada sin mensaje';
        const dialogosActualizados = Array.isArray(result.dialogos_actualizados) ? result.dialogos_actualizados : [];

        const summaryHTML = `
            <div class="save-alert-overlay">
                <div class="save-alert">
                    <div class="save-alert-icon">${result.hubo_cambios ? '✅' : 'ℹ️'}</div>
                    <h3 style="color:#1a1a2e;font-size:1.2rem;margin-bottom:8px;">${result.hubo_cambios ? 'Cambios guardados' : 'Sin cambios'}</h3>
                    <p style="color:#555;font-size:0.9rem;margin-bottom:16px;">${escaparHTML(mensaje)}</p>
                    ${dialogosActualizados.length > 0
                        ? `<div class="save-alert-list">
                            <p style="color:#666;font-size:0.8rem;font-weight:600;margin-bottom:8px;">DIÁLOGOS ACTUALIZADOS:</p>
                            ${dialogosActualizados.map(d => `
                                <div class="save-alert-item">
                                    <p style="color:#1a1a2e;font-size:0.85rem;font-weight:600;margin-bottom:2px;">Escena ${d.numero}: ${escaparHTML(d.titulo)}</p>
                                    <p style="color:#555;font-size:0.8rem;">${escaparHTML(d.dialogo_nuevo)}</p>
                                </div>
                            `).join('')}
                          </div>`
                        : ''
                    }
                    <button class="btn-save-alert-close">Cerrar</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', summaryHTML);

        const overlay = document.querySelector('.save-alert-overlay');
        const closeBtn = overlay.querySelector('.btn-save-alert-close');

        closeBtn.addEventListener('click', function () {
            overlay.remove();
        });

        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) overlay.remove();
        });

        btn.disabled = false;
        btn.textContent = 'Guardar cambios';

    } catch (error) {
        showMessage('Error al guardar: ' + error.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Guardar cambios';
    }
}

form.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearMessage();

    const email = document.getElementById('email').value.trim().toLowerCase();
    const noteUrl = document.getElementById('noteUrl').value.trim();

    if (!email) {
        showMessage('Ingresa tu correo electrónico', 'error');
        return;
    }

    if (!noteUrl) {
        showMessage('Ingresa la URL de la nota', 'error');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span>Procesando...';

    try {
        const response = await fetch('https://n8n.ec.pe/webhook/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, nota: noteUrl })
        });

        let data;
        try {
            data = await response.json();
        } catch (parseError) {
            throw new Error('La respuesta del servidor no es un JSON válido');
        }

        if (!response.ok) {
            if (data && data.error) {
                showMessage(data.error, 'error');
            } else {
                showMessage(`Error ${response.status}: ${response.statusText}`, 'error');
            }
            return;
        }

        if (data && data.error) {
            showMessage(data.error, 'error');
            return;
        }

        if (data && data.length > 0) {
            const responseData = data[0];

            if (!responseData || typeof responseData !== 'object') {
                showMessage('Datos recibidos con formato inválido', 'error');
                return;
            }

            if (!responseData.noticia || typeof responseData.noticia !== 'object') {
                showMessage('Los datos no incluyen información de la noticia', 'error');
                return;
            }

            if (!Array.isArray(responseData.escenas) || responseData.escenas.length === 0) {
                showMessage('Los datos no incluyen escenas válidas', 'error');
                return;
            }

            openEditModal(responseData);
        } else {
            showMessage('No se recibieron datos', 'error');
        }

    } catch (error) {
        showMessage('Error al procesar la solicitud: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Iniciar proceso';
    }
});