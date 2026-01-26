const query = "dime sobre Servicios Funerarios el Rosal";

async function testNewDoc() {
    console.log("🧪 Probando nuevo documento:", query);
    try {
        const response = await fetch("http://localhost:3000/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: query }),
        });

        const data = await response.json();
        console.log("\n✅ Respuesta:");
        console.log(data.response);
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

testNewDoc();
