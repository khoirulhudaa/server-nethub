import crypto from "crypto";
import mongoose from "mongoose";
import Camera, { DEVICE_TYPES, ENTITIES } from "../models/Camera.js";
import { logActivity } from "../utils/logActivity.js";

// ---------- Enkripsi password perangkat ----------
// Wajib set CAMERA_SECRET di .env (string acak panjang, jangan diganti setelah ada data)
const getKey = () => {
  const secret = process.env.CAMERA_SECRET;
  if (!secret) throw new Error("CAMERA_SECRET belum di-set di environment");
  return crypto.createHash("sha256").update(secret).digest();
};

const encrypt = (plain) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const enc = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, enc].map((b) => b.toString("base64")).join(":");
};

const decrypt = (payload) => {
  const [iv, tag, enc] = payload.split(":").map((p) => Buffer.from(p, "base64"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
};

// ---------- Validasi ----------
const HOST_RE = /^[a-zA-Z0-9.\-]+(:\d{1,5})?$/; // IPv4 / hostname (+ port opsional)

const validate = (b, { requirePassword }) => {
  if (!DEVICE_TYPES.includes(b.deviceType)) return `Jenis hardware harus: ${DEVICE_TYPES.join(", ")}`;
  if (!ENTITIES.includes(b.entity)) return `Entitas harus: ${ENTITIES.join(", ")}`;
  if (!b.name?.trim()) return "Nama wajib diisi";
  if (!b.ipAddress?.trim() || !HOST_RE.test(b.ipAddress.trim())) return "IP address tidak valid";
  if (!b.username?.trim()) return "Username wajib diisi";
  if (requirePassword && !b.password) return "Password wajib diisi";
  return null;
};

const pick = (b) => ({
  deviceType: b.deviceType,
  name: b.name?.trim(),
  ipAddress: b.ipAddress?.trim(),
  username: b.username?.trim(),
  entity: b.entity,
});

// GET /api/cameras  (password tidak pernah ikut)
export const getCameras = async (req, res, next) => {
  try {
    const { entity, deviceType } = req.query;
    const filter = {};
    if (ENTITIES.includes(entity)) filter.entity = entity;
    if (DEVICE_TYPES.includes(deviceType)) filter.deviceType = deviceType;

    const cameras = await Camera.find(filter).sort({ entity: 1, name: 1 });
    res.json({ cameras });
  } catch (err) {
    next(err);
  }
};

// POST /api/cameras
export const createCamera = async (req, res, next) => {
  try {
    const error = validate(req.body, { requirePassword: true });
    if (error) return res.status(400).json({ message: error });

    const camera = await Camera.create({
      ...pick(req.body),
      password: encrypt(req.body.password),
      createdBy: req.user._id,
    });

    await logActivity({
      userId: req.user._id,
      action: "create_camera",
      targetType: "camera",
      targetId: camera._id,
      metadata: { name: camera.name, entity: camera.entity },
      req,
    });

    const { password, ...safe } = camera.toObject();
    res.status(201).json({ camera: safe });
  } catch (err) {
    next(err);
  }
};

// PUT /api/cameras/:id  (password kosong = tidak diubah)
export const updateCamera = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: "ID tidak valid" });

    const error = validate(req.body, { requirePassword: false });
    if (error) return res.status(400).json({ message: error });

    const update = pick(req.body);
    if (req.body.password) update.password = encrypt(req.body.password);

    const camera = await Camera.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!camera) return res.status(404).json({ message: "Perangkat tidak ditemukan" });

    await logActivity({
      userId: req.user._id,
      action: "update_camera",
      targetType: "camera",
      targetId: camera._id,
      metadata: { name: camera.name },
      req,
    });

    res.json({ camera });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/cameras/:id
export const deleteCamera = async (req, res, next) => {
  try {
    const camera = await Camera.findByIdAndDelete(req.params.id);
    if (!camera) return res.status(404).json({ message: "Perangkat tidak ditemukan" });

    await logActivity({
      userId: req.user._id,
      action: "delete_camera",
      targetType: "camera",
      targetId: camera._id,
      metadata: { name: camera.name },
      req,
    });

    res.json({ message: "Perangkat dihapus" });
  } catch (err) {
    next(err);
  }
};

// GET /api/cameras/:id/password  → hanya dipanggil saat user klik "lihat password"
export const revealPassword = async (req, res, next) => {
  try {
    const camera = await Camera.findById(req.params.id).select("+password name");
    if (!camera) return res.status(404).json({ message: "Perangkat tidak ditemukan" });

    await logActivity({
      userId: req.user._id,
      action: "reveal_camera_password",
      targetType: "camera",
      targetId: camera._id,
      metadata: { name: camera.name },
      req,
    });

    res.json({ password: decrypt(camera.password) });
  } catch (err) {
    next(err);
  }
};