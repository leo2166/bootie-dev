
const fs = require('fs');
const path = require('path');

async function testUpload() {
    console.log('🚀 Iniciando prueba de upload manual...');

    const filePath = path.join(process.cwd(), 'dummy.txt');
    const fileContent = fs.readFileSync(filePath);
    const blob = new Blob([fileContent], { type: 'text/plain' });

    const formData = new FormData();
    formData.append('file', blob, 'dummy.txt');

    const auth = btoa('admin:bootie2026');

    try {
        console.log('Enviando request a http://localhost:3001/api/admin/upload ...');
        const res = await fetch('http://localhost:3001/api/admin/upload', {
            method: 'POST',
            headers: {
                'X-Admin-Auth': auth
            },
            body: formData
        });

        console.log(`Status: ${res.status} ${res.statusText}`);

        const text = await res.text();
        console.log('Respuesta:', text);

    } catch (error) {
        console.error('❌ Error en el fetch:', error);
    }
}

testUpload();
