import { Router } from "express";
import {
  createTicket,
  getTickets,
  getTicketById,
  updateTicketStatus,
  addTicketComment,
  getTicketOptions,
} from "../controllers/ticketController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.get("/options", protect, getTicketOptions);
router.post("/", protect, createTicket);
router.get("/", protect, getTickets);
router.get("/:id", protect, getTicketById);
router.patch("/:id/status", protect, updateTicketStatus);
router.post("/:id/comments", protect, addTicketComment);

export default router;