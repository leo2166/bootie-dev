import fs from 'fs';
import path from 'path';
import { convertDocxToMarkdown, convertPdfToMarkdown, convertPptxToMarkdown, sanitizeFilename } from '../lib/converters';
import { buildKnowledgeBase } from '../lib/kb-builder';

const RAW_DOCS_DIR = path.join(process.cwd(), 'raw_docs');
const DOCUMENTS_DIR = path.join(process.cwd(), 'documents');
const KB_OUTPUT_FILE = path.join(process.cwd(), 'knowledge-base.json');

async function regenerateKnowledgeBase() {
    console.log('🔄 INICIANDO REGENERACIÓN COMPLETA DE KNOWLEDGE BASE');
    console.log('═'.repeat(60));

    // 1. Asegurar directorios
    if (!fs.existsSync(RAW_DOCS_DIR)) {
        console.error(`❌ No existe directorio raw_docs: ${RAW_DOCS_DIR}`);
        process.exit(1);
    }

    if (!fs.existsSync(DOCUMENTS_DIR)) {
        fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });
    }

    // 2. Procesar documentos
    const files = fs.readdirSync(RAW_DOCS_DIR);
    console.log(`📂 Encontrados ${files.length} archivos en raw_docs`);

    let convertedCount = 0;
    let errorCount = 0;

    for (const file of files) {
        if (file.startsWith('.')) continue;

        const filePath = path.join(RAW_DOCS_DIR, file);
        const ext = path.extname(file).toLowerCase();

        console.log(`\n📄 Procesando: ${file}`);

        try {
            const buffer = fs.readFileSync(filePath);
            let markdown = '';

            if (ext === '.docx') {
                markdown = await convertDocxToMarkdown(buffer);
            } else if (ext === '.pdf') {
                markdown = await convertPdfToMarkdown(buffer);
            } else if (ext === '.pptx' || ext === '.ppt') {
                console.warn('   ⚠️ PPTX omitido (soporte deshabilitado temporalmente)');
                continue;
            } else if (ext === '.txt' || ext === '.md') {
                markdown = buffer.toString('utf-8');
            } else {
                console.warn(`   ⚠️ Extensión no soportada: ${ext}`);
                continue;
            }

            if (!markdown || markdown.trim().length === 0) {
                console.warn('   ⚠️ La conversión resultó vacía. Omitiendo.');
                continue;
            }

            const safeName = sanitizeFilename(path.parse(file).name);
            const outputFilename = `${safeName}.md`;
            const outputPath = path.join(DOCUMENTS_DIR, outputFilename);

            fs.writeFileSync(outputPath, markdown, 'utf-8');
            console.log(`   ✅ Guardado en documents/${outputFilename} (${markdown.length} chars)`);
            convertedCount++;

        } catch (error: any) {
            console.error(`   ❌ Error convirtiendo ${file}:`, error.message);
            errorCount++;
        }
    }

    console.log('\n═'.repeat(60));
    console.log(`📊 Resumen de Conversión:`);
    console.log(`   - Convertidos: ${convertedCount}`);
    console.log(`   - Errores: ${errorCount}`);

    // 3. Construir JSON final
    console.log('\n🏗️  Construyendo base de conocimiento JSON...');

    const result = buildKnowledgeBase(DOCUMENTS_DIR, KB_OUTPUT_FILE);

    if (result.success) {
        console.log(`✅ ${result.message}`);
        console.log(`   Documentos indexados: ${result.stats?.documentCount}`);
    } else {
        console.error(`❌ Error construyendo KB: ${result.message}`);
    }

    console.log('\n✨ Proceso completado.');
}

regenerateKnowledgeBase().catch(console.error);
