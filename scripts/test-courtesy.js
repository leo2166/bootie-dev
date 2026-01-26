// Script para probar las nuevas respuestas de cortesía
const testMessages = [
    { type: "Saludo", message: "Hola" },
    { type: "Agradecimiento", message: "Gracias" },
    { type: "Agradecimiento 2", message: "Muchas gracias por la información" },
    { type: "Despedida", message: "Chao" },
    { type: "Despedida 2", message: "Hasta luego" },
    { type: "Despedida 3", message: "Nos vemos" }
];

async function testCourtesyResponses() {
    console.log("🧪 PRUEBA DE RESPUESTAS DE CORTESÍA\n");
    console.log("═".repeat(70));

    for (const test of testMessages) {
        console.log(`\n📝 ${test.type}: "${test.message}"`);
        console.log("─".repeat(70));

        try {
            const response = await fetch("http://localhost:3000/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message: test.message }),
            });

            if (!response.ok) {
                console.error(`❌ Error status: ${response.status}`);
                continue;
            }

            const data = await response.json();
            console.log("✅ Respuesta:");
            console.log(`   ${data.response}`);

            // Validar que sea la respuesta esperada
            if (test.type.includes("Agradecimiento") && data.response.includes("para servir")) {
                console.log("   ✨ Respuesta correcta de agradecimiento");
            } else if (test.type.includes("Despedida") && data.response.includes("Nos vemos")) {
                console.log("   ✨ Respuesta correcta de despedida");
            } else if (test.type === "Saludo" && data.response.includes("Bootie")) {
                console.log("   ✨ Respuesta correcta de saludo");
            }

        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
        }

        // Pausa pequeña entre tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log("\n" + "═".repeat(70));
    console.log("✅ Prueba de cortesía completada\n");
}

testCourtesyResponses();
