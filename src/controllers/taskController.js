import mongoose from "mongoose";
import Task, { TASK_PRIORITIES, TASK_STATUSES } from "../models/Task.js";

const escapeRegex = (s = "") => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const bad = (res, status, message) => res.status(status).json({ message });

// Rentang "hari ini" sesuai zona waktu client (tzOffset = Date.getTimezoneOffset())
const dayRange = (tzOffset = 0) => {
  const off = Number(tzOffset) || 0;
  const local = Date.now() - off * 60000;
  const startLocal = Math.floor(local / 86400000) * 86400000;
  const start = new Date(startLocal + off * 60000);
  return { start, end: new Date(start.getTime() + 86400000) };
};

const nextDue = (date, repeat, minDate) => {
  let d = new Date(date);
  for (let i = 0; i < 400; i++) {
    if (repeat === "daily") d.setDate(d.getDate() + 1);
    else if (repeat === "weekly") d.setDate(d.getDate() + 7);
    else if (repeat === "monthly") d.setMonth(d.getMonth() + 1);
    else break;
    if (d >= minDate) break; // lompati siklus yang sudah lewat
  }
  return d;
};

const EDITABLE = ["title", "description", "status", "priority", "dueDate", "repeat", "listName", "tags", "checklist", "pinned"];

const pickBody = (body = {}) => {
  const data = {};
  EDITABLE.forEach((k) => body[k] !== undefined && (data[k] = body[k]));

  if (data.dueDate === "" || data.dueDate === undefined) delete data.dueDate;
  if (body.dueDate === "" || body.dueDate === null) data.dueDate = null;
  if (Array.isArray(data.tags)) {
    data.tags = [...new Set(data.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean))];
  }
  if (Array.isArray(data.checklist)) {
    data.checklist = data.checklist
      .filter((i) => i?.text && String(i.text).trim())
      .map((i) => ({ text: String(i.text).trim(), done: !!i.done }));
  }
  if (data.listName !== undefined && !String(data.listName).trim()) data.listName = "Umum";
  return data;
};

const handleErr = (err, res, next) => {
  if (err.name === "ValidationError") return bad(res, 400, Object.values(err.errors)[0]?.message || "Data tidak valid");
  if (err.name === "CastError") return bad(res, 400, "ID tidak valid");
  return next(err);
};

const findMine = (req) =>
  mongoose.isValidObjectId(req.params.id)
    ? Task.findOne({ _id: req.params.id, owner: req.user._id })
    : null;

// GET /api/tasks
// Query: q, status(active|done|todo|in_progress|all), priority, due(today|overdue|week|none), list, tag, sort, page, limit, tzOffset
export const getTasks = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 30));
    const { start, end } = dayRange(req.query.tzOffset);

    const filter = { owner: req.user._id };
    const status = req.query.status || "active";
    if (status === "active") filter.status = { $ne: "done" };
    else if (TASK_STATUSES.includes(status)) filter.status = status;

    if (TASK_PRIORITIES.includes(req.query.priority)) filter.priority = req.query.priority;
    if (req.query.list) filter.listName = req.query.list;
    if (req.query.tag) filter.tags = String(req.query.tag).toLowerCase();

    const due = req.query.due;
    if (due === "today") filter.dueDate = { $gte: start, $lt: end };
    else if (due === "overdue") filter.dueDate = { $lt: start };
    else if (due === "week") filter.dueDate = { $gte: start, $lt: new Date(start.getTime() + 7 * 86400000) };
    else if (due === "none") filter.dueDate = null;
    if (["today", "overdue", "week"].includes(due) && status !== "done") filter.status = { $ne: "done" };

    const q = (req.query.q || "").trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ title: rx }, { description: rx }, { tags: rx }, { "checklist.text": rx }];
    }

    const sortMap = {
      smart: { isDone: 1, pinned: -1, dueSortKey: 1, priorityRank: -1, createdAt: -1 },
      due: { isDone: 1, dueSortKey: 1, priorityRank: -1 },
      priority: { isDone: 1, priorityRank: -1, dueSortKey: 1 },
      newest: { createdAt: -1 },
      completed: { completedAt: -1 },
    };
    const sort = sortMap[req.query.sort] || sortMap.smart;

    const [tasks, total] = await Promise.all([
      Task.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
      Task.countDocuments(filter),
    ]);

    res.json({ tasks, page, pages: Math.ceil(total / limit) || 1, total });
  } catch (err) {
    handleErr(err, res, next);
  }
};

