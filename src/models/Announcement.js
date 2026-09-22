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
    type: {
      type: String,
      enum: ["info", "warning", "success", "important"],
      default: "info",
    },
    // Thumbnail (URL setelah upload)
    thumbnail: {
      type: String,
      default: null,
    },
    // Max 4 hashtag
    hashtags: {
      type: [String],
      default: [],
      validate: {
        validator: (v) => v.length <= 4,
        message: "Maksimal 4 hashtag",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
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

announcementSchema.index({ isActive: 1, expiresAt: 1, createdAt: -1 });

export default mongoose.model("Announcement", announcementSchema);