import { Router } from "express";
import { protect, requireSuperAdmin } from "../middleware/auth.js";
import { createHardware, deleteHardware, getAllHardware, getHardwareById, getHardwareList, updateHardware } from "../controllers/HardwareController.js";

const router = Router();

router.get("/", getHardwareList);
router.get("/admin", protect, requireSuperAdmin, getAllHardware);
router.get("/:id", getHardwareById);

router.post("/", protect, requireSuperAdmin, createHardware);
router.put("/:id", protect, requireSuperAdmin, updateHardware);
router.delete("/:id", protect, requireSuperAdmin, deleteHardware);

export default router;