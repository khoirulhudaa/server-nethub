import mongoose from "mongoose";

export const CONTACT_CATEGORIES = [
  "Internal",
  "Vendor",
  "Client",
  "Supplier",
  "Support",
  "Emergency",
  "Family",
  "Other",
];

export const PHONE_LABELS = [
  "Mobile",
  "Work",
  "Home",
  "WhatsApp",
  "Extension",
  "Fax",
  "Other",
];

export const SOCIAL_PLATFORMS = [
  "WhatsApp",
  "Telegram",
  "Instagram",
  "Facebook",
  "LinkedIn",
  "X",
  "TikTok",
  "Website",
  "Other",
];

// Normalisasi nomor: hapus selain digit, awalan 0 → 62, hapus awalan +
export const normalizePhone = (raw = "") => {
  let n = String(raw).replace(/[^\d+]/g, "");
  if (n.startsWith("+")) n = n.slice(1);
  else if (n.startsWith("0")) n = "62" + n.slice(1);
  return n.replace(/\D/g, "");
};

// ===== Sub schema =====
const phoneSchema = new mongoose.Schema(
  {
    label: { type: String, enum: PHONE_LABELS, default: "Mobile" },
    number: { type: String, required: true, trim: true, maxlength: 30 },
    normalized: { type: String, default: "", index: true }, // otomatis, untuk pencarian & link WA
    extension: { type: String, trim: true, maxlength: 10, default: "" }, // ext. kantor
    isPrimary: { type: Boolean, default: false },
    isWhatsApp: { type: Boolean, default: false },
    note: { type: String, trim: true, maxlength: 100, default: "" },
  },
  { _id: false }
);

const emailSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, maxlength: 20, default: "Work" },
    address: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Format email tidak valid"],
    },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, maxlength: 20, default: "Office" },
    street: { type: String, trim: true, maxlength: 200, default: "" },
    district: { type: String, trim: true, maxlength: 80, default: "" },
    city: { type: String, trim: true, maxlength: 80, default: "" },
    province: { type: String, trim: true, maxlength: 80, default: "" },
    postalCode: { type: String, trim: true, maxlength: 10, default: "" },
    country: { type: String, trim: true, maxlength: 60, default: "Indonesia" },
    mapUrl: { type: String, trim: true, maxlength: 300, default: "" },
  },
  { _id: false }
);

const socialSchema = new mongoose.Schema(
  {
    platform: { type: String, enum: SOCIAL_PLATFORMS, default: "Other" },
    handle: { type: String, required: true, trim: true, maxlength: 200 }, // @username atau URL
  },
  { _id: false }
);

// ===== Main schema =====
const contactSchema = new mongoose.Schema(
  {
    // Identitas
    name: { type: String, required: true, trim: true, maxlength: 120 },
    nickname: { type: String, trim: true, maxlength: 60, default: "" },
    photo: { type: String, default: "" }, // base64 kecil atau URL
    gender: { type: String, enum: ["", "male", "female"], default: "" },
    birthday: { type: Date, default: null },

    // Pekerjaan
    company: { type: String, trim: true, maxlength: 120, default: "" },
    department: { type: String, trim: true, maxlength: 120, default: "" },
    jobTitle: { type: String, trim: true, maxlength: 120, default: "" },
    employeeId: { type: String, trim: true, maxlength: 40, default: "" }, // NIP / ID karyawan
    location: { type: String, trim: true, maxlength: 120, default: "" }, // cabang / unit kerja / gedung

    // Kontak
    phones: {
      type: [phoneSchema],
      validate: {
        validator: (v) => v.length >= 1 && v.length <= 8,
        message: "Minimal 1 dan maksimal 8 nomor telepon",
      },
    },
    emails: {
      type: [emailSchema],
      validate: { validator: (v) => v.length <= 5, message: "Maksimal 5 email" },
      default: [],
    },
    addresses: {
      type: [addressSchema],
      validate: { validator: (v) => v.length <= 3, message: "Maksimal 3 alamat" },
      default: [],
    },
    socials: {
      type: [socialSchema],
      validate: { validator: (v) => v.length <= 6, message: "Maksimal 6 sosial media" },
      default: [],
    },
    website: { type: String, trim: true, maxlength: 200, default: "" },

    // Klasifikasi
    category: { type: String, enum: CONTACT_CATEGORIES, default: "Internal", index: true },
    relationship: { type: String, trim: true, maxlength: 60, default: "" }, // mis. "Atasan", "Teknisi ISP"
    tags: {
      type: [{ type: String, trim: true, lowercase: true, maxlength: 30 }],
      validate: { validator: (v) => v.length <= 6, message: "Maksimal 6 tags" },
      default: [],
    },

    // Info tambahan
    availability: { type: String, trim: true, maxlength: 100, default: "" }, // "Senin–Jumat 08.00–17.00"
    notes: { type: String, trim: true, maxlength: 2000, default: "" },
    isEmergency: { type: Boolean, default: false },
    lastContactedAt: { type: Date, default: null },

    // Akses
    visibility: { type: String, enum: ["public", "private"], default: "public" },
    favoritedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Normalisasi nomor & pastikan hanya 1 primary
contactSchema.pre("validate", function (next) {
  this.phones.forEach((p) => {
    p.normalized = normalizePhone(p.number);
    if (p.label === "WhatsApp") p.isWhatsApp = true;
  });

  const keepOnePrimary = (list) => {
    if (!list?.length) return;
    const firstPrimary = list.findIndex((x) => x.isPrimary);
    list.forEach((x, i) => {
      x.isPrimary = firstPrimary === -1 ? i === 0 : i === firstPrimary;
    });
  };
  keepOnePrimary(this.phones);
  keepOnePrimary(this.emails);

  next();
});

contactSchema.index({
  name: "text",
  nickname: "text",
  company: "text",
  department: "text",
  jobTitle: "text",
  tags: "text",
});
contactSchema.index({ name: 1 });
contactSchema.index({ createdBy: 1, name: 1 });
contactSchema.index({ visibility: 1, category: 1, name: 1 });

export default mongoose.model("Contact", contactSchema);