import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.GEMINI_API_KEY;

/**
 * FUNCTION: Call Gemini with fallback
 */
async function callGemini(prompt) {
  const models = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite"
  ];

  for (let model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }]
              }
            ]
          })
        }
      );

      const data = await response.json();

      // If model overloaded → try next
      if (data?.error?.code === 503) {
        console.log(`${model} overloaded, trying next...`);
        continue;
      }

      const answer =
        data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") ||
        data?.error?.message;

      if (answer) return answer;

    } catch (err) {
      console.log(`Error with ${model}, trying next...`);
    }
  }

  return "AI is busy right now. Please try again in a moment.";
}

/**
 * HEALTH CHECK
 */
app.get("/", (req, res) => {
  res.send("AI School Tutor is running 🚀");
});

/**
 * BROWSER TEST
 */
app.get("/ask-test", async (req, res) => {
  const question = "What is photosynthesis?";

  const prompt = `
Explain this simply for a student:
${question}
`;

  const answer = await callGemini(prompt);

  res.json({ question, answer });
});

/**
 * MAIN API
 */
app.post("/ask", async (req, res) => {
  const { question, chapter } = req.body;

  const prompt = `
You are a strict school tutor.

Rules:
- Simple explanation
- Step-by-step
- If not in syllabus say "Not in syllabus"

Chapter: ${chapter || "General"}

Question:
${question}
`;

  const answer = await callGemini(prompt);

  res.json({ answer });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
