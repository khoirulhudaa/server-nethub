// server/models/QuizComment.js
import mongoose from "mongoose";

const quizCommentSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, maxlength: 1000, trim: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "QuizComment", default: null }, // reply
  },
  { timestamps: true }
);

quizCommentSchema.index({ quiz: 1, createdAt: -1 });

export default mongoose.model("QuizComment", quizCommentSchema);