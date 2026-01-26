
async function testChat() {
    console.log("🧪 Iniciando prueba de integración del chat...");
    try {
        const response = await fetch("http://localhost:3000/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "cuando pagan" })
        });

        const data = await response.json();

        if (response.ok) {
            console.log("✅ Chat respondió exitosamente:");
            console.log("-----------------------------------");
            console.log(data.response);
            console.log("-----------------------------------");
        } else {
            console.error("❌ Error en la respuesta del chat:", data);
        }
    } catch (error) {
        console.error("❌ Error de red al probar el chat:", error);
    }
}

testChat();
