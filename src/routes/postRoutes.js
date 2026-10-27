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
    removeFromReadingList,
  } from "../controllers/postController.js";
  import { protect, optionalAuth, requireCreator } from "../middleware/auth.js";
import { exportAllGuidesPdf } from "../controllers/exportController.js";

  const router = Router();

  router.get("/stats", getPostStats);
  router.get("/", optionalAuth, getPosts);
  router.get("/trending", getTrendingPosts);   // ← tambah ini
  router.get("/mine", protect, getMyPosts);
  // router.get("/:slug", getPostBySlug);
  router.get("/:slug", optionalAuth, getPostBySlug);
  router.post("/", protect, requireCreator, createPost);
  router.put("/:id", protect, requireCreator, updatePost);
  router.get("/export/pdf", optionalAuth, exportAllGuidesPdf);
  router.delete("/:id", protect, requireCreator, deletePost);
  router.patch("/:id/pin", protect, togglePin);
  router.patch("/:id/like", protect, toggleLike);
  router.post("/posts/:id/bookmark", protect, toggleBookmark);
  router.get("/users/me/bookmarks", protect, getMyBookmarks);
  router.post("/:id/bookmark", protect, toggleBookmark);
  router.patch("/:id/like", protect, toggleLike);
  router.delete("/me/reading-list/:postId", protect, removeFromReadingList);
  router.patch("/:id/pin", protect, togglePin);
  router.post("/:id/bookmark", protect, toggleBookmark);
  router.get("/me/likes", protect, getMyLikedPosts);
  router.get("/id/:id", protect, getPostById); // ← tambah route ini

  export default router;
