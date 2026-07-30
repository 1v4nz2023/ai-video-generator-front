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

        // Lock card if max editions reached
        const puedeEditar = (Number(scene.ediciones ?? 0) < 3);
        if (!puedeEditar && !card.classList.contains('locked')) {
            card.classList.add('locked');
            const dialogueField = card.querySelector('.scene-dialogue-field');
            if (dialogueField) {
                const lockedBox = document.createElement('div');
                lockedBox.className = 'locked-dialogue-box';
                lockedBox.innerHTML = `
                    <p class="locked-dialogue-text">${escaparHTML(scene.dialogue ?? '')}</p>
                    <div class="locked-warning">🔒 Límite de ediciones alcanzado</div>
                `;
                dialogueField.replaceWith(lockedBox);
            }
        }
    });
}

async function saveChanges() {
    const sceneCards = document.querySelectorAll('.scene-card');
    const sceneData = [];

    sceneCards.forEach(card => {
        const checkbox = card.querySelector('.scene-checkbox');
        const numero = checkbox?.dataset.numero;
        const textarea = card.querySelector('.scene-dialogue-textarea');
        const lockedDialogueText = card.querySelector('.locked-dialogue-text');
        const dialogo = textarea?.value ?? (lockedDialogueText?.textContent ?? '');
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
    console.log('Payload enviado:', JSON.stringify(data, null, 2));

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
