import mongoose from "mongoose";

export const PC_OS = ["", "windows", "linux", "mac"];

const stripSpaces = (v) => String(v ?? "").replace(/\s+/g, "");

const pcSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: [true, "Nama PC wajib diisi"], maxlength: 80 },
    location: { type: String, trim: true, maxlength: 80, default: "" }, // contoh: Lab 1, Ruang Server
    os: { type: String, enum: PC_OS, default: "" },
    ipAddress: { type: String, trim: true, maxlength: 60, default: "" },

    // AnyDesk: 9–10 digit angka, atau alias (nama@ad)
    anydeskId: {
      type: String,
      default: "",
      set: stripSpaces,
      validate: {
        validator: (v) => !v || /^(\d{9,10}|[\w.-]+@[\w.-]+)$/.test(v),
        message: "ID AnyDesk harus 9–10 digit angka atau alias (nama@ad)",
      },
    },
    anydeskPassword: { type: String, maxlength: 100, default: "", select: false },

    // VNC: host:port, contoh 192.168.1.10:5900
    vncAddress: { type: String, trim: true, maxlength: 100, default: "" },
    vncPassword: { type: String, maxlength: 100, default: "", select: false },

    notes: { type: String, maxlength: 2000, default: "" },
    pinned: { type: Boolean, default: false },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

pcSchema.pre("validate", function (next) {
  if (!this.anydeskId && !this.vncAddress) {
    this.invalidate("anydeskId", "Isi minimal satu: ID AnyDesk atau alamat VNC");
  }
  next();
});

pcSchema.index({ owner: 1, pinned: -1, name: 1 });
pcSchema.index({ owner: 1, location: 1 });

export default mongoose.model("Pc", pcSchema);