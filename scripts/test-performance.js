// Script para medir tiempo de respuesta de cada capa
const queries = [
    "hola",
    "¿cuando pagan?",
    "requisitos para reembolsos"
];

async function testPerformance() {
    console.log("🧪 Prueba de Performance - Bootie Chat API\n");

    for (const query of queries) {
        console.log(`\n📝 Query: "${query}"`);
        console.log("─".repeat(60));

        const startTime = Date.now();

        try {
            const response = await fetch("http://localhost:3000/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message: query }),
            });

            const endTime = Date.now();
            const totalTime = endTime - startTime;

            if (!response.ok) {
                console.error("❌ Error status:", response.status);
                const text = await response.text();
                console.error("Error body:", text);
                continue;
            }

            const data = await response.json();

            console.log(`⏱️  Tiempo total: ${totalTime}ms`);
            console.log(`📊 Largo de respuesta: ${data.response?.length || 0} caracteres`);
            console.log(`✅ Status: ${response.status}`);

            // Analizar si fue greeting rápido o procesamiento completo
            if (totalTime < 100) {
                console.log(`🚀 OPTIMIZADO (Respuesta predefinida)`);
            } else if (totalTime < 2000) {
                console.log(`⚡ RÁPIDO (Probablemente Capa 1-2)`);
            } else if (totalTime < 5000) {
                console.log(`🟡 NORMAL (Probablemente Capa 3-4)`);
            } else {
                console.log(`🔴 LENTO (Probablemente Capa 5-6 o red lenta)`);
            }

        } catch (error) {
            console.error("❌ Fetch error:", error.message);
        }
    }

    console.log("\n" + "═".repeat(60));
    console.log("✅ Prueba completada");
}

testPerformance();
