const fs = require('fs');
const pdf = require('pdf-parse');

async function parsePdf(filePath) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        
        // El resultado se envía a stdout como JSON
        process.stdout.write(JSON.stringify({
            text: data.text,
            info: data.info,
            metadata: data.metadata,
            numpages: data.numpages
        }));
    } catch (error) {
        process.stderr.write(JSON.stringify({
            error: error.message
        }));
        process.exit(1);
    }
}

const filePath = process.argv[2];
if (!filePath) {
    process.stderr.write(JSON.stringify({ error: 'No file path provided' }));
    process.exit(1);
}

parsePdf(filePath);
