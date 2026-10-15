import { Router } from "express";
import {
  getPcs, getPcStats, getPcById, createPc, updatePc, togglePin, deletePc,
} from "../controllers/PcController.js";
import { protect } from "../middleware/auth.js";
import { noGuest } from "../utils/noGuest.js";

const router = Router();
router.use(protect, noGuest);

router.get("/stats", getPcStats);
router.route("/").get(getPcs).post(createPc);
router.patch("/:id/pin", togglePin);
router.route("/:id").get(getPcById).put(updatePc).delete(deletePc);

export default router;
// Daftarkan di app: app.use("/api/pcs", pcRoutes);