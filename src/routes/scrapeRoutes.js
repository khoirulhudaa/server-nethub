import { scrapeUrl } from "../controllers/scrapeController.js";
import { Router } from "express";
import { protect } from "../middleware/auth.js";

const router = Router();

router.post("/", protect, scrapeUrl); // atau optionalAuth

export default router;