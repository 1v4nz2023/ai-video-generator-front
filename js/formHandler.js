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
        const initResponse = await fetch(`${DOMAIN}/webhook/edit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, nota: noteUrl })
        });

        if (!initResponse.ok) {
            let errorMessage = `Error en inicialización ${initResponse.status}`;
            try {
                const errorData = await initResponse.json();
                if (errorData && errorData.message) {
                    errorMessage = errorData.message.replace(/\*\*\[line \d+\]\*\*/g, '').replace(/\[line \d+\]/g, '').trim();
                }
            } catch {
                errorMessage = `Error ${initResponse.status}: ${initResponse.statusText}`;
            }
            throw new Error(errorMessage);
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

            // Limpiar marcas [line XX] de los campos de texto
            const cleanLineMarkers = (text) => {
                if (typeof text !== 'string') return text;
                return text.replace(/\*\*\[line \d+\]\*\*/g, '').trim();
            };

            // Transformar estructura plana del nuevo JSON a estructura anidada que espera editModal.js
            const clean = cleanLineMarkers;
            const transformed = {
                formato: clean(responseData.formato),
                es_video: responseData.esVideo,
                etiqueta_contenido: clean(responseData.etiquetaContenido),
                produccion_id: responseData.produccion_id,
                noticia_id: responseData.noticia_id,
                noticia: {
                    titulo: clean(responseData.titulo_noticia),
                    subtitulo: clean(responseData.subtitulo_noticia),
                    autor: clean(responseData.autor),
                    url: clean(responseData.url_noticia)
                },
                video_url: clean(responseData.video_url),
                editor_responsable: clean(responseData.email_editor),
                main_scene: clean(responseData.main_scene),
                imagenes: (Array.isArray(responseData.imagenes_nota) ? responseData.imagenes_nota.map(img => ({ url: clean(img) })) : []),
                imagen_seleccionada_default: responseData.imagen_principal ? clean(responseData.imagen_principal) : null,
                escenas: (Array.isArray(responseData.escenas) ? responseData.escenas.map(esc => ({
                    numero: esc.numero,
                    titulo: clean(esc.titulo),
                    dialogue: clean(esc.dialogo),
                    prompt: clean(esc.prompt),
                    previewUrl: clean(esc.preview_url),
                    incluido: esc.incluido,
                    ediciones: esc.ediciones,
                    puedeEditar: esc.puedeEditar,
                    item_id: esc.item_id,
                    produccion_id: esc.produccion_id,
                    fieldName: {
                        dialogo: `dialogo_escena_${esc.numero}`,
                        incluido: `incluido_escena_${esc.numero}`
                    },
                    reglasDialogo: {
                        maxPalabras: 16
                    }
                })) : [])
            };

            console.log('Transformed data:', transformed);

            if (!transformed.noticia || typeof transformed.noticia.titulo !== 'string') {
                showMessage('Los datos no incluyen información de la noticia', 'error');
                return;
            }

            if (!Array.isArray(transformed.escenas) || transformed.escenas.length === 0) {
                showMessage('Los datos no incluyen escenas válidas', 'error');
                return;
            }

            openEditModal(transformed);
        } else {
            showMessage('No se recibieron datos de la noticia.', 'error');
        }

    } catch (error) {
        // Si el mensaje ya es descriptivo (del webhook), mostrarlo directo
        if (error.message.startsWith('Error en inicialización') || error.message.startsWith('Error ')) {
            showMessage('Error al procesar la solicitud: ' + error.message, 'error');
        } else {
            showMessage(error.message, 'error');
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Iniciar proceso';
    }
});
