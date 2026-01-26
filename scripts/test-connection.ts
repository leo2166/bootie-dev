
import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
import dns from 'node:dns';

// Forzar IPv4 para evitar problemas con VPN
dns.setDefaultResultOrder('ipv4first');

// Cargar variables de entorno
dotenv.config({ path: ".env.local" });

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.error("❌ ERROR: No se encontró GOOGLE_API_KEY en .env.local");
    process.exit(1);
}

console.log(`🔑 Probando API Key: ${apiKey.substring(0, 10)}...`);

const genAI = new GoogleGenAI({ apiKey });

async function testConnection() {
    try {
        console.log("📡 Conectando a Google Gemini...");
        // Intentar generar contenido simple con gemini-flash-latest
        const result = await genAI.models.generateContent({
            model: "gemini-flash-latest",
            contents: "Hola, ¿estás vivo?",
        });
        console.log("✅ ¡ÉXITO! La API responde.");
        console.log("📝 Respuesta:", result.text());
    } catch (error: any) {
        console.error("❌ ERROR DE CONEXIÓN:");
        console.error(error); // Imprimir error completo
    }
}

testConnection();
