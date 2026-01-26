// Script de prueba para verificar la integración de Groq
const query = "¿Cuáles son los requisitos para el reembolso de medicamentos?";

async function testChatWithGroq() {
    console.log("🧪 Testing multi-layer chat with Groq integration...\n");
    console.log("Query:", query);
    console.log("=".repeat(60));

    try {
        const response = await fetch("http://localhost:3000/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ message: query }),
        });

        if (!response.ok) {
            console.error("❌ Error status:", response.status);
            const text = await response.text();
            console.error("Error body:", text);
            return;
        }

        const data = await response.json();
        console.log("\n✅ Response received:");
        console.log("=".repeat(60));
        console.log(data.response);
        console.log("=".repeat(60));

        // Verificar que no es un volcado crudo
        if (data.response.includes("INFORMACIÓN DEL DOCUMENTO") ||
            data.response.includes("---") ||
            data.response.includes("# Reembolsos")) {
            console.warn("\n⚠️  WARNING: La respuesta parece contener markdown crudo!");
        } else {
            console.log("\n✨ La respuesta está procesada inteligentemente!");
        }

    } catch (error) {
        console.error("❌ Fetch error:", error);
    }
}

testChatWithGroq();
