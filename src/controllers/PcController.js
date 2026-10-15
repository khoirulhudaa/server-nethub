import mongoose from "mongoose";
import Pc, { PC_OS } from "../models/Pc.js";

const escapeRegex = (s = "") => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const bad = (res, status, message) => res.status(status).json({ message });

const EDITABLE = [
  "name", "location", "os", "ipAddress",
  "anydeskId", "anydeskPassword", "vncAddress", "vncPassword",
  "notes", "pinned",
];

const pickBody = (body = {}) => {
  const data = {};
  EDITABLE.forEach((k) => body[k] !== undefined && (data[k] = body[k]));
  return data;
};

const handleErr = (err, res, next) => {
  if (err.name === "ValidationError") return bad(res, 400, Object.values(err.errors)[0]?.message || "Data tidak valid");
  if (err.name === "CastError") return bad(res, 400, "ID tidak valid");
  return next(err);
};

// withSecrets = true -> ikut mengambil password (hanya untuk detail/edit)
const findMine = async (req, withSecrets = false) => {
  if (!mongoose.isValidObjectId(req.params.id)) return null;
  const query = Pc.findOne({ _id: req.params.id, owner: req.user._id });
  return withSecrets ? query.select("+anydeskPassword +vncPassword") : query;
};

// GET /api/pcs
// Query: q, location, os, pinned=1, sort(name|newest), page, limit
export const getPcs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));

    const filter = { owner: req.user._id };
    if (req.query.location) filter.location = String(req.query.location);
    if (PC_OS.includes(req.query.os) && req.query.os) filter.os = req.query.os;
    if (req.query.pinned === "1") filter.pinned = true;

    const q = (req.query.q || "").trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      const rxId = new RegExp(escapeRegex(q.replace(/\s+/g, "")), "i"); // ID AnyDesk disimpan tanpa spasi
      filter.$or = [
        { name: rx }, { location: rx }, { ipAddress: rx },
        { vncAddress: rx }, { notes: rx }, { anydeskId: rxId },
      ];
    }

    const sort =
      req.query.sort === "newest"
        ? { pinned: -1, createdAt: -1 }
        : { pinned: -1, name: 1 };

    const [pcs, total] = await Promise.all([
      Pc.find(filter)
        .sort(sort)
        .collation({ locale: "id", numericOrdering: true }) // PC-2 sebelum PC-10
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(), // password tidak ikut karena select: false
      Pc.countDocuments(filter),
    ]);

    res.json({ pcs, page, pages: Math.ceil(total / limit) || 1, total });
  } catch (err) {
    handleErr(err, res, next);
  }
};

// GET /api/pcs/stats
export const getPcStats = async (req, res, next) => {
  try {
    const owner = new mongoose.Types.ObjectId(String(req.user._id));
    const [total, pinned, byOs, byLocation] = await Promise.all([
      Pc.countDocuments({ owner }),
      Pc.countDocuments({ owner, pinned: true }),
      Pc.aggregate([{ $match: { owner, os: { $ne: "" } } }, { $group: { _id: "$os", count: { $sum: 1 } } }]),
      Pc.aggregate([
        { $match: { owner, location: { $ne: "" } } },
        { $group: { _id: "$location", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);
    res.json({
      total,
      pinned,
      byOs: Object.fromEntries(byOs.map((x) => [x._id, x.count])),
      byLocation: Object.fromEntries(byLocation.map((x) => [x._id, x.count])),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/pcs/:id
export const getPcById = async (req, res, next) => {
  try {
    const pc = await findMine(req, true);
    if (!pc) return bad(res, 404, "PC tidak ditemukan");
    res.json({ pc });
  } catch (err) {
    handleErr(err, res, next);
  }
};

// POST /api/pcs
export const createPc = async (req, res, next) => {
  try {
    const created = await Pc.create({ ...pickBody(req.body), owner: req.user._id });
    const pc = created.toObject();
    delete pc.anydeskPassword;
    delete pc.vncPassword;
    res.status(201).json({ pc });
  } catch (err) {
    handleErr(err, res, next);
  }
};

// PUT /api/pcs/:id
export const updatePc = async (req, res, next) => {
  try {
    const pc = await findMine(req, true);
    if (!pc) return bad(res, 404, "PC tidak ditemukan");
    pc.set(pickBody(req.body));
    await pc.save();
    res.json({ pc });
  } catch (err) {
    handleErr(err, res, next);
  }
};

// PATCH /api/pcs/:id/pin
export const togglePin = async (req, res, next) => {
  try {
    const pc = await findMine(req);
    if (!pc) return bad(res, 404, "PC tidak ditemukan");
    pc.pinned = !pc.pinned;
    await pc.save({ validateBeforeSave: false });
    res.json({ pinned: pc.pinned });
  } catch (err) {
    handleErr(err, res, next);
  }
};

// DELETE /api/pcs/:id
export const deletePc = async (req, res, next) => {
  try {
    const pc = await findMine(req);
    if (!pc) return bad(res, 404, "PC tidak ditemukan");
    await pc.deleteOne();
    res.json({ message: "PC dihapus" });
  } catch (err) {
    handleErr(err, res, next);
  }
};