import mongoose from "mongoose";
import slugify from "slugify";

const OPTION_SCHEMA = new mongoose.Schema(
  {
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false }
);

const QUESTION_SCHEMA = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["multiple_choice", "topology"],
      required: true,
    },
    questionText: { type: String, required: true, maxlength: 500 },
    explanation: { type: String, default: "" }, // ditampilkan setelah submit
    points: { type: Number, default: 10, min: 1, max: 100 },

    // ===== Multiple Choice =====
    options: [OPTION_SCHEMA],           // hanya untuk multiple_choice
    allowMultiple: { type: Boolean, default: false }, // true = bisa pilih >1 jawaban

    // ===== Topology (praktek) =====
    // Kunci jawaban yang dibuat pembuat soal
    correctTopology: {
      nodes: { type: Array, default: [] },
      edges: { type: Array, default: [] },
    },
    // Batasan yang boleh dipakai user (opsional, biar tidak free-style)
    allowedHardware: [{ type: String }], // e.g. ["Router", "Switch", "Access Point"]
    allowedCables: [{ type: String }],   // e.g. ["utp", "fiber", "wireless"]
    // Toleransi matching (berapa persen kemiripan dianggap benar)
    matchThreshold: { type: Number, default: 0.85 }, // 85%
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, unique: true, index: true },
    description: { type: String, maxlength: 500, default: "" },
    category: {
      type: String,
      enum: ["Topology", "Maintenance", "Fixing", "Installation", "Hardware"],
      required: true,
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    coverImage: { type: String, default: "" },
    questions: {
      type: [QUESTION_SCHEMA],
      validate: {
        validator: (v) => v.length >= 5 && v.length <= 20,
        message: "Quiz harus berisi 5–20 soal",
      },
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isPublished: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

quizSchema.index({ title: "text", description: "text", tags: "text" });

quizSchema.pre("validate", function (next) {
  if (this.title && (!this.slug || this.isModified("title"))) {
    this.slug = `${slugify(this.title, { lower: true, strict: true })}-${Date.now()
      .toString(36)
      .slice(-5)}`;
  }
  next();
});

export default mongoose.model("Quiz", quizSchema);