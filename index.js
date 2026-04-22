import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/**
 * FUNCTION: Call OpenRouter with fallback
 */
async function callAI(prompt) {
  const models = [
    "deepseek/deepseek-chat",
    "mistralai/mistral-7b-instruct",
    "meta-llama/llama-3-8b-instruct"
  ];

  const safePrompt = prompt.slice(0, 4000); // prevent oversized input

  for (let model of models) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "AI Tutor"
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: safePrompt
            }
          ]
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      const data = await response.json();

      if (data?.error) {
        console.log(`${model} failed: ${data.error.message}`);
        continue;
      }

      const answer = data?.choices?.[0]?.message?.content;

      if (answer) return answer;

    } catch (err) {
      console.log(`Error with ${model}, trying next...`);
    }
  }

  return "AI is busy right now. Please try again.";
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

  const answer = await callAI(prompt);

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

  const answer = await callAI(prompt);

  res.json({ answer });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
