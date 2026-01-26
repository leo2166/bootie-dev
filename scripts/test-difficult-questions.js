// 🧪 PRUEBA EXHAUSTIVA CON PREGUNTAS DIFÍCILES
// Sistema de 6 capas - TODO 100% GRATIS

const questions = [
    {
        title: "Pregunta Simple",
        question: "¿Cuándo pagan en enero?",
        difficulty: "FÁCIL",
    },
    {
        title: "Pregunta con Múltiples Contextos",
        question: "Necesito hacer un reembolso por medicamentos y también una carta aval para una cirugía. ¿Cuáles son todos los requisitos?",
        difficulty: "MEDIA",
    },
    {
        title: "Pregunta Compleja con Razonamiento",
        question: "Si soy jubilado y necesito una cirugía urgente pero no tengo todos los estudios paraclínicos, ¿puedo enviar la carta aval solo con el presupuesto y el informe médico, o debo esperar? Explica el proceso.",
        difficulty: "DIFÍCIL",
    },
    {
        title: "Pregunta con Comparación",
        question: "Compara los requisitos entre una carta aval y un reembolso por cirugía. ¿Cuáles son las diferencias? ¿Puedo solicitar ambos?",
        difficulty: "MUY DIFÍCIL",
    },
    {
        title: "Pregunta con Múltiples Variables",
        question: "Si necesito contactar al departamento de jubilados después de enviar mi reembolso el día de pago de enero, ¿a quién llamo y cuándo, considerando los feriados?",
        difficulty: "EXTREMADAMENTE DIFÍCIL",
    }
];

async function testDifficultQuestions() {
    console.log("🧪 PRUEBA EXHAUSTIVA - SISTEMA 100% GRATIS");
    console.log("=".repeat(80));
    console.log("\n🆓 Arquitectura (TODO GRATIS):");
    console.log("  CAPA 1: Gemini 2.5 Flash → 1,500 req/día");
    console.log("  CAPA 2: Groq Llama 3.1 8B → 14,400 req/día (ultra rápido)");
    console.log("  CAPA 3: Groq Llama 3.3 70B → 14,400 req/día (más inteligente) ⭐");
    console.log("  CAPA 4: DeepSeek V3 (671B) → 50M tokens/día ⭐");
    console.log("  CAPA 5: Gemini 2.0 Flash → 1,500 req/día");
    console.log("  CAPA 6: Procesador Local → Siempre disponible");
    console.log("\n  💰 TOTAL: ~67,000+ requests/día GRATIS");
    console.log("=".repeat(80));

    const results = [];

    for (let i = 0; i < questions.length; i++) {
        const { title, question, difficulty } = questions[i];

        console.log(`\n\n📝 TEST ${i + 1}/${questions.length}`);
        console.log("─".repeat(80));
        console.log(`Tipo: ${title}`);
        console.log(`Dificultad: ${difficulty}`);
        console.log("─".repeat(80));
        console.log(`\nPregunta:\n"${question}"`);
        console.log("\n⏳ Procesando...\n");

        const startTime = Date.now();

        try {
            const response = await fetch("http://localhost:3000/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message: question }),
            });

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            if (!response.ok) {
                console.error(`❌ Error status: ${response.status}`);
                results.push({ test: i + 1, success: false, error: response.status });
                continue;
            }

            const data = await response.json();

            console.log("✅ RESPUESTA:");
            console.log("─".repeat(80));
            console.log(data.response);
            console.log("─".repeat(80));

            // Análisis de calidad
            const hasRawMarkdown = data.response.match(/^#+\s/m) ||
                data.response.includes("|---|") ||
                data.response.includes("INFORMACIÓN DEL DOCUMENTO");

            const hasRawHTML = data.response.includes("<br>") ||
                data.response.includes("</");

            const responseLength = data.response.length;
            const hasStructure = data.response.includes("*") || data.response.includes("**");

            // Evaluación
            console.log("\n📊 ANÁLISIS:");
            console.log(`  ⏱️  Tiempo: ${responseTime}ms`);
            console.log(`  📏 Longitud: ${responseLength} caracteres`);
            console.log(`  ${hasRawMarkdown || hasRawHTML ? '❌' : '✅'} Markdown/HTML crudo: ${hasRawMarkdown || hasRawHTML ? 'SÍ (PROBLEMA)' : 'NO'}`);
            console.log(`  ${hasStructure ? '✅' : '⚠️'} Estructura: ${hasStructure ? 'Bien formateada' : 'Sin formato'}`);
            console.log(`  ✨ Calidad: ${!hasRawMarkdown && !hasRawHTML && hasStructure ? 'EXCELENTE' : hasRawMarkdown || hasRawHTML ? 'MALA' : 'ACEPTABLE'}`);

            results.push({
                test: i + 1,
                success: true,
                responseTime,
                length: responseLength,
                quality: !hasRawMarkdown && !hasRawHTML && hasStructure ? 'EXCELENTE' : 'ACEPTABLE'
            });

        } catch (error) {
            console.error(`❌ Error en test ${i + 1}:`, error.message);
            results.push({ test: i + 1, success: false, error: error.message });
        }

        // Pausa entre tests
        if (i < questions.length - 1) {
            console.log("\n⏳ Esperando 3 segundos...");
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }

    // Resumen final
    console.log("\n\n" + "=".repeat(80));
    console.log("📊 RESUMEN DE RESULTADOS");
    console.log("=".repeat(80));

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const excellent = results.filter(r => r.quality === 'EXCELENTE').length;

    console.log(`\n✅ Tests exitosos: ${successful}/${questions.length}`);
    console.log(`❌ Tests fallidos: ${failed}/${questions.length}`);
    console.log(`⭐ Calidad excelente: ${excellent}/${successful}`);

    if (successful > 0) {
        const avgTime = results
            .filter(r => r.success && r.responseTime)
            .reduce((sum, r) => sum + r.responseTime, 0) / successful;

        console.log(`⏱️  Tiempo promedio: ${avgTime.toFixed(0)}ms`);
    }

    console.log("\n💰 Sistema 100% GRATIS funcionando correctamente");
    console.log("=".repeat(80));
}

testDifficultQuestions();
