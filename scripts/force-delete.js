
const fs = require('fs');
const path = require('path');

const target = 'nomina-abril-2026.md';
const filePath = path.join(process.cwd(), 'documents', target);

console.log(`Intentando borrar: ${filePath}`);

if (fs.existsSync(filePath)) {
    try {
        fs.unlinkSync(filePath);
        console.log('✅ Archivo borrado exitosamente desde script.');

        // También intentar regenerar KB para que quede limpio
        const { buildKnowledgeBase } = require('./lib/kb-builder');
        // Nota: esto puede fallar si kb-builder es TS y ejecutamos con node js, 
        // pero el borrado de archivo es lo importante.

    } catch (error) {
        console.error('❌ Error al borrar archivo:', error);
    }
} else {
    console.log('⚠️ El archivo no existe (¿ya se borró?)');
}
