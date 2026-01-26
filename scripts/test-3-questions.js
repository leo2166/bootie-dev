// Prueba exhaustiva de las 3 preguntas mencionadas por el usuario
const questions = [
    "¿Cuáles son los requisitos para el reembolso de medicamentos?",
    "¿Dónde puedo contactar al departamento de jubilados?",
    "¿Cuándo pagan la nómina en enero 2026?"
];

async function testMultipleQuestions() {
    console.log("🧪 PRUEBA EXHAUSTIVA: Testeando las 3 preguntas del problema original\n");
    console.log("=".repeat(70));

    for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        console.log(`\n📝 PREGUNTA ${i + 1}/${questions.length}: ${question}`);
        console.log("-".repeat(70));

        try {
            const response = await fetch("http://localhost:3000/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message: question }),
            });

            if (!response.ok) {
                console.error(`❌ Error status: ${response.status}`);
                continue;
            }

            const data = await response.json();
            console.log("\n✅ RESPUESTA:");
            console.log(data.response);

            // Validación de calidad
            const hasRawMarkdown = data.response.match(/^#+\s/m) ||
                data.response.includes("|---|") ||
                data.response.includes("INFORMACIÓN DEL DOCUMENTO");

            const hasRawHTML = data.response.includes("<br>") ||
                data.response.includes("</");

            if (hasRawMarkdown || hasRawHTML) {
                console.log("\n⚠️  PROBLEMA DETECTADO: Contiene markdown/HTML crudo!");
            } else {
                console.log("\n✨ CALIDAD: Respuesta procesada correctamente");
            }

        } catch (error) {
            console.error(`❌ Error en pregunta ${i + 1}:`, error.message);
        }

        // Pausa entre preguntas
        if (i < questions.length - 1) {
            console.log("\n⏳ Esperando 2 segundos antes de la siguiente pregunta...");
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    console.log("\n" + "=".repeat(70));
    console.log("✅ Prueba exhaustiva completada");
}

testMultipleQuestions();
