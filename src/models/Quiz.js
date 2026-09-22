// server/models/Quiz.js  (tambahan field)
import mongoose from "mongoose";
import slugify from "slugify";

const OPTION_SCHEMA = new mongoose.Schema(
  {
    text: { type: String, default: "" },
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
    explanation: { type: String, default: "" },
    points: { type: Number, default: 10, min: 1, max: 100 },
    options: [OPTION_SCHEMA],
    allowMultiple: { type: Boolean, default: false },
    correctTopology: {
      nodes: { type: Array, default: [] },
      edges: { type: Array, default: [] },
    },
    allowedHardware: [{ type: String }],
    allowedCables: [{ type: String }],
    matchThreshold: { type: Number, default: 0.85 },
  },
  { _id: true }
);

const ratingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    value: { type: Number, required: true, min: 1, max: 5 },
  },
  { _id: false }
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
    tags: {
    type: [{ type: String, trim: true, lowercase: true }],
      validate: {
        validator: (v) => !v || v.length <= 4,
        message: "Maksimal 4 tags",
      },
      default: [],
    },
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

    // ===== Social =====
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    ratings: [ratingSchema],
    averageRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },

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