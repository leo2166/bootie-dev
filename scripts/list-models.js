
const { GoogleGenAI } = require("@google/genai");
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.error("GOOGLE_API_KEY is not set.");
    process.exit(1);
}

const genAI = new GoogleGenAI({ apiKey });

async function listModels() {
    try {
        // The SDK structure might be different, let's try the standard way or the specific one for this new SDK
        // The error message from server said "Call ListModels".
        // In @google/genai, it might be different from @google/generative-ai
        // Let's try to infer from the error or just try the standard fetch if SDK fails

        // Attempting raw fetch to be sure
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => {
                if (m.name.includes("gemini")) {
                    console.log(`- ${m.name}`);
                }
            });
        } else {
            console.log("No models found or error:", JSON.stringify(data));
        }

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
