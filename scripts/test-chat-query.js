
const query = "¿cuales son los requisitos para gastos medicos por medicinas?";

async function testChat() {
  console.log("Sending query:", query);
  try {
    const response = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: query }),
    });

    if (!response.ok) {
      console.error("Error status:", response.status);
      const text = await response.text();
      console.error("Error body:", text);
      return;
    }

    const data = await response.json();
    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

testChat();
