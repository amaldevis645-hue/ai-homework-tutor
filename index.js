import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/**
 * Health check
 */
app.get("/", (req, res) => {
  res.send("AI School Tutor is running 🚀");
});

/**
 * MAIN AI TUTOR ROUTE
 */
app.post("/ask", async (req, res) => {
  const { question, chapter } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Question is required" });
  }

  // OPTIONAL: simple syllabus lock (MVP version)
  const syllabusContext = chapter
    ? `You are only allowed to answer using knowledge from: ${chapter}.`
    : "You are a school tutor.";

  const prompt = `
You are an expert school teacher.

Rules:
- Explain in simple language
- Step-by-step answers
- Use examples if needed
- If answer is not in syllabus, say "Not in syllabus"
- Do NOT hallucinate

${syllabusContext}

Student Question:
${question}
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response from AI";

    res.json({
      answer,
      chapter: chapter || "general"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "AI request failed"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
