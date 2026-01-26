import { GoogleGenAI } from "@google/genai";
import dns from 'node:dns';
import path from "path";
import fs from "fs";
import * as dotenv from "dotenv";

// Cargar variables de entorno desde .env.local
dotenv.config({ path: '.env.local' });

// Forzar IPv4 para evitar problemas con VPN/CANTV
dns.setDefaultResultOrder('ipv4first');

/**
 * Script para subir documentos a Gemini File API
 * y crear un Vector Store para búsqueda semántica.
 */

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.error("❌ Error: GOOGLE_API_KEY no está configurada en .env.local");
    process.exit(1);
}

const client = new GoogleGenAI({ apiKey });

async function uploadDocuments() {
    const documentsDir = path.join(process.cwd(), "documents");

    // Verificar que existe la carpeta documents
    if (!fs.existsSync(documentsDir)) {
        console.error("❌ La carpeta 'documents/' no existe.");
        console.log("📁 Por favor crea la carpeta 'documents/' y coloca tus archivos ahí.");
        process.exit(1);
    }

    // Leer archivos de la carpeta
    const files = fs.readdirSync(documentsDir).filter(file => {
        const ext = path.extname(file).toLowerCase();
        return [".pdf", ".txt", ".md"].includes(ext);
    });

    if (files.length === 0) {
        console.error("❌ No se encontraron archivos PDF, TXT o MD en la carpeta 'documents/'");
        process.exit(1);
    }

    console.log(`📄 Encontrados ${files.length} archivos para subir:`);
    files.forEach(file => console.log(`   - ${file}`));
    console.log("");

    try {
        // Subir cada archivo
        const uploadedFiles = [];

        for (const file of files) {
            const filePath = path.join(documentsDir, file);
            const displayName = file;

            console.log(`⬆️  Subiendo: ${file}...`);

            // Leer el archivo
            const fileBuffer = fs.readFileSync(filePath);
            const blob = new Blob([fileBuffer], { type: getMimeType(file) });

            // Subir a Gemini File API
            const uploadedFile = await client.files.upload({
                file: blob,
                config: {
                    displayName,
                },
            });

            uploadedFiles.push(uploadedFile);
            console.log(`✅ Subido: ${file} (URI: ${uploadedFile.uri})`);
        }

        console.log("\n🎉 ¡Todos los archivos se subieron correctamente!");
        console.log("\n📝 URIs de los archivos:");
        uploadedFiles.forEach(f => {
            console.log(`   ${f.displayName}: ${f.uri}`);
        });

        console.log("\n💡 Tip: Puedes usar estos URIs con la API de cacheContent para crear un contexto cacheado.");
        console.log("    Esto permitirá que Bootie pueda responder preguntas basadas en estos documentos.");

    } catch (error) {
        console.error("❌ Error durante la subida:");
        console.error(error);
        process.exit(1);
    }
}

function getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
        ".pdf": "application/pdf",
        ".txt": "text/plain",
        ".md": "text/markdown",
    };
    return mimeTypes[ext] || "application/octet-stream";
}

// Ejecutar
uploadDocuments();
