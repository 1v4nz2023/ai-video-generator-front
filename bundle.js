const fs = require('fs');
const path = require('path');

const baseDir = __dirname;

const cssFiles = [
    'css/variables.css',
    'css/base.css',
    'css/components.css',
    'css/modals.css',
    'css/news.css',
    'css/media.css',
    'css/scenes.css',
    'css/structure.css'
];

const jsFiles = [
    'js/constants.js',
    'js/utils.js',
    'js/modals.js',
    'js/editModal.js',
    'js/formData.js',
    'js/saveHandler.js',
    'js/formHandler.js'
];

const cssContent = cssFiles
    .map(file => {
        const filePath = path.join(baseDir, file);
        return `/* ==========================================\n   FILE: ${file}\n   ========================================== */\n` + fs.readFileSync(filePath, 'utf8');
    })
    .join('\n\n');

const jsContent = jsFiles
    .map(file => {
        const filePath = path.join(baseDir, file);
        return `// ==========================================\n// FILE: ${file}\n// ========================================== \n` + fs.readFileSync(filePath, 'utf8');
    })
    .join('\n\n');

const htmlTemplate = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Video Generator</title>
    <style>
${cssContent}
    </style>
</head>
<body>
    <div class="container">
        <img src="https://cdna.elcomercio.pe/resources/dist/elcomercio/images/logo.png?d=1" alt="Logo" class="logo">
        <h1>AI Video Generator</h1>
        <p class="subtitle">Ingresa tus credenciales para continuar</p>

        <form id="loginForm">
            <div class="form-group">
                <label for="email">Correo electrónico</label>
                <input type="email" id="email" placeholder="tu@correo.com" required autocomplete="email">
            </div>

            <div class="form-group">
                <label for="noteUrl">URL de la nota</label>
                <input type="url" id="noteUrl" placeholder="https://ejemplo.com/nota" required>
            </div>

            <button type="submit" id="submitBtn">Iniciar proceso</button>
        </form>

        <div class="message" id="message"></div>
    </div>

    <script>
${jsContent}
    </script>
</body>
</html>
`;

const outputPath = path.join(baseDir, 'ai-video-generator.html');
fs.writeFileSync(outputPath, htmlTemplate, 'utf8');
console.log('Successfully regenerated ai-video-generator.html');
