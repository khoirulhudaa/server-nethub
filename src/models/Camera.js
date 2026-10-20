import mongoose from "mongoose";

export const DEVICE_TYPES = ["NVR", "DVR", "Camera"];
export const ENTITIES = ["pintex", "tfi", "umum"];

const cameraSchema = new mongoose.Schema(
  {
    deviceType: { type: String, enum: DEVICE_TYPES, required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 }, // Nama NVR / DVR / Kamera
    ipAddress: { type: String, required: true, trim: true, maxlength: 100 },
    username: { type: String, required: true, trim: true, maxlength: 60 },
    // Disimpan terenkripsi (AES-256-GCM), BUKAN plain text
    password: { type: String, required: true, select: false },
    entity: { type: String, enum: ENTITIES, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

cameraSchema.index({ entity: 1, deviceType: 1, createdAt: -1 });

export default mongoose.model("Camera", cameraSchema);