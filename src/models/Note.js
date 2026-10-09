import mongoose from "mongoose";

export const NOTE_MOODS = ["", "happy", "excited", "calm", "neutral", "tired", "sad", "angry"];
export const NOTE_COLORS = ["default", "yellow", "green", "blue", "pink", "purple"];

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, maxlength: 150, default: "" },
    content: { type: String, maxlength: 20000, default: "" }, // teks bebas, baris baru dipertahankan
    entryDate: { type: Date, default: Date.now, index: true }, // tanggal catatan (bisa diubah)
    mood: { type: String, enum: NOTE_MOODS, default: "" },
    color: { type: String, enum: NOTE_COLORS, default: "default" },
    tags: {
      type: [{ type: String, trim: true, lowercase: true, maxlength: 30 }],
      validate: { validator: (v) => v.length <= 6, message: "Maksimal 6 tags" },
      default: [],
    },
    pinned: { type: Boolean, default: false },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

// Catatan boleh tanpa judul, tapi tidak boleh benar-benar kosong
noteSchema.pre("validate", function (next) {
  if (!this.title?.trim() && !this.content?.trim()) {
    this.invalidate("content", "Catatan tidak boleh kosong");
  }
  next();
});

noteSchema.index({ owner: 1, entryDate: -1 });
noteSchema.index({ owner: 1, pinned: -1, entryDate: -1 });
noteSchema.index({ title: "text", content: "text", tags: "text" });

export default mongoose.model("Note", noteSchema);