
const fs = require('fs');
const path = require('path');

const fileToDelete = 'nomina-marzo-2026.md';
const filePath = path.join(process.cwd(), 'documents', fileToDelete);

console.log(`Buscando archivo: ${filePath}`);

if (fs.existsSync(filePath)) {
    try {
        fs.unlinkSync(filePath);
        console.log(`✅ Archivo ${fileToDelete} eliminado correctamente.`);
    } catch (e) {
        console.error(`❌ Error al eliminar ${fileToDelete}:`, e);
    }
} else {
    console.log(`⚠️ El archivo ${fileToDelete} no existe en disco.`);
}
