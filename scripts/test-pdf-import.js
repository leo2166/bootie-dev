try {
    const pdfParse = require('pdf-parse/node');
    console.log('Success requiring pdf-parse/node');
    console.log('Type:', typeof pdfParse);
    console.log('Is function?', typeof pdfParse === 'function');
    if (typeof pdfParse === 'object') {
        console.log('Keys:', Object.keys(pdfParse));
        if (pdfParse.default) {
            console.log('Default type:', typeof pdfParse.default);
        }
    }
} catch (e) {
    console.error('Error requiring pdf-parse/node:', e.message);
}

console.log('---');

try {
    const pdfParseMain = require('pdf-parse');
    console.log('Success requiring pdf-parse (main)');
    if (typeof pdfParseMain === 'object') {
        console.log('Keys:', Object.keys(pdfParseMain));
    }
} catch (e) {
    console.error('Error requiring pdf-parse:', e.message);
}
