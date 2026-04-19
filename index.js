import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/**
 * HEALTH CHECK
 */
app.get("/", (req, res) => {
  res.send("AI School Tutor is running 🚀");
});

/**
 * LIST MODELS (for debugging anytime)
 */
app.get("/models", async (req, res) => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`
    );

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * BROWSER TEST (WORKING AI)
 */
app.get("/ask-test", async (req, res) => {
  const question = "What is photosynthesis?";

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a school teacher. Explain simply step by step:\n\n${question}`
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    const answer =
      data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") ||
      data?.error?.message ||
      "No response from AI";

    res.json({
      question,
      answer,
      raw: data
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

/**
 * REAL APP ENDPOINT
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

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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

    const answer =
      data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") ||
      data?.error?.message ||
      "No response from AI";

    res.json({ answer });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
