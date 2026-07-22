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
        const response = await fetch('https://n8n.ec.pe/webhook-test/init', {
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
