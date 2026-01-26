import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
import dns from 'node:dns';
import path from "path";
import fs from "fs";

// Forzar IPv4
dns.setDefaultResultOrder('ipv4first');
dotenv.config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
    console.error("❌ GOOGLE_API_KEY no encontrada");
    process.exit(1);
}

const genAI = new GoogleGenAI({ apiKey });

interface KnowledgeBase {
    documents: {
        name: string;
        content: string;
        chunks: string[];
    }[];
    lastUpdated: string;
}

function splitIntoChunks(text: string, chunkSize: number = 1500): string[] {
    const chunks: string[] = [];
    const paragraphs = text.split(/\n\n+/);
    let currentChunk = "";

    for (const paragraph of paragraphs) {
        if (currentChunk.length + paragraph.length > chunkSize) {
            if (currentChunk.trim()) chunks.push(currentChunk.trim());
            currentChunk = paragraph;
        } else {
            currentChunk += "\n\n" + paragraph;
        }
    }
    if (currentChunk.trim()) chunks.push(currentChunk.trim());
    return chunks;
}

async function runOCR() {
    const fileName = "documentoa a  RAG 1.pdf";
    const filePath = path.join(process.cwd(), "documents", fileName);

    if (!fs.existsSync(filePath)) {
        console.error(`❌ No se encontró el archivo: ${fileName}`);
        process.exit(1);
    }

    console.log(`🧠 Iniciando OCR para: ${fileName}...`);
    console.log("⏳ Esto puede tardar unos segundos ya que Gemini está 'leyendo' las imágenes...");

    try {
        const result = await genAI.models.generateContent({
            model: "gemini-flash-latest",
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            inlineData: {
                                data: fs.readFileSync(filePath).toString("base64"),
                                mimeType: "application/pdf"
                            }
                        },
                        {
                            text: "Extract all the text from this document as accurately as possible. Output ONLY the extracted text, maintaining the original structure (dates, amounts, departments)."
                        }
                    ]
                }
            ]
        });

        const extractedText = result.text || "";
        if (!extractedText) {
            console.error("⚠️ No se pudo extraer texto.");
            return;
        }
        console.log("✅ Texto extraído exitosamente.");

        const knowledgeBase: KnowledgeBase = {
            documents: [{
                name: fileName,
                content: extractedText,
                chunks: splitIntoChunks(extractedText)
            }],
            lastUpdated: new Date().toISOString()
        };

        fs.writeFileSync("knowledge-base.json", JSON.stringify(knowledgeBase, null, 2));
        console.log(`\n🎉 ¡Base de conocimiento creada! (${knowledgeBase.documents[0].chunks.length} chunks)`);
        console.log("💾 Guardado en: knowledge-base.json");

    } catch (error) {
        console.error("❌ Error durante el OCR:", error);
    }
}

runOCR();
