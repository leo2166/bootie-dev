import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import OpenAI from "openai";
import dns from 'node:dns';
import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

// Forzar IPv4 para evitar problemas con VPN/CANTV
dns.setDefaultResultOrder('ipv4first');

const apiKey = process.env.GOOGLE_API_KEY;
const groqApiKey = process.env.GROQ_API_KEY;
const openRouterApiKey = process.env.OPENROUTER_API_KEY;

if (!apiKey) {
    console.warn("⚠️ GOOGLE_API_KEY no está configurada (esto puede ser normal durante el build)");
}

const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;

// Gemma 3 27B via OpenRouter (más inteligente)
const gemma3 = openRouterApiKey ? new OpenAI({
    apiKey: openRouterApiKey,
    baseURL: "https://openrouter.ai/api/v1",
}) : null;

interface KnowledgeBase {
    sheets: {
        [key: string]: {
            titulo: string;
            contenido: string;
            keywords: string[];
        };
    };
    lastUpdated: string;
}

// Cargar la base de conocimiento
function loadKnowledgeBase(): KnowledgeBase | null {
    try {
        const kbPath = path.join(process.cwd(), "data", "knowledge-base.json");
        if (fs.existsSync(kbPath)) {
            const data = fs.readFileSync(kbPath, "utf-8");
            return JSON.parse(data);
        }
    } catch (e) {
        console.error("Error cargando knowledge base:", e);
    }
    return null;
}

// Normalizar texto: quitar acentos y pasar a minúsculas para comparación robusta
function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // elimina diacríticos (acentos)
}

// Buscar información relevante en la KB con scoring por relevancia
function findRelevantSections(query: string, kb: KnowledgeBase): string[] {
    const queryNorm = normalizeText(query);
    // Palabras de la consulta con 3+ caracteres
    const queryWords = queryNorm.split(/\s+/).filter(w => w.length >= 3);
    const scores: Array<{ key: string; score: number }> = [];

    for (const [key, sheet] of Object.entries(kb.sheets)) {
        let score = 0;

        // 1. Coincidencia exacta de keyword normalizada (mayor peso)
        for (const kw of sheet.keywords) {
            const kwNorm = normalizeText(kw);
            // Buscar como palabra completa usando espacios/inicio/fin (robusto con acentos)
            const escapedKw = kwNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pattern = new RegExp(`(^|\\s)${escapedKw}(\\s|$)`, 'i');
            if (pattern.test(queryNorm)) {
                score += 10;
            } else if (queryNorm.includes(kwNorm)) {
                // Coincidencia parcial (ej: "emergencias" contiene "emergencia")
                score += 5;
            }
        }

        // 2. Coincidencia por título normalizado
        const titleNorm = normalizeText(sheet.titulo);
        for (const word of queryWords) {
            if (titleNorm.includes(word)) {
                score += 5;
            }
        }

        // 3. Búsqueda directa en el contenido (respaldo crítico para evitar falsos negativos)
        const contentNorm = normalizeText(sheet.contenido);
        for (const word of queryWords) {
            if (word.length >= 4 && contentNorm.includes(word)) {
                score += 2;
            }
        }

        if (score > 0) {
            scores.push({ key, score });
        }
    }

    // Ordenar por relevancia descendente
    scores.sort((a, b) => b.score - a.score);

    // Solo incluir secciones con score >= 2 (umbral mínimo para evitar ruido)
    return scores
        .filter(({ score }) => score >= 2)
        .map(({ key }) => kb.sheets[key].contenido);
}

// Obtener fecha actual para contexto temporal
function getCurrentDateContext() {
    const now = new Date();
    const monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    const currentMonth = monthNames[now.getMonth()];
    const currentYear = now.getFullYear();
    return { currentMonth, currentYear, monthNames };
}

const { currentMonth, currentYear } = getCurrentDateContext();

