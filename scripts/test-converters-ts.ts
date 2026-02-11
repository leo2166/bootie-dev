import fs from 'fs';
import path from 'path';
import { convertDocxToMarkdown, convertPdfToMarkdown, convertPptxToMarkdown } from '../lib/converters';

const RAW_DOCS_DIR = path.join(process.cwd(), 'raw_docs');

async function testConverters() {
    console.log('🧪 Iniciando prueba de conversores con archivos en:', RAW_DOCS_DIR);

    if (!fs.existsSync(RAW_DOCS_DIR)) {
        console.error('❌ Directorio raw_docs no encontrado');
        return;
    }

    const files = fs.readdirSync(RAW_DOCS_DIR);
    console.log(`📂 Encontrados ${files.length} archivos para probar.`);

    for (const file of files) {
        if (file.startsWith('.')) continue; // Ignorar archivos ocultos

        const filePath = path.join(RAW_DOCS_DIR, file);
        const stats = fs.statSync(filePath);

        console.log(`\n📄 Probando: ${file} (${(stats.size / 1024).toFixed(2)} KB)`);

        try {
            const buffer = fs.readFileSync(filePath);
            const ext = path.extname(file).toLowerCase();

            let result = '';
            const start = Date.now();

            if (ext === '.docx') {
                result = await convertDocxToMarkdown(buffer);
            } else if (ext === '.pdf') {
                result = await convertPdfToMarkdown(buffer);
            } else if (ext === '.pptx') {
                try {
                    result = await convertPptxToMarkdown(buffer);
                } catch (e: any) {
                    console.error(`❌ Error esperado en PPTX (aún no soportado): ${e.message}`);
                    continue;
                }
            } else {
                console.log('⚠️ Tipo de archivo no soportado para prueba automática');
                continue;
            }

            const duration = Date.now() - start;
            console.log(`✅ Conversión exitosa en ${duration}ms`);
            console.log(`📝 Longitud del contenido: ${result.length} caracteres`);
            console.log(`🔍 Vista previa: ${result.substring(0, 100).replace(/\n/g, ' ')}...`);

            if (result.length < 50) {
                console.warn('⚠️ ALERTA: El contenido extraído es muy corto.');
            }

        } catch (error: any) {
            console.error(`❌ FALLÓ conversión de ${file}:`, error.message);
        }
    }
}

testConverters().catch(console.error);
