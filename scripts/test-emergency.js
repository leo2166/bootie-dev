const query = "¿Cuales son los numeros de emergencia?";

async function testEmergency() {
    console.log("🧪 Probando respuesta de emergencia (regla *426 Movilnet)...");
    console.log("Pregunta:", query);
    console.log("─".repeat(50));

    try {
        const response = await fetch("http://localhost:3000/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: query }),
        });

        if (!response.ok) {
            throw new Error(`Status ${response.status}`);
        }

        const data = await response.json();
        console.log("\n✅ Respuesta:");
        console.log(data.response);

        console.log("\n📊 Verificación:");
        if (data.response.includes("*426") && data.response.toLowerCase().includes("movilnet")) {
            console.log("   ✅ Menciona *426 exclusivo de Movilnet");
        } else {
            console.log("   ⚠️  NO se detectó la aclaratoria de Movilnet/*426");
        }

    } catch (error) {
        console.error("❌ Error (asegúrate que el servidor esté corriendo):", error.message);
    }
}

testEmergency();
