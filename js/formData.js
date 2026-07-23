function getFormData() {
    const sceneCards = document.querySelectorAll('.scene-card');
    const payload = {
        email: document.getElementById('email').value.trim().toLowerCase(),
        nota: document.getElementById('noteUrl').value.trim(),
        produccion_id: document.querySelector('.edit-modal')?.dataset?.produccionId || '',
        titulo_noticia: document.getElementById('titulo_noticia')?.value?.trim() || '',
        subtitulo_noticia: document.getElementById('subtitulo_noticia')?.value?.trim() || '',
        email_editor: document.getElementById('email_editor')?.value?.trim() || '',
        url_noticia: document.getElementById('url_noticia')?.value?.trim() || '',
        titulo_video: document.getElementById('titulo_video')?.value?.trim() || '',
        descripcion_video: document.getElementById('descripcion_video')?.value?.trim() || '',
        editor_responsable: document.getElementById('editor_responsable')?.value?.trim() || '',
        main_scene: document.getElementById('main_scene')?.value?.trim() || '',
        submittedAt: new Date().toISOString(),
        formMode: 'edit'
    };

    const dialogos = {};

    // We need to find the checkboxes and textareas for scenes.
    // Since they are dynamic, we look for elements with data-numero.
    const sceneCheckboxes = document.querySelectorAll('.scene-checkbox');
    sceneCheckboxes.forEach(checkbox => {
        const numero = checkbox.dataset.numero;
        if (numero) {
            const incluido = checkbox.checked;
            const textarea = document.getElementById(`dialogo_escena_${numero}`);
            const dialogo = textarea?.value ?? '';

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