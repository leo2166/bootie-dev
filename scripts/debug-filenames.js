
const fs = require('fs');
const path = require('path');

const dir = path.join(process.cwd(), 'documents');

if (!fs.existsSync(dir)) {
    console.log('Directorio documents no existe');
} else {
    const files = fs.readdirSync(dir);
    console.log(`Encontrados ${files.length} archivos:`);
    files.forEach(f => {
        console.log(`- "${f}"`);
        console.log('  Hex:', Buffer.from(f).toString('hex'));
        console.log('  Codes:', f.split('').map(c => c.charCodeAt(0)));
    });
}
