import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

/**
 * @param {string} topic
 * @param {Array<{role: string, text: string}>} chatHistory
 * @param {string} userMessage
 * @param {string} model
 */
export async function chatAgent(
  topic,
  chatHistory,
  userMessage,
  model = "gemini-2.5-flash"
) {
  const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!API_KEY) throw new Error("Missing API key");

  const contents = chatHistory.map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.text }],
  }));

  contents.push({
    role: "user",
    parts: [{ text: userMessage }],
  });

  const systemInstruction = `You are a helpful and knowledgeable AI Study Tutor specializing in the topic: "${topic}".
Answer clearly, concisely, and accurately.
Use clean Markdown.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY,
      },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        tools: [{ google_search: {} }],
      }),
    }
  );

  const data = await response.json();
  console.log("chatAgent:", data);

  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "Sorry, I couldn't process that request.";

  return text;
}
