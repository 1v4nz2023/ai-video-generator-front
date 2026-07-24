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
                <h3>¿Deseas abandonar el modo de edición?</h3>
                <p>Los cambios no guardados se perderán.</p>
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
                <h3>¿Deseas abandonar el modo de edición?</h3>
                <p>Los cambios no guardados se perderán.</p>
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
                    <video class="preview-video" controls preload="metadata" autoplay>
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
