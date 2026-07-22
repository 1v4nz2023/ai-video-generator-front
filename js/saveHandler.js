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
