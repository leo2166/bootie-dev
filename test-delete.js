const fs = require('fs');
const path = require('path');

const documentsDir = path.join(process.cwd(), 'documents');
const filename = 'nomina-marzo-2026.md';
const filePath = path.join(documentsDir, filename);

console.log('📂 Documents Dir:', documentsDir);
console.log('📄 Target File:', filename);
console.log('📍 Full Path:', filePath);

try {
    if (fs.existsSync(filePath)) {
        console.log('✅ File exists!');
        const stats = fs.statSync(filePath);
        console.log('📊 File stats:', JSON.stringify(stats, null, 2));

        console.log('🗑️ Attempting delete...');
        fs.unlinkSync(filePath);
        console.log('✅ File deleted successfully!');
    } else {
        console.log('❌ File does NOT exist!');

        console.log('📂 Listing directory contents:');
        const files = fs.readdirSync(documentsDir);
        files.forEach(f => {
            console.log(` - "${f}" (${f.length} chars)`);
            if (f.includes('nomina-marzo')) {
                console.log('   MATCH FOUND but maybe hidden chars?');
                console.log('   Char codes:', f.split('').map(c => c.charCodeAt(0)));
            }
        });
    }
} catch (error) {
    console.error('💥 Error:', error);
}
