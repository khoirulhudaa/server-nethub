import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "login",
        "logout",
        "create_post",
        "update_post",
        "delete_post",
        "like",
        "unlike",
        "comment",
        "delete_comment",
      ],
      index: true,
    },
    // Target yang terkait (opsional)
    targetType: {
      type: String,
      enum: ["post", "comment", null],
      default: null,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    // Info tambahan biar log enak dibaca
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { timestamps: true }
);

// Index untuk query cepat
activitySchema.index({ createdAt: -1 });
activitySchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("Activity", activitySchema);