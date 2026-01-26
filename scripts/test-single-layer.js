// Script para hacer UNA prueba simple y ver qué CAPA de IA responde

const query = "¿Cuándo pagan en enero?";

async function testAndShowLayer() {
    console.log("🧪 Probando: ", query);
    console.log("⏳ Enviando pregunta al servidor...\n");

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
            return;
        }

        const data = await response.json();
        console.log("\n✅ RESPUESTA RECIBIDA:");
        console.log("═".repeat(70));
        console.log(data.response);
        console.log("═".repeat(70));
        console.log("\n💡 Revisa la consola del servidor para ver qué CAPA respondió");

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

testAndShowLayer();
