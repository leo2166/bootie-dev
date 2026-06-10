const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun } = require('docx');

async function createAndUploadDocx() {
    // 1. Create a dummy docx
    console.log('📝 Creating dummy docx...');
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    children: [
                        new TextRun("Hello World"),
                        new TextRun({
                            text: "This is a test DOCX document.",
                            bold: true,
                        }),
                    ],
                }),
            ],
        }],
    });

    const buffer = await Packer.toBuffer(doc);
    const filePath = path.join(__dirname, 'raw_docs', 'dummy_test.docx');
    fs.writeFileSync(filePath, buffer);
    console.log('✅ Dummy docx created at:', filePath);

    // 2. Upload the dummy docx to the local dev server
    console.log('📤 Uploading docx...');
    const fileName = 'dummy_test.docx';
    
    const formData = new FormData();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    formData.append('file', blob, fileName);

    const credentials = Buffer.from('admin:bootie2026').toString('base64');

    try {
        const response = await fetch('http://localhost:3000/api/admin/upload', {
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
                console.log('✅ UPLOAD SUCCESS!');
                console.log('Response Phase 1:', JSON.stringify(data, null, 2));

                // 3. Test Rebuild (Phase 2)
                console.log('🔄 Testing Phase 2 (Rebuild)...');
                const rebuildRes = await fetch('http://localhost:3000/api/admin/rebuild', {
                    method: 'POST',
                    headers: { 'x-admin-auth': credentials }
                });
                const rebuildText = await rebuildRes.text();
                try {
                    const rebuildData = JSON.parse(rebuildText);
                    if (rebuildRes.ok) {
                        console.log('✅ REBUILD SUCCESS!');
                        console.log('Rebuild Response:', JSON.stringify(rebuildData, null, 2));
                    } else {
                        console.log('❌ REBUILD ERROR - Status:', rebuildRes.status);
                        console.log('Rebuild Response:', JSON.stringify(rebuildData, null, 2));
                    }
                } catch(e) {
                    console.log('❌ REBUILD ERROR PARSING JSON - Status:', rebuildRes.status);
                    console.log('Raw rebuild response:', rebuildText.substring(0, 500));
                }

            } else {
                console.log('❌ UPLOAD ERROR - Status:', response.status);
                console.log('Response:', JSON.stringify(data, null, 2));
            }
        } catch(e) {
            console.log('❌ UPLOAD ERROR PARSING JSON - Status:', response.status);
            console.log('Raw upload response:', text.substring(0, 500));
        }
    } catch (error) {
        console.error('❌ Request failed:', error.message);
    }
}

createAndUploadDocx();
