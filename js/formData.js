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

function actualizarContadoresEdicion() {
    const sceneCards = document.querySelectorAll('.scene-card');

    sceneCards.forEach(card => {
        const textarea = card.querySelector('.scene-dialogue');
        if (!textarea) return;

        const numero = textarea.dataset.numero;
        const original = textarea.dataset.original ?? '';
        const actual = textarea.value;

        if (actual === original) return;

        const maxEdiciones = parseInt(card.dataset.maxEdiciones || '3', 10);
        let ediciones = parseInt(card.dataset.ediciones || '0', 10) + 1;
        card.dataset.ediciones = ediciones;
        textarea.dataset.original = actual;

        const counterEl = card.querySelector(`.ediciones-count[data-numero="${numero}"]`);
        if (counterEl) counterEl.textContent = ediciones;

        if (ediciones >= maxEdiciones) {
            const limiteEl = card.querySelector(`.limite-alcanzado[data-numero="${numero}"]`);
            if (limiteEl) limiteEl.style.display = 'inline';

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
