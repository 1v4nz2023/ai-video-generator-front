const form = document.getElementById('loginForm');
const submitBtn = document.getElementById('submitBtn');

let pollingInterval = null;

// Helper: normaliza la respuesta de /webhook/estado,
// que a veces viene como array [{...}] y a veces como objeto plano {...}
function normalizarStatusData(rawData) {
    if (Array.isArray(rawData)) {
        return rawData.length > 0 ? rawData[0] : null;
    }
    return rawData || null;
}

// Helper: libera el botón de "Iniciar proceso" y lo deja en su estado inicial.
// Se expone en window para que editModal.js pueda llamarlo cuando termine
// (o falle) el flujo de selección de formato.
function resetSubmitBtn() {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Iniciar proceso';
}
window.resetSubmitBtn = resetSubmitBtn;

// Limpia marcas [line XX] de los campos de texto
function cleanLineMarkers(text) {
    if (typeof text !== 'string') return text;
    return text.replace(/\*\*\[line \d+\]\*\*/g, '').trim();
}

// Transforma la estructura plana del JSON del webhook a la estructura anidada
// que espera editModal.js. Se expone en window porque también la usa
// mostrarEscenasCreadasModal() en editModal.js cuando el usuario entra al
// editor después de que las escenas fueron creadas.
function transformarDatosNoticia(responseData) {
    const clean = cleanLineMarkers;
    return {
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
}
window.transformarDatosNoticia = transformarDatosNoticia;

// Función de polling para verificar el estado del job
function iniciarPollingJob(jobId) {
    if (pollingInterval) clearInterval(pollingInterval);

    pollingInterval = setInterval(async () => {
        try {
            const response = await fetch(`${DOMAIN}/webhook/estado?jobId=${encodeURIComponent(jobId)}`);
            if (response.ok) {
                const rawData = await response.json();
                const statusData = normalizarStatusData(rawData);

                if (!statusData) {
                    console.warn('⚠️ Respuesta de /estado vacía o inválida, se reintenta en el próximo tick');
                    return;
                }

                if (statusData.html && statusData.html.trim() !== '') {
                    // HTML no null → cerrar modal "Video en Proceso" y mostrar "Second Brain"
                    clearInterval(pollingInterval);
                    pollingInterval = null;

                    // IMPORTANTE: leer de localStorage ANTES de borrar
                    const email = localStorage.getItem('videoEmail');
                    const noteUrl = localStorage.getItem('videoJobUrl');

                    localStorage.removeItem('videoJobId');
                    localStorage.removeItem('videoJobUrl');

                    // El botón se queda bloqueado: todavía falta que el usuario
                    // elija el formato y ese flujo termine (ver editModal.js).
                    submitBtn.disabled = true;
                    submitBtn.textContent = '🧠 Elige un formato...';

                    // jobId viaja explícito como parámetro, no depende de localStorage
                    mostrarRecomendacionFormatoModal(statusData.html, email, noteUrl, statusData.noticia_id, jobId);
                    console.log('✅ HTML detectado → mostrando Second Brain');
                } else if (statusData.status === 'completed' || statusData.status === 'done') {
                    clearInterval(pollingInterval);
                    pollingInterval = null;
                    localStorage.removeItem('videoJobId');
                    localStorage.removeItem('videoJobUrl');
                    resetSubmitBtn();
                    console.log('✅ Job completado');
                } else if (statusData.status === 'failed' || statusData.status === 'error') {
                    clearInterval(pollingInterval);
                    pollingInterval = null;
                    localStorage.removeItem('videoJobId');
                    localStorage.removeItem('videoJobUrl');
                    resetSubmitBtn();
                    console.warn('❌ Job fallido');
                }
            }
        } catch (error) {
            console.error('Error en polling:', error);
        }
    }, 5000);
}

// Verificar job activo al cargar la página
document.addEventListener('DOMContentLoaded', async function () {
    const jobId = localStorage.getItem('videoJobId');
    const jobUrl = localStorage.getItem('videoJobUrl');

    if (jobId && jobUrl) {
        try {
            const response = await fetch(`${DOMAIN}/webhook/estado?jobId=${encodeURIComponent(jobId)}`);
            if (response.ok) {
                const rawData = await response.json();
                const statusData = normalizarStatusData(rawData);

                if (statusData && (statusData.status === 'procesando' || statusData.status === 'pending' || statusData.status === 'in_progress')) {
                    mostrarJobEnCursoModal(statusData.message || 'Ya hay un video generándose para esta nota.');
                    submitBtn.disabled = true;
                    submitBtn.textContent = '⏳ Video generándose...';
                    iniciarPollingJob(jobId);
                } else if (statusData && statusData.html && statusData.html.trim() !== '') {
                    // Por si al recargar la página el html ya estaba listo
                    const email = localStorage.getItem('videoEmail');
                    const noteUrl = localStorage.getItem('videoJobUrl');

                    localStorage.removeItem('videoJobId');
                    localStorage.removeItem('videoJobUrl');

                    submitBtn.disabled = true;
                    submitBtn.textContent = '🧠 Elige un formato...';

                    mostrarRecomendacionFormatoModal(statusData.html, email, noteUrl, statusData.noticia_id, jobId);
                } else if (statusData && (statusData.status === 'completed' || statusData.status === 'done' || statusData.status === 'failed' || statusData.status === 'error')) {
                    localStorage.removeItem('videoJobId');
                    localStorage.removeItem('videoJobUrl');
                    resetSubmitBtn();
                } else {
                    // Estado desconocido pero jobId sigue activo: reanudar polling por seguridad
                    iniciarPollingJob(jobId);
                }
            }
        } catch (error) {
            console.warn('Error al verificar estado del jobId:', error.message);
        }
    }
});

// Función reutilizable para iniciar el proceso
async function iniciarProceso(email, noteUrl, formatoSeleccionado = null) {
    clearMessage();

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
        const body = { email, nota: noteUrl };
        if (formatoSeleccionado) {
            body.formato = formatoSeleccionado;
        }

        const initResponse = await fetch(`${DOMAIN}/webhook/edit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
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

        // Detectar respuesta de "video se está generando" (objeto plano o array con objeto)
        let generatingData = null;
        if (data && typeof data === 'object' && !Array.isArray(data) && data.message && data.message.includes('video se está generando')) {
            generatingData = data;
        } else if (data && data.length > 0) {
            let responseData = data[0];
            if (Array.isArray(responseData)) {
                responseData = responseData[0];
            }
            if (responseData && typeof responseData === 'object' && responseData.message && responseData.message.includes('video se está generando')) {
                generatingData = responseData;
            }
        }

        if (generatingData) {
            const jobId = generatingData.jobId || generatingData.job_id;
            if (jobId) {
                localStorage.setItem('videoJobId', jobId);
                localStorage.setItem('videoJobUrl', noteUrl);
                localStorage.setItem('videoEmail', email);
            }
            mostrarGenerandoVideoModal(generatingData.message || 'El video se está generando.');
            submitBtn.disabled = true;
            submitBtn.textContent = '⏳ Video generándose...';
            if (jobId) {
                iniciarPollingJob(jobId);
            }
            // Se queda bloqueado a propósito: NO se llama resetSubmitBtn() aquí,
            // y ya no hay `finally` que lo reactive por accidente.
            return;
        }

        // Detectar recomendación de formato del Second Brain
        let recommendationData = null;
        if (data && data.length > 0) {
            let responseData = data[0];
            if (Array.isArray(responseData)) {
                responseData = responseData[0];
            }
            if (responseData && typeof responseData === 'object' && responseData.html && responseData.html.includes('Recomendación del Second Brain')) {
                recommendationData = responseData;
            }
        }

        if (recommendationData) {
            // aquí sí puede venir de localStorage porque se acaba de setear en este mismo flujo
            const jobIdActual = localStorage.getItem('videoJobId');
            submitBtn.disabled = true;
            submitBtn.textContent = '🧠 Elige un formato...';
            mostrarRecomendacionFormatoModal(recommendationData.html, email, noteUrl, recommendationData.noticia_id, jobIdActual);
            return;
        }

        if (data && data.length > 0) {
            let responseData = data[0];

            // Si el primer elemento es un array, tomamos el primer objeto de ese array
            if (Array.isArray(responseData)) {
                responseData = responseData[0];
            }

            if (!responseData || typeof responseData !== 'object') {
                showMessage('Datos recibidos con formato inválido', 'error');
                resetSubmitBtn();
                return;
            }

            const transformed = transformarDatosNoticia(responseData);

            if (!transformed.noticia || typeof transformed.noticia.titulo !== 'string') {
                showMessage('Los datos no incluyen información de la noticia', 'error');
                resetSubmitBtn();
                return;
            }

            if (!Array.isArray(transformed.escenas) || transformed.escenas.length === 0) {
                showMessage('Los datos no incluyen escenas válidas', 'error');
                resetSubmitBtn();
                return;
            }

            openEditModal(transformed);
            resetSubmitBtn();
        } else {
            showMessage('No se recibieron datos de la noticia.', 'error');
            resetSubmitBtn();
        }

    } catch (error) {
        // Si el mensaje ya es descriptivo (del webhook), mostrarlo directo
        if (error.message.startsWith('Error en inicialización') || error.message.startsWith('Error ')) {
            showMessage('Error al procesar la solicitud: ' + error.message, 'error');
        } else {
            showMessage(error.message, 'error');
        }
        resetSubmitBtn();
    }
    // Sin `finally`: el reset del botón se controla explícitamente en cada rama
    // para no reactivarlo mientras un job/formato sigue pendiente.
}

// Exponer la función globalmente para que el modal pueda llamarla
window.iniciarProceso = iniciarProceso;

// Handler del formulario
form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const noteUrl = document.getElementById('noteUrl').value.trim();
    await iniciarProceso(email, noteUrl);
});