// ─── SYSTEM PROMPT PRINCIPAL ──────────────────────────────────────────────────
const systemPrompt = `Eres un asistente institucional llamado Bootie. Tu función es responder preguntas de jubilados de CANTV sobre salud, reembolsos, atención y servicios disponibles.

CONTEXTO TEMPORAL ACTUAL:
- Mes actual: ${currentMonth} ${currentYear}
- IMPORTANTE: Cuando te pregunten sobre fechas de pago SIN especificar mes, asume que preguntan por el MES ACTUAL (${currentMonth}).

══════════════════════════════════════════════════════
🔒 REGLA ABSOLUTA #1 - FIDELIDAD A LA BASE DE CONOCIMIENTOS:
══════════════════════════════════════════════════════
- SOLO puedes responder usando información del CONTEXTO que se te proporcionará en cada pregunta.
- NUNCA uses tu conocimiento general entrenado para inventar, suponer o completar información.
- Si la información NO está en el CONTEXTO, responde: "No tengo información específica sobre eso en mi base de datos actual. ¿Hay algo más en que te pueda ayudar?"
- NUNCA inventes números de teléfono, correos, fechas, nombres o requisitos que no estén en el CONTEXTO.
- Si el CONTEXTO tiene información parcial, proporciona solo lo que dice el CONTEXTO y admite el resto como desconocido.
══════════════════════════════════════════════════════

REGLAS CRÍTICAS DE FORMATO - DEBES SEGUIRLAS SIEMPRE:

1. **NUNCA envíes markdown crudo**:
   - NO uses headers markdown (# ## ###)
   - NO copies tablas markdown (| columna | columna |)
   - NO incluyas HTML (<br>, <table>, etc.)
   - NO muestres el documento completo

2. **Convierte TODO a lenguaje natural conversacional**:
   - Si el documento tiene una TABLA, conviértela a una LISTA de viñetas
   - Si hay contactos, preséntalos como: "Puede contactar a [Nombre] ([Cargo]) al [teléfono] o por email a [correo]"
   - Si hay requisitos en lista, usa viñetas simples (*)

3. **Responde con precisión y brevedad**: Extrae solo la información relevante que responde directamente a la pregunta.

4. **Formato de respuesta preferido**:
   - Usa viñetas simples (*) para listas
   - Usa negrita (**texto**) para resaltar información importante
   - Mantén los links de email en formato markdown link
   - Separa secciones con saltos de línea, NO con "---"

5. Si la pregunta es ambigua, responde con una lista de opciones claras.

6. Mantén un tono respetuoso, claro y directo. Evita tecnicismos innecesarios.

7. **REGLAS DE CORTESÍA**:
   - Si el usuario dice "gracias", "muchas gracias" o similar, responde: "¡Estamos para servir! ¿Hay algo más en que te pueda ayudar?"
   - Si el usuario se despide ("chao", "adiós", "hasta luego", "bye", "nos vemos"), responde: "¡Nos vemos en otra oportunidad! Que tengas un excelente día. 😊"
   - Siempre muestra empatía y calidez con el usuario para que se sienta bien atendido

8. **REGLAS INTELIGENTES DE FECHAS Y PAGOS**:
   - Si preguntan "¿Cuándo pagan?" SIN especificar mes → Muestra SOLO las fechas del MES ACTUAL (${currentMonth} ${currentYear})
   - Si preguntan por un mes específico (ej: "¿Cuándo pagan en marzo?") → Muestra SOLO ese mes
   - NO muestres todo el calendario del año, solo la información relevante del mes solicitado o actual
   - Si preguntan por un mes del que NO tienes información, responde: "Solo tengo el calendario de [lista meses disponibles]. ¿Cuál te interesa?"

9. **CLARIFICACIONES ESPECÍFICAS**:
    - En los números de emergencia CANTV, aclara explícitamente que el número **0800-Cantv-00** y otros son generales, PERO el número **\*426** (asterisco 426) es exclusivo para llamar desde **Movilnet** (Asegúrate de incluir el símbolo * antes del número).

    10. **DISTINCIÓN DE NÓMINA**: 
    - Si el usuario pregunta por la "**Distribución de la nómina**", "**qué conceptos cobro**", "**cuánto cobro**" o similares, se refiere a la estructura de ingresos (Pensión, Bono Alimentario, Bono Vital, etc.). 
    - En este caso, **NO** asumas que pregunta por un mes del calendario. Proporciona la información sobre los montos y bonos mensuales que recibe el jubilado de forma general, tal como aparezca en la base de conocimientos.

    EJEMPLOS DE RESPUESTAS SOBRE FECHAS:

Usuario: "¿Cuándo pagan?" (pregunta genérica, sin mes)
Respuesta CORRECTA para ${currentMonth}:
"Para ${currentMonth} de ${currentYear}, las fechas de pago programadas son:

*   El [fecha] se paga el **Bono Alimentario**.
*   El [fecha] se paga la **primera quincena**.
*   El [fecha] se paga el **Bono Vital**.
*   El [fecha] se paga la **segunda quincena**.

¿Necesitas información de otro mes?"

Respuesta INCORRECTA (NUNCA HAGAS ESTO):
[Mostrar todo el calendario del año 2026 completo]

EJEMPLO DE RESPUESTA DE CONTACTOS:

Usuario: "¿Dónde puedo contactar al departamento de jubilados?"

Respuesta CORRECTA:
"Aquí están los contactos del departamento de Atención al Jubilado:

* **Armando Parodi** (Consultor): 0212-5006282 | aparodo1@cantv.com.ve
* **Efren Boada** (Consultor): 0212-5004067 | eboada01@cantv.com.ve
* **Noami Chacón** (Analista): 0212-4512810 | nchaco01@cantv.com.ve
* **Yesenia Parra** (Analista): yparra07@cantv.com.ve
* **Horacio Méndez** (Consultor): 0212-5004572 | hmendez01@cantv.com.ve
* **Yoilet Molina** (Analista): 0212-5006965 | ymolino4@cantv.com.ve

¿Necesita algo más?"

Respuesta INCORRECTA (NUNCA HAGAS ESTO):
"# ATENCIÓN AL JUBILADO - CONTACTOS
| Cargo | Nombre | Contacto |
|-------|--------|----------|
..."
`;

