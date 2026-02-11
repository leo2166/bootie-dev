
const fs = require('fs');
const path = require('path');

// Simular el entorno de importación de converters.ts
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

console.log('✅ Mammoth:', typeof mammoth);
console.log('✅ pdf-parse:', typeof pdfParse);

try {
    const { convertDocxToMarkdown } = require('../lib/converters');
    console.log('✅ convertDocxToMarkdown importada:', typeof convertDocxToMarkdown);
} catch (e) {
    console.error('❌ Error importando converters:', e);
}
