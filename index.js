import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check route
app.get("/", (req, res) => {
  res.send("AI Homework Tutor is running 🚀");
});

// AI route (placeholder for now)
app.post("/ask", (req, res) => {
  const { question } = req.body;

  res.json({
    answer: "This is a placeholder. Next step: connect AI model.",
    question_received: question
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
