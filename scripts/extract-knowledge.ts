import { buildKnowledgeBase } from '../lib/kb-builder';
import path from 'path';

const docsDir = path.join(process.cwd(), 'data', 'documents');
const outputFile = path.join(process.cwd(), 'data', 'knowledge-base.json');

console.log('🔄 Extrayendo y Reconstruyendo Base de Conocimientos...');
const result = buildKnowledgeBase(docsDir, outputFile);

if (result.success) {
    console.log(`✅ ${result.message}`);
    if (result.stats) {
        console.log(`📊 Documentos procesados: ${result.stats.documentCount}`);
    }
} else {
    console.error(`❌ Error: ${result.message}`);
    process.exit(1);
}
