const { PDFParse } = require('pdf-parse');
const fs = require('fs');

const [, , filePath] = process.argv;

if (!filePath) {
    console.error(JSON.stringify({ error: 'Usage: node parse-pdf-worker.js <filePath>' }));
    process.exit(1);
}

async function parse() {
    try {
        const buffer = fs.readFileSync(filePath);

        // Try standard text extraction
        let text = '';
        try {
            // Support both function and class usage for robustness
            const pdfParseLib = require('pdf-parse');
            let data;

            if (typeof pdfParseLib === 'function') {
                data = await pdfParseLib(buffer);
            } else if (pdfParseLib.PDFParse) {
                const parser = new pdfParseLib.PDFParse({ data: buffer });
                data = await parser.getText();
                await parser.destroy();
            } else {
                const parser = new pdfParseLib({ data: buffer });
                data = await parser.getText();
                await parser.destroy();
            }

            text = data.text || '';
        } catch (e) {
            console.error('PDF Parse Error:', e.message);
            // Return empty JSON with error message if critical
            console.log(JSON.stringify({ error: 'Parsing failed: ' + e.message }));
            process.exit(1);
        }

        const cleanText = text.replace(/\n{3,}/g, '\n\n').trim();

        // Check if text is mostly empty (likely scanned)
        if (!cleanText || cleanText.length < 10) {
            console.log(JSON.stringify({
                text: "Documento escaneado o sin capa de texto. El sistema extrajo muy poco contenido.\n\n" + (cleanText ? "Contenido parcial: " + cleanText : "")
            }));
            return;
        }

        console.log(JSON.stringify({ text: cleanText }));

    } catch (error) {
        console.error(JSON.stringify({ error: error.message }));
        process.exit(1);
    }
}

parse();
