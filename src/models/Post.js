import mongoose from "mongoose";
import slugify from "slugify";

const CATEGORIES = [
  "Topology",
  "Maintenance",
  "Installation",
  "Hardware",
  "Eproc",
  "E-kantin",
  "EHRD",
  "Security",
  "General",
  "Pemrograman",
];

// ===== NEW: Step-by-step =====
const stepSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    image: { type: String, default: "" }, // base64 atau URL
  },
  { _id: false }
);

// ===== NEW: Flowchart =====
const flowchartSchema = new mongoose.Schema(
  {
    image: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { _id: false }
);

// ===== NEW: Custom Table =====
const customTableSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    rows: { type: Number, default: 3 },
    cols: { type: Number, default: 3 },
    data: {
      type: [[String]], // 2D array
      default: [],
    },
  },
  { _id: false }
);

const hardwareMeshSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Device" },
    imageUrl: { type: String, required: true },
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      z: { type: Number, default: 0 },
    },
    rotationY: { type: Number, default: 0 },
  },
  { _id: false }
);

const galleryItemSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    alt: { type: String, default: "" },
    photographer: { type: String, default: "" },
    photographerUrl: { type: String, default: "" },
    source: { type: String, default: "unsplash" },
  },
  { _id: false }
);

// ===== NEW: Reference Images (upload lokal) =====
const referenceImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true }, // base64 atau URL
    name: { type: String, default: "" },
  },
  { _id: false }
);

const codeBlockSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },        // contoh: "Konfigurasi VLAN"
    language: { type: String, default: "bash" }, // bash, routeros, javascript, dll
    code: { type: String, default: "" },
  },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, unique: true, index: true },
    excerpt: { type: String, maxlength: 240, default: "" },
    content: { type: String, required: true },
    coverImage: { type: String, default: "" },
    topology: {
      nodes: { type: Array, default: [] },
      edges: { type: Array, default: [] },
    },
    category: { type: String, enum: CATEGORIES, required: true },

    // FIXED: tatags → tags
    tags: {
      type: [{ type: String, trim: true, lowercase: true }],
      validate: {
        validator: (v) => v.length <= 4,
        message: "Maksimal 4 tags",
      },
    },

    hardwareMeshes: [hardwareMeshSchema],
    gallery: [galleryItemSchema],

    // ===== NEW FIELD =====
    referencesImages: {
      type: [referenceImageSchema],
      validate: {
        validator: (v) => v.length <= 4,
        message: "Maksimal 4 reference images",
      },
      default: [],
    },

    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isPinned: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    customTables: {
      type: [customTableSchema],
      default: [],
    },
    flowchart: {
      nodes: { type: Array, default: [] },
      edges: { type: Array, default: [] },
    },
    steps: {
      type: [stepSchema],
      default: [],
    },
    codeBlocks: {
      type: [codeBlockSchema],
      default: [],
    },
  },
  { timestamps: true }
);

postSchema.index({ title: "text", excerpt: "text", tags: "text" });

postSchema.pre("validate", function (next) {
  if (this.title && (!this.slug || this.isModified("title"))) {
    this.slug = `${slugify(this.title, { lower: true, strict: true })}-${Date.now()
      .toString(36)
      .slice(-5)}`;
  }
  next();
});

export const POST_CATEGORIES = CATEGORIES;
export default mongoose.model("Post", postSchema);