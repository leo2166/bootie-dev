
try {
    const mammoth = require('mammoth');
    console.log('✅ Mammoth loaded successfully');
    if (typeof mammoth.convertToMarkdown === 'function') {
        console.log('✅ Mammoth convertToMarkdown is a function');
    } else {
        console.error('❌ Mammoth convertToMarkdown is NOT a function');
    }

    const pdfParse = require('pdf-parse');
    console.log('✅ pdf-parse loaded successfully');

} catch (error) {
    console.error('❌ Error loading modules:', error);
}
