import { Router } from "express";
import {
  getNotes, getNoteStats, getNoteById, createNote, updateNote, togglePin, deleteNote,
} from "../controllers/noteController.js";
import { protect } from "../middleware/auth.js";
import { noGuest } from "../utils/noGuest.js";

const router = Router();
router.use(protect, noGuest);

router.get("/stats", getNoteStats);
router.route("/").get(getNotes).post(createNote);
router.patch("/:id/pin", togglePin);
router.route("/:id").get(getNoteById).put(updateNote).delete(deleteNote);

export default router;