import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

export async function diagramAgent(topic, model = "gemini-2.5-flash") {
  const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!API_KEY) throw new Error("Missing API Key");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
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
Create a hierarchical mind map for the topic "${topic}" using Mermaid.js syntax.
Use the "mindmap" diagram type.
Keep the structure simple: Root -> Main Concepts -> Details.
Do NOT use markdown code blocks like \`\`\`mermaid.
Just output raw Mermaid syntax.

Example format:
mindmap
  root((Topic))
    Concept 1
      Detail A
      Detail B
    Concept 2
      Detail C
`,
              },
            ],
          },
        ],
      }),
    }
  );

  const data = await response.json();
  console.log("diagramAgent:", data);

  let text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "mindmap\n  root((Error))";

  text = text.replace(/```mermaid/g, "").replace(/```/g, "").trim();

  return text;
}
