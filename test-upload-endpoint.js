const fs = require('fs');
const path = require('path');

async function testUpload() {
    const filePath = path.join(__dirname, 'raw_docs', 'test-documento-prueba.md');

    console.log('📤 Testing upload endpoint...');
    console.log(`📁 File: ${filePath}`);

    if (!fs.existsSync(filePath)) {
        console.error('❌ File not found!');
        return;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const fileName = 'test-documento-prueba.md';

    console.log(`📊 File size: ${fileBuffer.length} bytes`);

    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    formData.append('file', blob, fileName);

    const credentials = Buffer.from('admin:bootie2026').toString('base64');

    try {
        const response = await fetch('http://localhost:3000/api/admin/upload?skipRebuild=true', {
            method: 'POST',
            headers: {
                'x-admin-auth': credentials,
            },
            body: formData
        });

        const text = await response.text();
        try {
            const data = JSON.parse(text);
            if (response.ok) {
                console.log('✅ SUCCESS!');
                console.log('Response:', JSON.stringify(data, null, 2));
            } else {
                console.log('❌ ERROR - Status:', response.status);
                console.log('Response:', JSON.stringify(data, null, 2));
            }
        } catch(e) {
            console.log('❌ ERROR PARSING JSON - Status:', response.status);
            console.log('Raw response:', text.substring(0, 500));
        }
    } catch (error) {
        console.error('❌ Request failed:', error.message);
    }
}

testUpload();
