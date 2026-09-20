import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 150,
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
    },
    // Optional: tipe pengumuman
    type: {
      type: String,
      enum: ["info", "warning", "success", "important"],
      default: "info",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Tanggal kadaluarsa (opsional)
    expiresAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Index untuk query aktif
announcementSchema.index({ isActive: 1, expiresAt: 1, createdAt: -1 });

export default mongoose.model("Announcement", announcementSchema);