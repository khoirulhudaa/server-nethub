// server/models/QuizAttempt.js
import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    // multiple_choice
    selectedOptions: [Number], // index opsi yang dipilih
    // topology
    submittedTopology: {
      nodes: { type: Array, default: [] },
      edges: { type: Array, default: [] },
    },
    isCorrect: { type: Boolean, default: false },
    score: { type: Number, default: 0 },
  },
  { _id: false }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    answers: [answerSchema],
    totalScore: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    timeSpent: { type: Number, default: 0 }, // detik
    finishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

quizAttemptSchema.index({ quiz: 1, user: 1 });

export default mongoose.model("QuizAttempt", quizAttemptSchema);