import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

export async function flashcardAgent(topic, model = "gemini-2.5-flash") {
  const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!API_KEY) throw new Error("Missing API Key");

  const prompt = `
Generate 10 flashcards for the topic "${topic}".
Each flashcard MUST follow exactly this format:

### Flashcard X
**Term:**
A short term related to the topic.

**Definition:**
A simple, clear definition.

**Example:**
One example that explains the term.

**Mnemonic:**
A one-line mnemonic trick.

Use clean Markdown only.
Add a horizontal divider "---" after each card.
`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  const data = await response.json();
  console.log("flashcardAgent:", data);

  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "Unable to generate flashcards.";

  return text;
}
