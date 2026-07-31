function mostrarErrorAlert(message) {
    const errorHTML = `
        <div class="error-alert-overlay">
            <div class="error-alert">
                <div class="error-alert-icon">❌</div>
                <h3>Error</h3>
                <p>${escaparHTML(message)}</p>
                <button class="btn-error-alert-close">Cerrar</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', errorHTML);
    const overlay = document.querySelector('.error-alert-overlay');
    const closeBtn = overlay?.querySelector('.btn-error-alert-close');
    closeBtn?.addEventListener('click', () => overlay?.remove());
    overlay?.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
}

function actualizarEscenasUI(scenesData) {
    scenesData.forEach(scene => {
        const sceneId = `scene-${scene.item_id}`;
        const card = document.getElementById(sceneId);
        if (!card) return;

        // Update edition badge
        const badge = card.querySelector('.edition-badge');
        if (badge) {
            badge.textContent = `Ediciones: ${scene.ediciones ?? 0} / 3`;
        }

        // Update dialogue textarea
        const fieldName = `dialogo_escena_${scene.numero}`;
        const textarea = card.querySelector(`#${escaparHTML(fieldName)}`);
        if (textarea) {
            textarea.value = scene.dialogue ?? '';
            // Update word counter
            const counter = card.querySelector('.word-counter');
            if (counter) {
                const words = (scene.dialogue ?? '').split(/\s+/).filter(Boolean).length;
                const maxWords = 16;
                counter.textContent = `${words} / ${maxWords} palabras`;
            }
        }

        // Update included checkbox
        const checkbox = card.querySelector('.scene-checkbox');
        if (checkbox) {
            checkbox.checked = scene.incluido ?? false;
        }
    });
}

async function saveChanges() {
    // Validar campos de Configuración de Producción
    const tituloVideo = document.getElementById('titulo_video')?.value?.trim() || '';
    const descripcionVideo = document.getElementById('descripcion_video')?.value?.trim() || '';
    const editorResponsable = document.getElementById('editor_responsable')?.value?.trim() || '';
    const mainSceneInput = document.getElementById('main_scene');
    const mainScene = mainSceneInput?.value?.trim() || '';

    const emptyConfig = [];
    if (!tituloVideo) emptyConfig.push('Título del video');
    if (!descripcionVideo) emptyConfig.push('Descripción del video');
    if (!editorResponsable) emptyConfig.push('Editor responsable');
    if (mainSceneInput && !mainScene) emptyConfig.push('Prompt maestro');

    if (emptyConfig.length > 0) {
        alert(`Campos vacíos en Configuración de Producción:\n\n${emptyConfig.join('\n')}`);
        return;
    }

    // Validar escenas
    const sceneCards = document.querySelectorAll('.scene-card');
    const emptyScenes = [];
    const invalidScenes = [];
    sceneCards.forEach(card => {
        const checkbox = card.querySelector('.scene-checkbox');
        const numero = checkbox?.dataset.numero;
        const textarea = card.querySelector('.scene-dialogue-textarea');
        const lockedDialogueText = card.querySelector('.locked-dialogue-text');
        const dialogo = textarea?.value ?? (lockedDialogueText?.textContent ?? '');
        const words = String(dialogo).split(/\s+/).filter(Boolean).length;
        if (words === 0) {
            emptyScenes.push(numero);
        } else if (words < 5 || words > 16) {
            invalidScenes.push({ numero, words });
        }
    });

    if (emptyScenes.length > 0) {
        alert(`Campos vacíos en las escenas: ${emptyScenes.join(', ')}.`);
        return;
    }

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
    console.log('Payload enviado:', JSON.stringify(data, null, 2));

    // Verificar si hubo cambios reales desde que se abrió el modal
    if (!hayCambiosDetectados()) {
        const mensaje = 'No se detectaron cambios en los campos. No es necesario guardar.';
        console.log('Sin cambios detectados:', mensaje);
        const summaryHTML = `
            <div class="save-alert-overlay">
                <div class="save-alert">
                    <div class="save-alert-icon">ℹ️</div>
                    <h3>Sin cambios</h3>
                    <p>${escaparHTML(mensaje)}</p>
                    <button class="btn-save-alert-close">Cerrar</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', summaryHTML);
        const overlay = document.querySelector('.save-alert-overlay');
        const closeBtn = overlay?.querySelector('.btn-save-alert-close');
        closeBtn?.addEventListener('click', () => overlay?.remove());
        overlay?.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
        btn.disabled = false;
        btn.textContent = 'Guardar cambios';
        return;
    }

    try {
        const response = await fetch(`${DOMAIN}/webhook/save-edits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            let errorMessage = `Error ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message ?? errorData.mensaje ?? errorMessage;
            } catch {
                // Si no es JSON, usar el mensaje de status
            }
            mostrarErrorAlert(errorMessage);
            btn.disabled = false;
            btn.textContent = 'Guardar cambios';
            return;
        }

        let result;
        try {
            result = await response.json();
        } catch (parseError) {
            mostrarErrorAlert('La respuesta del servidor no es un JSON válido');
            btn.disabled = false;
            btn.textContent = 'Guardar cambios';
            return;
        }

        actualizarContadoresEdicion();

        hasUnsavedChanges = false;
        localStorage.removeItem('editModalData');

        const mensaje = result.message ?? result.mensaje ?? 'Datos guardados correctamente';
        const mensajeLower = mensaje.toLowerCase();
        const esSinCambios = mensajeLower.includes('sin cambios') || 
                             mensajeLower.includes('no se aplicó') || 
                             mensajeLower.includes('no se aplico') || 
                             mensajeLower.includes('modificación alguna') || 
                             mensajeLower.includes('modificacion alguna');

        const summaryHTML = `
            <div class="save-alert-overlay">
                <div class="save-alert">
                    <div class="save-alert-icon">${esSinCambios ? 'ℹ️' : '✅'}</div>
                    <h3>${esSinCambios ? 'Sin cambios' : 'Guardado con éxito'}</h3>
                    <p>${escaparHTML(mensaje)}</p>
                    <button class="btn-save-alert-close">Cerrar</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', summaryHTML);

        const overlays = document.querySelectorAll('.save-alert-overlay');
        const overlay = overlays[overlays.length - 1];
        const closeBtn = overlay.querySelector('.btn-save-alert-close');

        if (closeBtn) {
            closeBtn.addEventListener('click', async function () {
                if (!esSinCambios && data.produccion_id) {
                    try {
                        const response = await fetch(`${DOMAIN}/webhook/get-edit?production_id=${encodeURIComponent(data.produccion_id)}`);
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
                overlay.remove();
            });
        }

        // Close on overlay click
        overlay?.addEventListener('click', (e) => {
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