// GET /api/tasks/stats
export const getTaskStats = async (req, res, next) => {
  try {
    const { start, end } = dayRange(req.query.tzOffset);
    const owner = req.user._id;
    const active = { owner, status: { $ne: "done" } };

    const [total, activeCount, done, today, overdue, lists] = await Promise.all([
      Task.countDocuments({ owner }),
      Task.countDocuments(active),
      Task.countDocuments({ owner, status: "done" }),
      Task.countDocuments({ ...active, dueDate: { $gte: start, $lt: end } }),
      Task.countDocuments({ ...active, dueDate: { $lt: start } }),
      Task.distinct("listName", { owner }),
    ]);

    res.json({ total, active: activeCount, done, today, overdue, lists: lists.sort() });
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks/:id
export const getTaskById = async (req, res, next) => {
  try {
    const q = findMine(req);
    const task = q && (await q);
    if (!task) return bad(res, 404, "Tugas tidak ditemukan");
    res.json({ task });
  } catch (err) {
    handleErr(err, res, next);
  }
};

// POST /api/tasks
export const createTask = async (req, res, next) => {
  try {
    const data = pickBody(req.body);
    if (!data.title?.trim()) return bad(res, 400, "Judul tugas wajib diisi");
    const task = await Task.create({ ...data, owner: req.user._id });
    res.status(201).json({ task });
  } catch (err) {
    handleErr(err, res, next);
  }
};

// PUT /api/tasks/:id
export const updateTask = async (req, res, next) => {
  try {
    const q = findMine(req);
    const task = q && (await q);
    if (!task) return bad(res, 404, "Tugas tidak ditemukan");

    const data = pickBody(req.body);
    if (data.title !== undefined && !String(data.title).trim()) return bad(res, 400, "Judul tugas wajib diisi");

    task.set(data);
    await task.save();
    res.json({ task });
  } catch (err) {
    handleErr(err, res, next);
  }
};

// PATCH /api/tasks/:id/toggle  — selesai ↔ belum. Tugas berulang maju ke jadwal berikutnya.
export const toggleTask = async (req, res, next) => {
  try {
    const q = findMine(req);
    const task = q && (await q);
    if (!task) return bad(res, 404, "Tugas tidak ditemukan");

    let recurred = false;
    if (task.status === "done") {
      task.status = "todo";
    } else if (task.repeat !== "none" && task.dueDate) {
      task.dueDate = nextDue(task.dueDate, task.repeat, dayRange(req.query.tzOffset).start);
      task.checklist.forEach((i) => (i.done = false));
      task.status = "todo";
      recurred = true;
    } else {
      task.status = "done";
    }

    await task.save();
    res.json({ task, recurred });
  } catch (err) {
    handleErr(err, res, next);
  }
};

// PATCH /api/tasks/:id/checklist/:idx
export const toggleChecklistItem = async (req, res, next) => {
  try {
    const q = findMine(req);
    const task = q && (await q);
    if (!task) return bad(res, 404, "Tugas tidak ditemukan");

    const item = task.checklist[Number(req.params.idx)];
    if (!item) return bad(res, 404, "Sub-tugas tidak ditemukan");
    item.done = !item.done;

    await task.save();
    res.json({ task });
  } catch (err) {
    handleErr(err, res, next);
  }
};

// DELETE /api/tasks/:id
export const deleteTask = async (req, res, next) => {
  try {
    const q = findMine(req);
    const task = q && (await q);
    if (!task) return bad(res, 404, "Tugas tidak ditemukan");
    await task.deleteOne();
    res.json({ message: "Tugas dihapus" });
  } catch (err) {
    handleErr(err, res, next);
  }
};

// DELETE /api/tasks/completed
export const clearCompleted = async (req, res, next) => {
  try {
    const { deletedCount } = await Task.deleteMany({ owner: req.user._id, status: "done" });
    res.json({ deleted: deletedCount });
  } catch (err) {
    next(err);
  }
};