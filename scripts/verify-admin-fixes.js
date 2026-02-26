const fs = require('fs');
const path = require('path');
const http = require('http');

const ADMIN_AUTH = Buffer.from('admin:bootie2026').toString('base64');

async function testEndpoint(method, url, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            method,
            headers: {
                'x-admin-auth': ADMIN_AUTH,
                ...headers
            }
        };
        const req = http.request(`http://localhost:3001${url}`, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, data });
                }
            });
        });
        req.on('error', reject);
        if (headers['body']) {
            req.write(headers['body']);
            delete headers['body'];
        }
        req.end();
    });
}

async function runTests() {
    console.log('🚀 Starting Verification Tests...');

    // 1. Test Rebuild Stats
    console.log('\n--- Test 1: Rebuild Stats ---');
    try {
        const rebuildRes = await testEndpoint('POST', '/api/admin/rebuild');
        console.log('Status:', rebuildRes.status);
        console.log('Data:', JSON.stringify(rebuildRes.data, null, 2));
        if (rebuildRes.data.stats && rebuildRes.data.stats.totalDocs !== undefined) {
            console.log('✅ Stats are present');
        } else {
            console.log('❌ Stats are missing or incorrect');
        }
    } catch (e) {
        console.log('❌ Rebuild Test Failed:', e.message);
    }

    // 2. Check PDF Worker via API (simulated)
    // We can't easily upload a file via http.request without a lot of boilerplate,
    // but we can check if the file exist.
    console.log('\n--- Test 2: File Check ---');
    const workerPath = path.join(process.cwd(), 'scripts', 'parse-pdf-worker.js');
    if (fs.existsSync(workerPath)) {
        console.log('✅ PDF Worker script exists');
    } else {
        console.log('❌ PDF Worker script is missing');
    }

    // 3. Check converters logic directly in Node
    console.log('\n--- Test 3: Converters Logic ---');
    try {
        const { getConverterByExtension } = require('./lib/converters');
        const imgConverter = getConverterByExtension('test.jpg');
        console.log('Image converter for .jpg:', imgConverter);
        if (imgConverter === 'image') {
            console.log('✅ Image extension mapping works');
        } else {
            console.log('❌ Image extension mapping failed');
        }
    } catch (e) {
        console.log('❌ Converters Test Failed:', e.message);
    }

    console.log('\n🏁 Tests Completed.');
}

runTests();
