// ...existing code...
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

export async function researchAgent(topic, model = "gemini-2.5-flash") {
  const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!API_KEY) throw new Error("Missing GEMINI_API_KEY (or GOOGLE_API_KEY) in environment");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Explain the topic "${topic}" in a well-formatted way using:
- Headings
- Subheadings
- Bullet points
- Definitions
- Examples
- Code snippets (if relevant)
                  
Make it easy for exam preparation.`
              },
            ],
          },
        ],
      }),
    }
  );

  const data = await response.json();
  console.log(data);

const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response text found.";

  return text;
}
// ...existing code...