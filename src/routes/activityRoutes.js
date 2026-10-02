import { Router } from "express";
import { getActivities, getActivityStats } from "../controllers/activityController.js";
import { protect } from "../middleware/auth.js";

// Hanya superAdmin yang boleh lihat semua log
const requireSuperAdmin = (req, res, next) => {
  if (req.user?.role !== "superAdmin") {
    return res.status(403).json({ message: "Akses ditolak" });
  }
  next();
};

const router = Router();

router.get("/", protect, requireSuperAdmin, getActivities);
router.get("/stats", protect, requireSuperAdmin, getActivityStats);

export default router;