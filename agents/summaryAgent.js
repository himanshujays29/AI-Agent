// ...existing code...
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

export async function summaryAgent(topic, model = "gemini-2.5-flash") {
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
                text: `
Summarize the topic "${topic}" in concise points.
Include:
- Definition
- 4-5 key takeaways
- Simple example (if applicable)
Output in Markdown.
`
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