export async function POST(req: NextRequest) {
    try {
        const { message } = await req.json();

        if (!message || typeof message !== "string") {
            return NextResponse.json(
                { error: "Se requiere un mensaje válido" },
                { status: 400 }
            );
        }

        console.time("chat_total");
        const kb = loadKnowledgeBase();

        // 1. Manejo especial de Saludos
        const greetings = ["hola", "buenos dias", "buenas tardes", "buenas noches", "hey", "saludos"];
        const isGreeting = greetings.some(g => message.toLowerCase().trim().startsWith(g)) && message.length < 15;

        if (isGreeting) {
            console.log("👋 Saludo detectado, respuesta rápida.");
            return NextResponse.json({
                response: "¡Hola! Mi nombre es Bootie. Estoy listo para ayudarte con información de CANTV. ¿Qué necesitas saber hoy?"
            });
        }

        // 2. Manejo especial de Agradecimientos
        const thankYouPhrases = ["gracias", "muchas gracias", "te agradezco", "mil gracias", "thank you", "thanks"];
        const isThanking = thankYouPhrases.some(phrase => message.toLowerCase().trim().includes(phrase)) && message.length < 40;

        if (isThanking) {
            console.log("🙏 Agradecimiento detectado, respuesta amigable.");
            return NextResponse.json({
                response: "¡Estamos para servir! ¿Hay algo más en que te pueda ayudar? 😊"
            });
        }

        // 3. Manejo especial de Despedidas
        const farewellPhrases = ["chao", "adiós", "adios", "hasta luego", "nos vemos", "bye", "hasta pronto", "me voy"];
        const isFarewell = farewellPhrases.some(phrase => message.toLowerCase().trim().includes(phrase)) && message.length < 30;

        if (isFarewell) {
            console.log("👋 Despedida detectada, respuesta cálida.");
            return NextResponse.json({
                response: "¡Nos vemos en otra oportunidad! Que tengas un excelente día. 😊"
            });
        }

        if (!kb) {
            return NextResponse.json(
                { error: "No hay base de conocimiento cargada." },
                { status: 500 }
            );
        }

        console.time("kb_search");
        const relevantSections = findRelevantSections(message, kb);
        console.timeEnd("kb_search");

        if (relevantSections.length > 0) {
            console.log(`✅ Secciones encontradas: ${relevantSections.length}`);
            const context = "INFORMACIÓN DE LA BASE DE CONOCIMIENTOS (usa ÚNICAMENTE esta información para responder):\n\n"
                + relevantSections.join("\n\n---\n\n");

            // Instrucción explícita de fidelidad al contexto en cada consulta
            const userInstruction = `CONTEXTO DISPONIBLE:
${context}

PREGUNTA DEL USUARIO: ${message}

INSTRUCCIONES CRÍTICAS:
- Responde ÚNICAMENTE con información del CONTEXTO DISPONIBLE arriba.
- Si la respuesta exacta no está en el contexto, di que no tienes esa información específica.
- NO uses conocimiento general ni inventes datos.

RESPUESTA:`;

            // CAPA 1: Gemini 2.5 Flash (Principal)
            console.log("\n🔷 [CAPA 1] Intentando Gemini 2.5 Flash...");
            console.time("gemini_2.5");

            try {
                if (!genAI) throw new Error("Google GenAI client not initialized");
                const result = await genAI.models.generateContent({
                    model: "gemini-2.5-flash",
                    config: {
                        systemInstruction: systemPrompt,
                        temperature: 0.15,
                    },
                    contents: userInstruction,
                });
                console.timeEnd("gemini_2.5");
                console.timeEnd("chat_total");

                const text = result.text || "No pude procesar tu respuesta en este momento.";
                console.log("✅ [CAPA 1] Respondiendo con Gemini 2.5");
                return NextResponse.json({ response: text });
            } catch (error1: any) {
                console.error("❌ [CAPA 1] Error:", error1.message || error1);

                // CAPA 2: Groq Llama 3.1 8B (Ultra rápido)
                if (groq) {
                    console.log("\n🟢 [CAPA 2] Intentando Groq Llama 3.1 8B (ultra rápido)...");
                    console.time("groq_3.1_8b");

                    try {
                        const completion = await groq.chat.completions.create({
                            messages: [
                                { role: "system", content: systemPrompt },
                                { role: "user", content: userInstruction }
                            ],
                            model: "llama-3.1-8b-instant",
                            temperature: 0.15,
                            max_tokens: 1024,
                        });

                        console.timeEnd("groq_3.1_8b");
                        console.timeEnd("chat_total");

                        const text = completion.choices[0]?.message?.content || "No pude procesar tu respuesta.";
                        console.log("✅ [CAPA 2] Respondiendo con Groq Llama 3.1 8B");
                        return NextResponse.json({ response: text });

                    } catch (error2: any) {
                        console.error("❌ [CAPA 2] Error:", error2.message || error2);

                        // CAPA 3: Groq Llama 3.3 70B (Más inteligente, GRATIS)
                        console.log("\n🟣 [CAPA 3] Intentando Groq Llama 3.3 70B (más inteligente)...");
                        console.time("groq_3.3_70b");

                        try {
                            const completion = await groq.chat.completions.create({
                                messages: [
                                    { role: "system", content: systemPrompt },
                                    { role: "user", content: userInstruction }
                                ],
                                model: "llama-3.3-70b-versatile",
                                temperature: 0.15,
                                max_tokens: 1024,
                            });

                            console.timeEnd("groq_3.3_70b");
                            console.timeEnd("chat_total");

                            const text = completion.choices[0]?.message?.content || "No pude procesar tu respuesta.";
                            console.log("✅ [CAPA 3] Respondiendo con Groq Llama 3.3 70B");
                            return NextResponse.json({ response: text });

                        } catch (error3: any) {
                            console.error("❌ [CAPA 3] Error:", error3.message || error3);
                        }
                    }
                }

                // CAPA 4: Gemma 3 27B (via OpenRouter - más inteligente)
                if (gemma3) {
                    console.log("\n🔵 [CAPA 4] Intentando Gemma 3 27B...");
                    console.time("gemma3");

                    try {
                        const completion = await gemma3.chat.completions.create({
                            messages: [
                                { role: "system", content: systemPrompt },
                                { role: "user", content: userInstruction }
                            ],
                            model: "google/gemma-3-27b-it",
                            temperature: 0.15,
                            max_tokens: 1024,
                        });

                        console.timeEnd("gemma3");
                        console.timeEnd("chat_total");

                        const text = completion.choices[0]?.message?.content || "No pude procesar tu respuesta.";
                        console.log("✅ [CAPA 4] Respondiendo con Gemma 3 27B");
                        return NextResponse.json({ response: text });

                    } catch (error4: any) {
                        console.error("❌ [CAPA 4] Error:", error4.message || error4);
                    }
                }

                // CAPA 5: Gemini 2.0 Flash (Último respaldo IA)
                console.log("\n🔶 [CAPA 5] Intentando Gemini 2.0 Flash...");
                console.time("gemini_2.0");

                try {
                    if (!genAI) throw new Error("Google GenAI client not initialized");
                    const result = await genAI.models.generateContent({
                        model: "gemini-2.0-flash",
                        config: {
                            systemInstruction: systemPrompt,
                            temperature: 0.15,
                        },
                        contents: userInstruction,
                    });
                    console.timeEnd("gemini_2.0");
                    console.timeEnd("chat_total");

                    const text = result.text || "No pude procesar tu respuesta en este momento.";
                    console.log("✅ [CAPA 5] Respondiendo con Gemini 2.0");
                    return NextResponse.json({ response: text });

                } catch (error5: any) {
                    console.error("❌ [CAPA 5] Error:", error5.message || error5);

                    // CAPA 6: Procesador Local Inteligente
                    console.log("\n🔴 [CAPA 6] Todas las IAs fallaron, procesando localmente...");

                    let processedInfo = "";
                    for (const section of relevantSections) {
                        const cleanSection = section
                            .replace(/^#+\s/gm, "")
                            .replace(/\|.*\|/g, "")
                            .replace(/^\s*[-*]\s/gm, "• ")
                            .replace(/<br>/g, ", ")
                            .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
                            .split("\n")
                            .filter(line => line.trim().length > 10)
                            .slice(0, 5)
                            .join("\n");

                        processedInfo += cleanSection + "\n\n";
                    }

                    const fallbackResponse = `Lo siento, mis sistemas de IA están temporalmente saturados, pero encontré esta información relevante:\n\n${processedInfo.trim()}\n\n💡 Consejo: Intenta reformular tu pregunta en unos minutos para obtener una respuesta más detallada.`;

                    console.timeEnd("chat_total");
                    return NextResponse.json({ response: fallbackResponse });
                }
            }
        } else {
            console.log("⚠️ No se encontró info específica en la KB.");
            console.timeEnd("chat_total");
            return NextResponse.json({
                response: "Disculpa, esa información no se encuentra en mi base de datos. ¿En qué más te puedo ayudar?"
            });
        }

    } catch (error: any) {
        console.error("Error en API de chat:", error);

        let userErrorMessage = "Algo salió mal en mi sistema.";

        if (error.status === 429 || (error.message && error.message.includes("quota"))) {
            userErrorMessage = "He agotado mi energía (cuota) por hoy. Por favor, intenta de nuevo en unos minutos.";
        }

        return NextResponse.json(
            { error: userErrorMessage, details: error.message },
            { status: 500 }
        );
    }
}
