const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

const RAW_DOCS_DIR = path.resolve(__dirname, '../raw_docs');
const OUTPUT_DIR = path.resolve(__dirname, '../documents');
const IMAGES_DIR = path.resolve(__dirname, '../public/kb-images');

// Crear directorio de imágenes si no existe
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Función para convertir HTML a Markdown limpio
function htmlToMarkdown(html) {
    let md = html;

    // Convertir encabezados
    md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n');
    md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n');
    md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n');

    // Convertir negritas e itálicas
    md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

    // Convertir enlaces
    md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

    // Convertir listas
    md = md.replace(/<ul[^>]*>/gi, '\n');
    md = md.replace(/<\/ul>/gi, '\n');
    md = md.replace(/<ol[^>]*>/gi, '\n');
    md = md.replace(/<\/ol>/gi, '\n');
    md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');

    // Convertir párrafos
    md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');

    // Limpiar <br>
    md = md.replace(/<br\s*\/?>/gi, '\n');

    // Limpiar divs y spans
    md = md.replace(/<\/?div[^>]*>/gi, '');
    md = md.replace(/<\/?span[^>]*>/gi, '');

    // Limpiar múltiples líneas vacías
    md = md.replace(/\n{3,}/g, '\n\n');

    return md.trim();
}

// Función para convertir tablas HTML a Markdown
function convertTableToMarkdown(html) {
    // Extraer filas de la tabla
    const rows = [];
    const rowMatches = html.matchAll(/<tr[^>]*>(.*?)<\/tr>/gis);

    for (const rowMatch of rowMatches) {
        const cells = [];
        const cellMatches = rowMatch[1].matchAll(/<t[dh][^>]*>(.*?)<\/t[dh]>/gis);

        for (const cellMatch of cellMatches) {
            // Limpiar contenido de la celda
            let cellContent = cellMatch[1]
                .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1')
                .replace(/<br\s*\/?>/gi, '<br>')
                .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
                .replace(/<[^>]+>/g, '')
                .trim();
            cells.push(cellContent);
        }

        if (cells.length > 0) {
            rows.push(cells);
        }
    }

    if (rows.length === 0) return '';

    // Construir tabla Markdown
    let markdown = '\n';

    // Encabezado
    if (rows.length > 0) {
        markdown += '| ' + rows[0].join(' | ') + ' |\n';
        markdown += '|' + rows[0].map(() => '---').join('|') + '|\n';

        // Filas de datos
        for (let i = 1; i < rows.length; i++) {
            markdown += '| ' + rows[i].join(' | ') + ' |\n';
        }
    }

    return markdown + '\n';
}

async function convertDocxToMarkdown(docxPath, outputPath) {
    try {
        console.log(`📄 Convirtiendo: ${path.basename(docxPath)}`);

        const options = {
            convertImage: mammoth.images.imgElement(async (image) => {
                const buffer = await image.read();
                const imageName = `${path.basename(outputPath, '.md')}_${Date.now()}.png`;
                const imagePath = path.join(IMAGES_DIR, imageName);

                fs.writeFileSync(imagePath, buffer);
                console.log(`  📷 Imagen extraída: ${imageName}`);

                return { src: `/kb-images/${imageName}` };
            }),
            styleMap: [
                "p[style-name='Heading 1'] => h1:fresh",
                "p[style-name='Heading 2'] => h2:fresh",
                "p[style-name='Heading 3'] => h3:fresh",
            ]
        };

        const result = await mammoth.convertToHtml({ path: docxPath }, options);
        let html = result.value;

        // Convertir tablas a Markdown
        html = html.replace(/<table[^>]*>.*?<\/table>/gis, (match) => {
            return convertTableToMarkdown(match);
        });

        // Convertir el resto de HTML a Markdown
        let markdown = htmlToMarkdown(html);

        // Guardar archivo
        fs.writeFileSync(outputPath, markdown, 'utf-8');
        console.log(`  ✅ Guardado: ${path.basename(outputPath)}\n`);

        if (result.messages.length > 0) {
            console.log('  ⚠️ Advertencias:', result.messages);
        }

        return true;
    } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('🚀 Iniciando conversión de archivos DOCX a Markdown...\n');

    if (!fs.existsSync(RAW_DOCS_DIR)) {
        console.error(`❌ Directorio no encontrado: ${RAW_DOCS_DIR}`);
        return;
    }

    const files = fs.readdirSync(RAW_DOCS_DIR).filter(file => file.endsWith('.docx'));

    console.log(`📚 Archivos encontrados: ${files.length}\n`);

    for (const file of files) {
        const docxPath = path.join(RAW_DOCS_DIR, file);
        const mdFilename = file.replace('.docx', '.md')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, ''); // Quitar acentos
        const outputPath = path.join(OUTPUT_DIR, mdFilename);

        await convertDocxToMarkdown(docxPath, outputPath);
    }

    console.log('✨ Conversión completada!\n');
    console.log('Siguiente paso: Ejecuta "node scripts/build-kb.js" para reconstruir la KB');
}

main();
