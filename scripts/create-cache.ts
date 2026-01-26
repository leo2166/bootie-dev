import { GoogleGenAI } from "@google/genai";
import dns from 'node:dns';
import path from "path";
import fs from "fs";
import * as dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

// Forzar IPv4 para evitar problemas con VPN/CANTV
dns.setDefaultResultOrder('ipv4first');

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.error("❌ Error: GOOGLE_API_KEY no está configurada en .env.local");
    process.exit(1);
}

const client = new GoogleGenAI({ apiKey });

async function createCache() {
    const documentsDir = path.join(process.cwd(), "documents");

    // Verificar que existe la carpeta documents
    if (!fs.existsSync(documentsDir)) {
        console.error("❌ La carpeta 'documents/' no existe.");
        process.exit(1);
    }

    // Leer archivos de la carpeta
    const files = fs.readdirSync(documentsDir).filter(file => {
        const ext = path.extname(file).toLowerCase();
        return [".pdf", ".txt", ".md"].includes(ext);
    });

    if (files.length === 0) {
        console.error("❌ No se encontraron archivos en la carpeta 'documents/'");
        process.exit(1);
    }

    console.log(`📄 Encontrados ${files.length} archivos para cachear:`);
    files.forEach(file => console.log(`   - ${file}`));
    console.log("");

    try {
        // Primero subir los archivos a Gemini Files API
        const uploadedFiles = [];

        for (const file of files) {
            const filePath = path.join(documentsDir, file);
            console.log(`⬆️  Subiendo: ${file}...`);

            const fileBuffer = fs.readFileSync(filePath);
            const ext = path.extname(file).toLowerCase();
            const mimeType = ext === ".pdf" ? "application/pdf" :
                ext === ".txt" ? "text/plain" : "text/markdown";

            const blob = new Blob([fileBuffer], { type: mimeType });

            const uploadedFile = await client.files.upload({
                file: blob,
                config: { displayName: file },
            });

            uploadedFiles.push(uploadedFile);
            console.log(`✅ Subido: ${file}`);
        }

        console.log("\n🧠 Creando cache con los documentos...");

        // Crear el contenido cacheado
        const cache = await client.caches.create({
            model: "gemini-2.0-flash-001",
            config: {
                displayName: "bootie-cantv-docs",
                // TTL de 1 hora (3600 segundos)
                ttl: "3600s",
                contents: [
                    {
                        role: "user",
                        parts: uploadedFiles.map(file => ({
                            fileData: {
                                fileUri: file.uri,
                                mimeType: file.mimeType,
                            }
                        }))
                    }
                ],
                systemInstruction: {
                    parts: [{
                        text: `Eres Bootie, un asistente robótico amigable y servicial. 
Tu trabajo es ayudar a los empleados de CANTV con información sobre:
- Fechas de pago
- Teléfonos y contactos de departamentos (Gestión Humana, Funeraria, etc.)
- Información de la Convención Colectiva
- Procedimientos de reembolsos y beneficios

Siempre respondes de forma clara, con un toque robótico amigable usando expresiones como "¡Bip bup!" ocasionalmente.
Si buscas en los documentos y NO encuentras la respuesta, di algo como: 
"¡Bip bup! 🤖 No encuentro esa información en mis circuitos de memoria. ¿Podrías intentar preguntarlo de otra forma?"

NUNCA inventes información. Solo responde basándote en los documentos que tienes disponibles.`
                    }]
                }
            }
        });

        console.log("\n🎉 ¡Cache creado exitosamente!");
        console.log(`📝 Cache Name: ${cache.name}`);
        console.log(`⏱️  Expira en: 1 hora`);

        // Guardar el cache name en un archivo para usarlo en el chat
        const cacheFile = path.join(process.cwd(), ".cache-name");
        fs.writeFileSync(cacheFile, cache.name || "");
        console.log(`\n💾 Cache name guardado en: .cache-name`);

        console.log("\n✅ ¡Listo! Ahora Bootie puede responder preguntas sin reenviar los documentos cada vez.");

    } catch (error) {
        console.error("❌ Error creando cache:");
        console.error(error);
        process.exit(1);
    }
}

createCache();
