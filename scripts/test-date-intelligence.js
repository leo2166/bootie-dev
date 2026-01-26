// Script para probar las consultas inteligentes de fechas
const testQueries = [
    {
        name: "Pregunta genérica (debe mostrar solo enero)",
        query: "¿Cuándo pagan?"
    },
    {
        name: "Pregunta con mes específico (enero)",
        query: "¿Cuándo pagan en enero?"
    },
    {
        name: "Pregunta con mes específico (febrero)",
        query: "¿Cuándo pagan en febrero?"
    },
    {
        name: "Pregunta por mes sin datos",
        query: "¿Cuándo pagan en marzo?"
    }
];

async function testDateIntelligence() {
    console.log("🧪 PRUEBA DE INTELIGENCIA DE FECHAS\n");
    console.log("═".repeat(70));
    console.log("Objetivo: Verificar que Bootie solo muestre el mes relevante\n");

    for (const test of testQueries) {
        console.log(`\n📝 ${test.name}`);
        console.log(`Pregunta: "${test.query}"`);
        console.log("─".repeat(70));

        try {
            const response = await fetch("http://localhost:3000/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message: test.query }),
            });

            if (!response.ok) {
                console.error(`❌ Error status: ${response.status}`);
                continue;
            }

            const data = await response.json();
            console.log("✅ Respuesta:");
            console.log(data.response);

            // Validaciones
            const mentionsEnero = data.response.toLowerCase().includes("enero");
            const mentionsFebrero = data.response.toLowerCase().includes("febrero");
            const mentionsMarzo = data.response.toLowerCase().includes("marzo");
            const showsFullYear = (mentionsEnero && mentionsFebrero); // Si menciona múltiples meses

            console.log("\n📊 Análisis:");
            if (test.query.includes("marzo")) {
                console.log(`   ${mentionsMarzo ? '⚠️' : '✅'} Debe indicar que no tiene info de marzo`);
            } else if (test.query.includes("febrero")) {
                console.log(`   ${mentionsFebrero && !mentionsEnero ? '✅' : '⚠️'} Debe mostrar SOLO febrero`);
            } else {
                console.log(`   ${mentionsEnero && !showsFullYear ? '✅' : '⚠️'} Debe mostrar SOLO enero (mes actual)`);
            }

            if (showsFullYear && !test.query.includes("febrero")) {
                console.log("   ⚠️  ADVERTENCIA: Está mostrando múltiples meses");
            }

        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
        }

        // Pausa entre tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log("\n" + "═".repeat(70));
    console.log("✅ Prueba de inteligencia de fechas completada\n");
}

testDateIntelligence();
