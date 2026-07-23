function buildEditForm(data) {
    const {
        formato, es_video, etiqueta_contenido, emoji_contenido,
        produccion_id, noticia_id,
        form_fields
    } = data;

    let formHTML = '';

    form_fields.forEach((field, index) => {
        let fieldHTML = '';
        const label = field.fieldLabel ? `<label>${field.fieldLabel}</label><br>` : '';

        switch (field.fieldType) {
            case 'html':
                fieldHTML = `<div class="form-section">${field.html}</div>`;
                break;
            case 'text':
                fieldHTML = `
                    <div class="form-group">
                        ${label}
                        <input type="text" id="${field.fieldName}" value="${field.defaultValue ?? ''}" placeholder="${field.placeholder ?? ''}">
                    </div>`;
                break;
            case 'textarea':
                fieldHTML = `
                    <div class="form-group">
                        ${label}
                        <textarea id="${field.fieldName}" placeholder="${field.placeholder ?? ''}" rows="3">${field.defaultValue ?? ''}</textarea>
                        <div class="word-counter" data-numero="${field.fieldName.split('_').pop()}">${field.defaultValue ? (field.defaultValue.split(/\s+/).filter(Boolean).length) : 0} / 16 palabras</div>
                    </div>`;
                break;
            case 'dropdown':
                fieldHTML = `
                    <div class="form-group">
                        ${label}
                        <select id="${field.fieldName}">
                            ${field.fieldOptions.values.map(opt => `<option value="${opt.option}" ${opt.option === field.defaultValue ? 'selected' : ''}>${opt.option}</option>`).join('')}
                        </select>
                    </div>`;
                break;
            case 'checkbox':
                const checked = (field.defaultValue && field.defaultValue.includes(field.fieldOptions.values[0].option)) ? 'checked' : '';
                fieldHTML = `
                    <div class="form-group">
                        ${label}
                        <input type="checkbox" class="scene-checkbox" data-numero="${field.fieldName.split('_').pop()}" ${checked}>
                    </div>`;
                break;
            case 'hiddenField':
                fieldHTML = `<input type="hidden" id="${field.fieldName}" value="${field.fieldValue ?? ''}">`;
                break;
        }

        formHTML += `<div class="form-field-container" style="margin-bottom: 20px;">${fieldHTML}</div>`;
    });

    return `
        <div class="edit-modal-overlay">
            <div class="edit-modal" data-produccion-id="${escaparHTML(produccion_id)}">
                <div class="edit-modal-header">
                    <h2>✏️ Editar ${es_video ? 'Escenas' : 'Viñetas'}</h2>
                    <button id="btnCloseEditModal" type="button">&times;</button>
                </div>
                <div class="edit-modal-body">
                    ${formHTML}
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
        });
    });

    document.querySelectorAll('textarea').forEach(textarea => {
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