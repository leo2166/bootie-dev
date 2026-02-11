const { PDFParse } = require('pdf-parse');
const fs = require('fs');

const filePath = 'public/Nomina-Marzo-2026.pdf';

async function inspect() {
    try {
        const buffer = fs.readFileSync(filePath);
        const parser = new PDFParse({ data: buffer });
        // Get metadata and text
        const info = await parser.getInfo();
        const textData = await parser.getText();

        console.log('--- Metadata ---');
        console.log(JSON.stringify(info, null, 2));
        console.log('--- raw Text length ---');
        console.log(textData.text.length);
        console.log('--- First 200 chars ---');
        console.log(textData.text.substring(0, 200));

        await parser.destroy();
    } catch (error) {
        console.error('Error:', error);
    }
}

inspect();
