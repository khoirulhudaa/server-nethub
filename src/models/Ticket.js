import mongoose from "mongoose";

const TICKET_CATEGORIES = [
  "Network",
  "PC/Laptop",
  "Printer",
  "Server",
  "Email",
  "Aplikasi",
  "Lainnya",
];

const TICKET_STATUS = [
  "Baru",
  "Sedang Dikerjakan",
  "Menunggu Info",
  "Selesai",
  "Ditutup",
];

const TICKET_PRIORITY = ["Low", "Medium", "High", "Critical"];

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    name: { type: String, default: "" },
    type: { type: String, default: "" },
  },
  { _id: false }
);

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    isInternal: { type: Boolean, default: false }, // hanya terlihat IT
  },
  { timestamps: true }
);

const ticketSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: true },
    category: { type: String, enum: TICKET_CATEGORIES, required: true },
    status: { type: String, enum: TICKET_STATUS, default: "Baru" },
    priority: { type: String, enum: TICKET_PRIORITY, default: "Medium" },

    // Waktu masalah
    sinceWhen: { type: String, required: true }, // "Baru saja", "Hari ini", dll atau tanggal

    // Lokasi & perangkat
    location: { type: String, required: true }, // Ruangan
    pcOwner: { type: String, required: true }, // Nama user / pemilik PC
    computerName: { type: String, default: "" }, // Nama komputer / IP

    // Remote
    anydeskNumber: { type: String, default: "" },
    anydeskPassword: { type: String, default: "" }, // akan dikosongkan saat selesai

    // Attachment
    attachments: [attachmentSchema],

    // Relasi
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // Guides yang dipakai saat resolve
    usedGuide: { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: null },
    solutionNote: { type: String, default: "" },

    // Komentar
    comments: [commentSchema],

    // Log sederhana
    statusHistory: [
      {
        status: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        changedAt: { type: Date, default: Date.now },
        note: String,
      },
    ],
  },
  { timestamps: true }
);

// Index untuk pencarian & filter
ticketSchema.index({ status: 1, createdAt: -1 });
ticketSchema.index({ createdBy: 1, createdAt: -1 });
ticketSchema.index({ category: 1, status: 1 });
ticketSchema.index({ title: "text", description: "text" });

export const TICKET_CATEGORIES_LIST = TICKET_CATEGORIES;
export const TICKET_STATUS_LIST = TICKET_STATUS;
export const TICKET_PRIORITY_LIST = TICKET_PRIORITY;

export default mongoose.model("Ticket", ticketSchema);