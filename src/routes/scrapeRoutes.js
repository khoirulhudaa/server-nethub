import { scrapeUrl } from "../controllers/scrapeController.js";
router.post("/", protect, scrapeUrl); // atau optionalAuth