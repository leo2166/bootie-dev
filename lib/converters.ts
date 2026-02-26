// Polyfill para evitar error "DOMMatrix is not defined" en pdf-parse
if (typeof global.DOMMatrix === 'undefined') {
    (global as any).DOMMatrix = class DOMMatrix {
        constructor() { }
        toString() { return 'matrix(1, 0, 0, 1, 0, 0)'; }
    };
}

import fs from 'fs';
import path from 'path';
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');
// pdf-parse logic moved to child process

const IMAGES_DIR = path.join(process.cwd(), 'public/kb-images');

// Asegurar que directorio de imágenes existe
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Función para convertir HTML a Markdown limpio
function htmlToMarkdown(html: string): string {
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

    // Convertir imágenes (soportando comillas dobles y simples)
    md = md.replace(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi, '![Imagen]($1)\n');

    // Limpiar <br>
    md = md.replace(/<br\s*\/?>/gi, '\n');

    // Limpiar divs y spans
    md = md.replace(/<\/?div[^>]*>/gi, '');
    md = md.replace(/<\/?span[^>]*>/gi, '');

    // Limpiar múltiples líneas vacías
    md = md.replace(/\n{3,}/g, '\n\n');

    return md.trim();
}

// Función para convertir tablas HTML a Markdown (ES2015 Compatible)
function convertTableToMarkdown(html: string): string {
    const rows: string[][] = [];
    // Usamos [\s\S] en lugar de . con flag /s para compatibilidad
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch;

    while ((rowMatch = rowRegex.exec(html)) !== null) {
        const rowContent = rowMatch[1];
        const cells: string[] = [];

        const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
        let cellMatch;

        while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
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

    let markdown = '\n';
    if (rows.length > 0) {
        markdown += '| ' + rows[0].join(' | ') + ' |\n';
        markdown += '|' + rows[0].map(() => '---').join('|') + '|\n';
        for (let i = 1; i < rows.length; i++) {
            markdown += '| ' + rows[i].join(' | ') + ' |\n';
        }
    }
    return markdown + '\n';
}

/**
 * Convierte un buffer de archivo DOCX a Markdown usando estrategia DOCX->HTML->Markdown
 * Soporta imágenes y tablas
 */
export async function convertDocxToMarkdown(buffer: Buffer): Promise<string> {
    try {
        console.log('🔄 Iniciando conversión avanzada DOCX->HTML->MD');

        const options = {
            convertImage: mammoth.images.imgElement(async (image: any) => {
                const imgBuffer = await image.read();
                const imageFileName = `upload_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
                const imagePath = path.join(IMAGES_DIR, imageFileName);

                fs.writeFileSync(imagePath, imgBuffer);
                console.log(`  📷 Imagen extraída: ${imageFileName}`);

                return { src: `/kb-images/${imageFileName}` };
            }),
            styleMap: [
                "p[style-name='Heading 1'] => h1:fresh",
                "p[style-name='Heading 2'] => h2:fresh",
                "p[style-name='Heading 3'] => h3:fresh",
            ]
        };

        const result = await mammoth.convertToHtml({ buffer }, options);
        let html = result.value;

        // Convertir tablas a Markdown
        html = html.replace(/<table[^>]*>.*?<\/table>/gis, (match: string) => {
            return convertTableToMarkdown(match);
        });

        // Convertir el resto de HTML a Markdown
        let text = htmlToMarkdown(html);

        // Limpieza adicional de anclas vacías que Mammoth a veces deja
        text = text.replace(/<a\s+id="[^"]*"><\/a>/g, '');
        text = text.trim();

        // Verificación estricta de contenido visible (sin tags HTML)
        const visibleText = text.replace(/<[^>]*>/g, '').replace(/\s+/g, '').trim();
        const hasImages = text.includes('![Imagen]') || html.includes('<img');

        // Si hay muy poco texto Y no hay imágenes, intentamos sacar texto crudo
        if (visibleText.length < 50 && !hasImages) {
            console.log('⚠️ Contenido HTML insuficiente y sin imágenes, intentando raw text...');
            const rawResult = await mammoth.extractRawText({ buffer });
            const rawText = rawResult.value.trim();

            // Si el texto crudo es mejor que nada, lo usamos
            if (rawText.length > visibleText.length) {
                text = rawText;
            }
        }

        // SALVAGUARDA FINAL: Nunca lanzar error 500 por contenido vacío
        // Retornar información de depuración para ver qué está pasando
        if (text.length === 0 && !hasImages) {
            console.warn('⚠️ Documento aparentemente vacío. Retornando debug info.');

            // Recopilar mensajes de mammoth
            const mammothMessages = result.messages.map((m: any) => `[${m.type}] ${m.message}`).join('\n- ');

            return `> **AVISO DEL SISTEMA**: El documento parece no tener texto ni imágenes reconocibles.
> Esto puede suceder si el documento contiene tablas complejas, cuadros de texto flotantes, imágenes en formatos no estándar o es un escaneo pegado en Word.

### Solución Recomendada:
1. **Guarde este archivo como PDF** (Archivo > Guardar como > PDF).
2. **Suba el PDF resultante** (el sistema procesa mejor los PDF complejos).

### Debug Info:
- HTML Length: ${html.length}
- Visible Text Length: ${visibleText.length}
- Raw Text Attempted: ${visibleText.length < 50 ? 'Yes' : 'No'}
- Mammoth Messages: 
${mammothMessages ? '- ' + mammothMessages : '- (Ninguno)'}

### HTML Start:
\`${html.substring(0, 500).replace(/`/g, "'")}...\``;
        }

        return text;
    } catch (error: any) {
        console.error('Error converting DOCX:', error);
        // Incluir el stack o mensaje original para debug
        throw new Error(`Failed to convert DOCX to Markdown: ${error.message} - ${error.stack}`);
    }
}

/**
 * Convierte un buffer de archivo PPTX a Markdown
 * @deprecated Temporalmente deshabilitado por problemas de compatibilidad con mammoth
 */
export async function convertPptxToMarkdown(buffer: Buffer): Promise<string> {
    console.warn('⚠️ Intento de conversión PPTX bloqueado (soporte temporalmente deshabilitado)');
    throw new Error('El soporte para archivos PPTX está temporalmente deshabilitado. Por favor, convierta su presentación a PDF o DOCX e intente nuevamente.');
}

/**
 * Convierte un buffer de archivo PDF a Markdown
 */
// Standalone worker workaround to avoid Next.js/Turbopack bundling issues with pdfjs-dist
export async function convertPdfToMarkdown(buffer: Buffer): Promise<string> {
    const { spawn } = require('child_process');
    const path = require('path');
    const fs = require('fs');
    const os = require('os');

    const tempFile = path.join(os.tmpdir(), `upload-${Date.now()}.pdf`);
    fs.writeFileSync(tempFile, buffer);

    return new Promise((resolve, reject) => {
        const workerScript = path.join(process.cwd(), 'scripts/parse-pdf-worker.js');
        const child = spawn('node', [workerScript, tempFile]);

        let output = '';
        let errorOutput = '';

        child.stdout.on('data', (data: any) => {
            output += data.toString();
        });

        child.stderr.on('data', (data: any) => {
            errorOutput += data.toString();
        });

        child.on('close', (code: number) => {
            // Cleanup temp file
            try { fs.unlinkSync(tempFile); } catch (e) { }

            if (code !== 0) {
                // Try to parse error output as JSON if possible
                try {
                    const errJson = JSON.parse(errorOutput);
                    reject(new Error(errJson.error || 'PDF Parse Error'));
                } catch {
                    reject(new Error(`PDF Worker failed: ${errorOutput || 'Unknown error'}`));
                }
                return;
            }

            try {
                const result = JSON.parse(output);
                const text = result.text.replace(/\n{3,}/g, '\n\n').trim();

                if (text.length === 0) {
                    console.warn('⚠️ PDF convertido resultó en texto vacío');
                }
                resolve(text);
            } catch (e: any) {
                reject(new Error(`Failed to parse worker output: ${e.message}`));
            }
        });
    });
}

/**
 * Convierte un buffer de imagen (JPG/PNG) a Markdown usando Tesseract OCR
 */
export async function convertImageToMarkdown(buffer: Buffer): Promise<string> {
    try {
        console.log('🔄 Iniciando OCR con Tesseract.js...');
        const result = await Tesseract.recognize(buffer, 'spa', {
            logger: (m: any) => console.log(`  👁️ OCR Progress: ${m.status} (${(m.progress * 100).toFixed(0)}%)`)
        });

        const text = result.data.text.trim();

        if (text.length < 10) {
            return `> **AVISO**: Se procesó la imagen pero el texto extraído es muy corto o ilegible.\n\nContenido extraído:\n${text}`;
        }

        return `## [Texto extraído de imagen]\n\n${text}`;
    } catch (error: any) {
        console.error('Error in OCR:', error);
        throw new Error(`Failed to process image with OCR: ${error.message}`);
    }
}

/**
 * Sanitiza un nombre de archivo para evitar problemas de seguridad
 */
export function sanitizeFilename(filename: string): string {
    return filename
        .toLowerCase()
        .replace(/[^a-z0-9.\-_\s]/g, '')
        .replace(/\s+/g, '-')
        .replace(/\.{2,}/g, '.')
        .replace(/^\.+/, '')
        .substring(0, 200);
}

/**
 * Determina el tipo de conversión necesaria según la extensión
 */
export function getConverterByExtension(filename: string): 'docx' | 'pptx' | 'pdf' | 'txt' | 'md' | 'image' | null {
    const ext = filename.toLowerCase().split('.').pop();
    const mapping: Record<string, 'docx' | 'pptx' | 'pdf' | 'txt' | 'md' | 'image'> = {
        'docx': 'docx', 'doc': 'docx',
        // 'pptx': 'pptx', 'ppt': 'pptx', // Deshabilitado temporalmente
        'pdf': 'pdf',
        'txt': 'txt',
        'md': 'md', 'markdown': 'md',
        'jpg': 'image', 'jpeg': 'image', 'png': 'image'
    };
    return mapping[ext || ''] || null;
}
