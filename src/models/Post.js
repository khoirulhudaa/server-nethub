import mongoose from "mongoose";
import slugify from "slugify";

const CATEGORIES = ["Topology", "Maintenance", "Fixing", "Installation", "Hardware"];

const hardwareMeshSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Device" },
    imageUrl: { type: String, required: true },
    // position/rotation let the client persist how the user arranged the 3D scene
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
    tatags: {
      type: [{ type: String, trim: true, lowercase: true }],
      validate: {
        validator: (v) => v.length <= 4,
        message: "Maksimal 4 tags",
      },
    },
    hardwareMeshes: [hardwareMeshSchema],
    gallery: [galleryItemSchema],
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isPinned: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
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