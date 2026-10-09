import mongoose from "mongoose";
import Note, { NOTE_COLORS, NOTE_MOODS } from "../models/Note.js";

const escapeRegex = (s = "") => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const bad = (res, status, message) => res.status(status).json({ message });

const EDITABLE = ["title", "content", "entryDate", "mood", "color", "tags", "pinned"];

const pickBody = (body = {}) => {
  const data = {};
  EDITABLE.forEach((k) => body[k] !== undefined && (data[k] = body[k]));
  if (data.entryDate === "" || data.entryDate === null) delete data.entryDate;
  if (Array.isArray(data.tags)) {
    data.tags = [...new Set(data.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean))];
  }
  return data;
};

const handleErr = (err, res, next) => {
  if (err.name === "ValidationError") return bad(res, 400, Object.values(err.errors)[0]?.message || "Data tidak valid");
  if (err.name === "CastError") return bad(res, 400, "ID tidak valid");
  return next(err);
};

const findMine = async (req) =>
  mongoose.isValidObjectId(req.params.id)
    ? Note.findOne({ _id: req.params.id, owner: req.user._id })
    : null;

// GET /api/notes
// Query: q, mood, color, tag, month=YYYY-MM, pinned=1, sort(newest|oldest), page, limit, tzOffset
export const getNotes = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));

    const filter = { owner: req.user._id };
    if (NOTE_MOODS.includes(req.query.mood) && req.query.mood) filter.mood = req.query.mood;
    if (NOTE_COLORS.includes(req.query.color)) filter.color = req.query.color;
    if (req.query.tag) filter.tags = String(req.query.tag).toLowerCase();
    if (req.query.pinned === "1") filter.pinned = true;

    const m = /^(\d{4})-(\d{2})$/.exec(req.query.month || "");
    if (m) {
      const off = (Number(req.query.tzOffset) || 0) * 60000;
      const y = Number(m[1]);
      const mo = Number(m[2]);
      filter.entryDate = {
        $gte: new Date(Date.UTC(y, mo - 1, 1) + off),
        $lt: new Date(Date.UTC(y, mo, 1) + off),
      };
    }

    const q = (req.query.q || "").trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ title: rx }, { content: rx }, { tags: rx }];
    }

    const sort =
      req.query.sort === "oldest"
        ? { pinned: -1, entryDate: 1, createdAt: 1 }
        : { pinned: -1, entryDate: -1, createdAt: -1 };

    const [docs, total] = await Promise.all([
      Note.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
      Note.countDocuments(filter),
    ]);

    // List hanya mengirim cuplikan, isi lengkap diambil lewat GET /:id
    const notes = docs.map(({ content = "", ...n }) => ({
      ...n,
      preview: content.slice(0, 320),
      wordCount: content.trim() ? content.trim().split(/\s+/).length : 0,
    }));

    res.json({ notes, page, pages: Math.ceil(total / limit) || 1, total });
  } catch (err) {
    handleErr(err, res, next);
  }
};

// GET /api/notes/stats
export const getNoteStats = async (req, res, next) => {
  try {
    const owner = new mongoose.Types.ObjectId(String(req.user._id));
    const [total, pinned, byMood] = await Promise.all([
      Note.countDocuments({ owner }),
      Note.countDocuments({ owner, pinned: true }),
      Note.aggregate([{ $match: { owner, mood: { $ne: "" } } }, { $group: { _id: "$mood", count: { $sum: 1 } } }]),
    ]);
    res.json({ total, pinned, byMood: Object.fromEntries(byMood.map((x) => [x._id, x.count])) });
  } catch (err) {
    next(err);
  }
};

// GET /api/notes/:id
export const getNoteById = async (req, res, next) => {
  try {
    const note = await findMine(req);
    if (!note) return bad(res, 404, "Catatan tidak ditemukan");
    res.json({ note });
  } catch (err) {
    handleErr(err, res, next);
  }
};

// POST /api/notes
export const createNote = async (req, res, next) => {
  try {
    const note = await Note.create({ ...pickBody(req.body), owner: req.user._id });
    res.status(201).json({ note });
  } catch (err) {
    handleErr(err, res, next);
  }
};

// PUT /api/notes/:id
export const updateNote = async (req, res, next) => {
  try {
    const note = await findMine(req);
    if (!note) return bad(res, 404, "Catatan tidak ditemukan");
    note.set(pickBody(req.body));
    await note.save();
    res.json({ note });
  } catch (err) {
    handleErr(err, res, next);
  }
};

// PATCH /api/notes/:id/pin
export const togglePin = async (req, res, next) => {
  try {
    const note = await findMine(req);
    if (!note) return bad(res, 404, "Catatan tidak ditemukan");
    note.pinned = !note.pinned;
    await note.save({ validateBeforeSave: false });
    res.json({ pinned: note.pinned });
  } catch (err) {
    handleErr(err, res, next);
  }
};

// DELETE /api/notes/:id
export const deleteNote = async (req, res, next) => {
  try {
    const note = await findMine(req);
    if (!note) return bad(res, 404, "Catatan tidak ditemukan");
    await note.deleteOne();
    res.json({ message: "Catatan dihapus" });
  } catch (err) {
    handleErr(err, res, next);
  }
};