const { PDFParse } = require('pdf-parse');

console.log('PDFParse static properties:', Object.keys(PDFParse));
console.log('PDFParse.setWorker exists?', typeof PDFParse.setWorker);
console.log('PDFParse.disableWorker exists?', typeof PDFParse.disableWorker);
