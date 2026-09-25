import { Router } from "express";
import {
  createPost,
  getPosts,
  getPostBySlug,
  updatePost,
  deletePost,
  togglePin,
  toggleLike,
  getMyPosts,
  toggleBookmark,
  getMyBookmarks,
  getMyLikedPosts,
  getTrendingPosts,
  getPostStats,
  getPostById,
} from "../controllers/postController.js";
import { protect, optionalAuth } from "../middleware/auth.js";

const router = Router();

router.get("/stats", getPostStats);
router.get("/", optionalAuth, getPosts);
router.get("/trending", getTrendingPosts);   // ← tambah ini
router.get("/mine", protect, getMyPosts);
router.get("/:slug", getPostBySlug);
router.post("/", protect, createPost);
router.put("/:id", protect, updatePost);
router.delete("/:id", protect, deletePost);
router.patch("/:id/pin", protect, togglePin);
router.patch("/:id/like", protect, toggleLike);
router.post("/posts/:id/bookmark", protect, toggleBookmark);
router.get("/users/me/bookmarks", protect, getMyBookmarks);
router.post("/:id/bookmark", protect, toggleBookmark);
router.patch("/:id/like", protect, toggleLike);
router.patch("/:id/pin", protect, togglePin);
router.post("/:id/bookmark", protect, toggleBookmark);
router.get("/me/likes", protect, getMyLikedPosts);
router.get("/id/:id", protect, getPostById); // ← tambah route ini

export default router;
