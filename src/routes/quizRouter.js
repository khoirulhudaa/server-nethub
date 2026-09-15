import { Router } from "express";
import {
  createQuiz,
  getQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  submitAttempt,
  getMyQuizzes,
  getQuizAttempts,
  toggleLikeQuiz,
  rateQuiz,
  getQuizComments,
  addQuizComment,
  deleteQuizComment,
} from "../controllers/quizController.js";
import { protect, optionalAuth } from "../middleware/auth.js";

const router = Router();

// Public / list
router.get("/", optionalAuth, getQuizzes);
router.get("/mine", protect, getMyQuizzes);

// CRUD
router.post("/", protect, createQuiz);
router.get("/:id", optionalAuth, getQuizById);
router.put("/:id", protect, updateQuiz);
router.delete("/:id", protect, deleteQuiz);

// Attempt
router.post("/:id/attempt", protect, submitAttempt);
router.get("/:id/attempts", protect, getQuizAttempts);

// Social
router.patch("/:id/like", protect, toggleLikeQuiz);
router.post("/:id/rate", protect, rateQuiz);
router.get("/:id/comments", optionalAuth, getQuizComments);
router.post("/:id/comments", protect, addQuizComment);
router.delete("/comments/:commentId", protect, deleteQuizComment);

export default router;