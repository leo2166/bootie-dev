import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

async function testNetwork() {
    console.log("IPv4 Forzado. Probando red...");

    try {
        console.log("1. Probando google.com...");
        const res1 = await fetch("https://www.google.com");
        console.log(`✅ Google.com OK: ${res1.status}`);
    } catch (e: any) {
        console.log(`❌ Google.com ERROR: ${e.message}`);
    }

    try {
        console.log("2. Probando API Gemini...");
        const res2 = await fetch("https://generativelanguage.googleapis.com");
        console.log(`✅ API Gemini OK: ${res2.status}`);
    } catch (error: any) {
        console.error("❌ API Gemini ERROR:");
        console.error(error.message);
        if (error.cause) console.error("Causa:", error.cause);
    }
}

testNetwork();
