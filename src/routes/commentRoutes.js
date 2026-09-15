import { Router } from "express";
import { getCommentsForPost, createComment, deleteComment } from "../controllers/commentController.js";
import { protect } from "../middleware/auth.js";
import { toggleBookmark } from "../controllers/postController.js";

const router = Router({ mergeParams: true });

router.get("/posts/:postId/comments", getCommentsForPost);
router.post("/posts/:postId/comments", protect, createComment);
router.delete("/comments/:id", protect, deleteComment);
router.post("/:id/bookmark", protect, toggleBookmark);

export default router;
