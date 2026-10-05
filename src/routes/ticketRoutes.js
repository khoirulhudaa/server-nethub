import { Router } from "express";
import {
  createTicket,
  getTickets,
  getTicketById,
  updateTicketStatus,
  addTicketComment,
  getTicketOptions,
} from "../controllers/ticketController.js";
import { protect, optionalAuth } from "../middleware/auth.js"; // pastikan ada optionalAuth

const router = Router();

router.get("/options", getTicketOptions);          // public
router.post("/", optionalAuth, createTicket);      // bisa login / guest
router.get("/", protect, getTickets);              // hanya login
router.get("/:id", protect, getTicketById);        // hanya login
router.patch("/:id/status", protect, updateTicketStatus);
router.post("/:id/comments", protect, addTicketComment);

export default router;