const form = document.getElementById('loginForm');
const submitBtn = document.getElementById('submitBtn');

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
        // 1. Enviar datos iniciales (Respuesta inmediata)
        const initResponse = await fetch('https://n8n.ec.pe/webhook-test/edit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, nota: noteUrl })
        });

        if (!initResponse.ok) {
            throw new Error(`Error en inicialización ${initResponse.status}`);
        }

        const data = await initResponse.json();

        if (data && data.length > 0) {
            let responseData = data[0];

            // Si el primer elemento es un array, tomamos el primer objeto de ese array
            if (Array.isArray(responseData)) {
                responseData = responseData[0];
            }

            console.log('Response data received:', responseData);

            if (!responseData || typeof responseData !== 'object') {
                showMessage('Datos recibidos con formato inválido', 'error');
                return;
            }

            if (!responseData.noticia || typeof responseData.noticia.titulo !== 'string') {
                showMessage('Los datos no incluyen información de la noticia', 'error');
                return;
            }

            if (!Array.isArray(responseData.escenas) || responseData.escenas.length === 0) {
                showMessage('Los datos no incluyen escenas válidas', 'error');
                return;
            }

            openEditModal(responseData);
        } else {
            showMessage('No se recibieron datos de la noticia.', 'error');
        }

    } catch (error) {
        showMessage('Error al procesar la solicitud: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Iniciar proceso';
    }
});
