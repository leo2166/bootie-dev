const fs = require('fs');
const path = require('path');

// Mocking the KB builder logic since it's in TS and hard to require directly if not compiled
// Converting the core logic of lib/kb-builder.ts to JS here

const DOCUMENTS_DIR = path.join(process.cwd(), 'documents');
const OUTPUT_FILE = path.join(process.cwd(), 'public', 'kb.json');

const MESES = ['genero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function getKeywords(text, filename) {
    const keywords = [];
    const lowerText = text.toLowerCase();
    const lowerFilename = filename.toLowerCase();

    // Keywords logic from kb-builder.ts
    if (lowerText.includes('nomina') || lowerFilename.includes('nomina')) keywords.push('nomina');
    if (lowerText.includes('recibo') || lowerFilename.includes('recibo')) keywords.push('recibo');

    // Meses
    MESES.forEach(mes => {
        if (lowerText.includes(mes) || lowerFilename.includes(mes)) keywords.push(mes);
    });

    // Years
    const yearMatch = lowerFilename.match(/20\d{2}/) || lowerText.match(/20\d{2}/);
    if (yearMatch) keywords.push(yearMatch[0]);

    return [...new Set(keywords)];
}

async function buildKB() {
    if (!fs.existsSync(DOCUMENTS_DIR)) {
        console.error('Documents directory not found');
        return;
    }

    const files = fs.readdirSync(DOCUMENTS_DIR).filter(f => f.endsWith('.md'));
    const documents = [];

    for (const file of files) {
        const content = fs.readFileSync(path.join(DOCUMENTS_DIR, file), 'utf-8');
        // Extract title from YAML frontmatter or filename
        let title = path.basename(file, '.md');
        const titleMatch = content.match(/^title:\s*(.+)$/m);
        if (titleMatch) title = titleMatch[1].trim();

        const keywords = getKeywords(content, file);

        documents.push({
            id: file.replace('.md', ''),
            title,
            content, // In a real app we might strip frontmatter, but for now we keep it
            keywords,
            date: new Date().toISOString()
        });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(documents, null, 2));
    console.log(`KB built with ${documents.length} documents at ${OUTPUT_FILE}`);
}

buildKB();
