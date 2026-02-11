const VERCEL_URL = "https://trip-backend-sable.vercel.app/api/chat";

async function callGemini(text) {
  try {
    const response = await fetch(VERCEL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });
    
    const result = await response.json();
    console.log("Gemini의 답변:", result.candidates[0].content.parts[0].text);
  } catch (err) {
    console.error("에러 발생:", err);
  }
}
