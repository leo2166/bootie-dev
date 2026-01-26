
import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
import dns from 'node:dns';

// Forzar IPv4
dns.setDefaultResultOrder('ipv4first');

dotenv.config({ path: ".env.local" });

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
    console.error("No API KEY");
    process.exit(1);
}

const client = new GoogleGenAI({ apiKey });

async function listModels() {
    try {
        console.log("🔍 Listando modelos disponibles...");
        const response = await client.models.list();
        // La respuesta puede ser paginada o un array directo dependiendo del SDK
        console.log("Modelos encontrados:");
        // @ts-ignore
        for await (const model of response) {
            console.log(`- ${model.name}`);
            if ((model as any).supportedGenerationMethods) {
                console.log(`  Métodos: ${model.supportedGenerationMethods.join(', ')}`);
            }
        }
    } catch (e) {
        console.error("Error listando modelos:", e);
    }
}

listModels();
