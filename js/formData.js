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

    const escenas = [];

    sceneCards.forEach(card => {
        const checkbox = card.querySelector('.scene-checkbox');
        const numero = checkbox?.dataset.numero;
        const textarea = card.querySelector('.scene-dialogue-textarea');
        const lockedDialogueText = card.querySelector('.locked-dialogue-text');
        const dialogo = textarea?.value ?? (lockedDialogueText?.textContent ?? '');
        const incluido = checkbox?.checked ?? false;
        const titulo = card?.getAttribute('data-titulo') || '';
        const itemId = card?.getAttribute('data-item-id') || '';
        const produccionId = card?.getAttribute('data-produccion-id') || '';
        const previewUrl = card?.getAttribute('data-preview-url') || '';

        if (numero) {
            escenas.push({
                numero: Number(numero),
                titulo,
                dialogue: dialogo,
                incluido,
                item_id: itemId,
                produccion_id: produccionId,
                previewUrl
            });
        }
    });

    if (escenas.length > 0) {
        payload.escenas = escenas;
    }

    return payload;
}

function actualizarContadoresEdicion() {
    const sceneCards = document.querySelectorAll('.scene-card');
    
    sceneCards.forEach(card => {
        const textarea = card.querySelector('.scene-dialogue-textarea');
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
            
            const dialogueField = textarea.closest('.scene-dialogue-field');
            const wordCounter = dialogueField.querySelector('.word-counter');
            const valorFinal = actual;
            
            textarea.remove();
            if (wordCounter) wordCounter.remove();
            
            const locked = document.createElement('p');
            locked.className = 'locked-dialogue-text';
            locked.textContent = valorFinal;
            dialogueField.appendChild(locked);
        }
    });
}