const fs = require('fs');
const path = require('path');
// We will import the internal logic after we fix the converter
// For now, these are placeholders or direct logic if I can't import typescript easily in a JS script without ts-node
// But since this is a Next.js project with TS, running a TS script might need ts-node which might not be installed or configured.
// I will write a JS script that requires the transpiled output OR just implements the conversion logic directly using pdf-parse to test it, 
// then saves the files.
// actually, I can try to use the raw pdf-parse directly in this script to see if it works in pure Node vs Next.js.
// If it works here, it confirms the issue is Next.js bundling.

const { PDFParse } = require('pdf-parse');

const FILES = ['Nomina-Marzo-2026.pdf', 'Nomina Abril 2026.pdf'];
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const DOCS_DIR = path.join(process.cwd(), 'documents');

async function processFiles() {
    for (const file of FILES) {
        const filePath = path.join(PUBLIC_DIR, file);
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            continue;
        }

        console.log(`Processing ${file}...`);
        try {
            const buffer = fs.readFileSync(filePath);
            const parser = new PDFParse({ data: buffer });
            const data = await parser.getText();
            await parser.destroy();

            const text = data.text ? data.text.replace(/\n{3,}/g, '\n\n').trim() : '';

            if (!text) {
                console.warn(`Empty text for ${file}`);
            }

            const mdContent = `---
title: ${path.basename(file, '.pdf')}
date: ${new Date().toISOString()}
original: ${file}
---

${text}
`;
            const outPath = path.join(DOCS_DIR, file.replace('.pdf', '.md'));
            fs.writeFileSync(outPath, mdContent);
            console.log(`Saved markdown to ${outPath}`);
        } catch (error) {
            console.error(`Error processing ${file}:`, error);
        }
    }
}

processFiles();
