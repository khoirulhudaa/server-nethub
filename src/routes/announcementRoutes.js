import { Router } from "express";
import {
  getActiveAnnouncements,
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  toggleActive,
  getAnnouncementById,
} from "../controllers/announcementController.js";
import { protect, requireSuperAdmin } from "../middleware/auth.js";

const router = Router();

// Public – untuk ditampilkan di frontend (TopBar / notifikasi)
router.get("/", getActiveAnnouncements);

// Public – detail 1 pengumuman
router.get("/:id", getAnnouncementById);   // ← tambahkan di sini

// SuperAdmin only
router.get("/admin", protect, requireSuperAdmin, getAllAnnouncements);
router.post("/", protect, requireSuperAdmin, createAnnouncement);
router.put("/:id", protect, requireSuperAdmin, updateAnnouncement);
router.delete("/:id", protect, requireSuperAdmin, deleteAnnouncement);
router.patch("/:id/toggle", protect, requireSuperAdmin, toggleActive);

export default router;