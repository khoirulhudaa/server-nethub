import mongoose from "mongoose";

const HARDWARE_CATEGORIES = [
  "CPU",
  "GPU",
  "RAM",
  "Motherboard",
  "Storage",
  "PSU",
  "Case",
  "Cooling",
  "Network",
  "Other",
];

const hardwareSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Nama hardware wajib diisi"],
      trim: true,
      maxlength: 120,
    },
    brand: {
      type: String,
      trim: true,
      default: "",
      maxlength: 60,
    },
    category: {
      type: String,
      enum: HARDWARE_CATEGORIES,
      required: true,
      default: "Other",
    },
    description: {
      type: String,
      default: "",
      maxlength: 500,
    },
    // Gambar utama (URL atau base64)
    image: {
      type: String,
      required: [true, "Gambar wajib diisi"],
    },
    // Spec singkat (opsional) — array { key, value }
    specs: [
      {
        key: { type: String, trim: true },
        value: { type: String, trim: true },
        _id: false,
      },
    ],
    // Warna aksen kartu (opsional)
    accentColor: {
      type: String,
      default: "#3b82f6", // blue
    },
    element: {
        type: String,
        enum: [
            "signal",
            "flow",
            "overload",
            "firewall",
            "malware",
            "stealth",
            "encryption",
            "ai",
            "darknet",
            "backbone",
            "cloud",
            "physical",
            "hardware",
            "exploit",
            "balancer",
            "interface",
            "protocol",
        ],
        default: "protocol",
        },
        // Power points (seperti HP)
       power: {
        type: Number,
        default: 100,
        min: 1,
        max: 9999,
        },
    isPublished: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

hardwareSchema.index({ category: 1, createdAt: -1 });
hardwareSchema.index({ name: "text", brand: "text", description: "text" });

export const HARDWARE_CATEGORIES_LIST = HARDWARE_CATEGORIES;
export default mongoose.model("Hardware", hardwareSchema);