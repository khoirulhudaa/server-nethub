import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["new_ticket", "ticket_update", "comment", "system"],
      default: "new_ticket",
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: "" }, // contoh: /tickets/6789abc
    isRead: { type: Boolean, default: false },
    meta: {
      ticketId: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket" },
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);