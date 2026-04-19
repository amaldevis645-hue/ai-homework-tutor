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
 * BROWSER TEST (NO POSTMAN NEEDED)
 * Open:
 * https://your-app.onrender.com/ask-test
 */
app.get("/ask-test", async (req, res) => {
  const question = "What is photosynthesis?";

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
              parts: [
                {
                  text: `You are a strict school teacher. Explain in simple steps:\n\n${question}`
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    // Debug log (visible in Render logs)
    console.log("GEMINI RESPONSE:", JSON.stringify(data, null, 2));

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
    console.error("ERROR:", err);

    res.status(500).json({
      error: "AI request failed",
      details: err.message
    });
  }
});

/**
 * REAL APP ENDPOINT (FOR FUTURE FRONTEND)
 */
app.post("/ask", async (req, res) => {
  const { question, chapter } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Question is required" });
  }

  const syllabusContext = chapter
    ? `You must answer ONLY from this chapter: ${chapter}. If not in syllabus say "Not in syllabus".`
    : "You are a school tutor.";

  const prompt = `
You are a strict but helpful school teacher.

Rules:
- Simple explanation
- Step-by-step
- No hallucination
- Stay inside syllabus

${syllabusContext}

Question:
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

    console.log("GEMINI RESPONSE:", JSON.stringify(data, null, 2));

    const answer =
      data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") ||
      data?.error?.message ||
      "No response from AI";

    res.json({ answer });

  } catch (err) {
    console.error("ERROR:", err);

    res.status(500).json({
      error: "AI request failed",
      details: err.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
