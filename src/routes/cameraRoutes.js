import { Router } from "express";
import {
  getCameras,
  createCamera,
  updateCamera,
  deleteCamera,
  revealPassword,
  createCamerasBulk,
  deleteCamerasBulk,
} from "../controllers/cameraController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// Guest tidak boleh menyentuh data kredensial perangkat
const blockGuest = (req, res, next) => {
  if (req.user?.isGuest || req.user?.role === "guest") {
    return res.status(403).json({ message: "Akses ditolak untuk guest" });
  }
  next();
};

router.use(protect, blockGuest);

router.get("/", getCameras);
router.post("/", createCamera);
router.post("/bulk", createCamerasBulk);
router.put("/:id", updateCamera);
router.delete("/bulk", deleteCamerasBulk);
router.delete("/:id", deleteCamera);
router.get("/:id/password", revealPassword);

export default router;