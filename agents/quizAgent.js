import fetch from "node-fetch";
if(process.env.NODE_ENV != "production"){
   await import ('dotenv/config');
}


export async function quizAgent(topic, model = "gemini-2.5-flash") {
  const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!API_KEY) throw new Error("Missing API key");

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
Generate a quiz for the topic "${topic}".
Include:

- 5 multiple choice questions (A/B/C/D)
- 3 short-answer questions
- Provide correct answers at the bottom in this format:

### Answers
1. B
2. A
3. D
...

Output the quiz in **clean Markdown**, using:
- Proper headings
- Each question on separate lines
- Line breaks (two spaces at end)
- Horizontal separators (---)
- Bold question text
`,
              },
            ],
          },
        ],
      }),
    }
  );

  const data = await response.json();
  console.log("quizAgent:", data);
  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "Unable to generate quiz.";

  return text;
}
