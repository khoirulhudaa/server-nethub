import { Router } from "express";
import {
  getContacts,
  getContactStats,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  toggleFavorite,
  markContacted,
} from "../controllers/ContactController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect);

// Route statis HARUS di atas "/:id"
router.get("/stats", getContactStats);

router.route("/").get(getContacts).post(createContact);

router.patch("/:id/favorite", toggleFavorite);
router.patch("/:id/contacted", markContacted);

router.route("/:id").get(getContactById).put(updateContact).delete(deleteContact);

export default router;