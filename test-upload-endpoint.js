const fs = require('fs');
const path = require('path');

async function testUpload() {
    const filePath = path.join(__dirname, 'raw_docs', 'Carta Aval.docx');

    console.log('📤 Testing upload endpoint...');
    console.log(`📁 File: ${filePath}`);

    // Verificar que el archivo existe
    if (!fs.existsSync(filePath)) {
        console.error('❌ File not found!');
        return;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const fileName = 'Carta Aval.docx';

    console.log(`📊 File size: ${fileBuffer.length} bytes`);

    // Crear FormData
    const FormData = require('formidable').formidable;
    const form = new FormData();

    // Preparar petición
    const credentials = Buffer.from('admin:bootie2026').toString('base64');

    try {
        const response = await fetch('http://localhost:3000/api/admin/upload', {
            method: 'POST',
            headers: {
                'x-admin-auth': credentials,
            },
            body: createMultipartBody(fileBuffer, fileName)
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ SUCCESS!');
            console.log('Response:', JSON.stringify(data, null, 2));
        } else {
            console.log('❌ ERROR - Status:', response.status);
            console.log('Response:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('❌ Request failed:', error.message);
    }
}

function createMultipartBody(fileBuffer, fileName) {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const parts = [];

    parts.push(`--${boundary}\r\n`);
    parts.push(`Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`);
    parts.push(`Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document\r\n\r\n`);
    parts.push(fileBuffer);
    parts.push(`\r\n--${boundary}--\r\n`);

    return Buffer.concat([
        Buffer.from(parts[0]),
        Buffer.from(parts[1]),
        Buffer.from(parts[2]),
        parts[3],
        Buffer.from(parts[4])
    ]);
}

testUpload();
