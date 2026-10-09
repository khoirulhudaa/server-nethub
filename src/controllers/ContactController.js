import mongoose from "mongoose";
import Contact, { CONTACT_CATEGORIES, normalizePhone } from "../models/Contact.js";

// ===== Helpers =====
const escapeRegex = (s = "") => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isGuestUser = (u) => !u || u.isGuest || u.role === "guest";
const isSuperAdmin = (u) => u?.role === "superAdmin";

const httpError = (res, status, message) => res.status(status).json({ message });

// Field yang boleh diisi dari client (whitelist)
const EDITABLE_FIELDS = [
  "name", "nickname", "photo", "gender", "birthday",
  "company", "department", "jobTitle", "employeeId", "location",
  "phones", "emails", "addresses", "socials", "website",
  "category", "relationship", "tags",
  "availability", "notes", "isEmergency", "lastContactedAt", "visibility",
];

const pickBody = (body = {}) => {
  const data = {};
  EDITABLE_FIELDS.forEach((k) => {
    if (body[k] !== undefined) data[k] = body[k];
  });

  // Bersihkan array dari item kosong
  if (Array.isArray(data.phones)) {
    data.phones = data.phones.filter((p) => p?.number && String(p.number).trim());
  }
  if (Array.isArray(data.emails)) {
    data.emails = data.emails.filter((e) => e?.address && String(e.address).trim());
  }
  if (Array.isArray(data.socials)) {
    data.socials = data.socials.filter((s) => s?.handle && String(s.handle).trim());
  }
  if (Array.isArray(data.addresses)) {
    data.addresses = data.addresses.filter((a) =>
      [a?.street, a?.district, a?.city, a?.province, a?.postalCode].some((v) => v && String(v).trim())
    );
  }
  if (Array.isArray(data.tags)) {
    data.tags = [...new Set(data.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean))];
  }
  if (data.birthday === "") data.birthday = null;
  if (data.lastContactedAt === "") data.lastContactedAt = null;

  return data;
};

// Filter akses: publik + milik sendiri (superAdmin lihat semua)
const accessFilter = (user) => {
  if (isSuperAdmin(user)) return {};
  return { $or: [{ visibility: "public" }, { createdBy: user._id }] };
};

const canModify = (contact, user) =>
  isSuperAdmin(user) || String(contact.createdBy?._id || contact.createdBy) === String(user._id);

const canView = (contact, user) =>
  isSuperAdmin(user) ||
  contact.visibility === "public" ||
  String(contact.createdBy?._id || contact.createdBy) === String(user._id);

// Bentuk respons: sembunyikan favoritedBy, tambahkan isFavorite & canEdit
const serialize = (doc, user) => {
  const c = doc.toObject ? doc.toObject() : doc;
  const uid = String(user._id);
  const isFavorite = (c.favoritedBy || []).some((id) => String(id) === uid);
  delete c.favoritedBy;
  return { ...c, isFavorite, canEdit: canModify(c, user) };
};

const handleValidation = (err, res, next) => {
  if (err.name === "ValidationError") {
    const first = Object.values(err.errors)[0];
    return httpError(res, 400, first?.message || "Data tidak valid");
  }
  if (err.name === "CastError") return httpError(res, 400, "ID tidak valid");
  return next(err);
};

// ===== GET /api/contacts =====
// Query: q, category, favorite=1, mine=1, emergency=1, letter=A, sort=name|-name|recent|-createdAt, page, limit
export const getContacts = async (req, res, next) => {
  try {
    if (isGuestUser(req.user)) return httpError(res, 403, "Guest tidak bisa mengakses buku telepon");

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(60, Math.max(1, parseInt(req.query.limit) || 12));
    const skip = (page - 1) * limit;

    const and = [accessFilter(req.user)];

    const q = (req.query.q || "").trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      const digits = normalizePhone(q);
      const or = [
        { name: rx }, { nickname: rx }, { company: rx }, { department: rx },
        { jobTitle: rx }, { location: rx }, { employeeId: rx }, { relationship: rx },
        { tags: rx }, { "emails.address": rx }, { "phones.number": rx },
      ];
      if (digits.length >= 3) or.push({ "phones.normalized": new RegExp(escapeRegex(digits)) });
      and.push({ $or: or });
    }

    if (req.query.category && CONTACT_CATEGORIES.includes(req.query.category)) {
      and.push({ category: req.query.category });
    }
    if (req.query.favorite === "1") and.push({ favoritedBy: req.user._id });
    if (req.query.mine === "1") and.push({ createdBy: req.user._id });
    if (req.query.emergency === "1") and.push({ isEmergency: true });
    if (/^[a-z]$/i.test(req.query.letter || "")) {
      and.push({ name: new RegExp(`^${req.query.letter}`, "i") });
    }

    const filter = { $and: and.filter((f) => Object.keys(f).length) };
    if (!filter.$and.length) delete filter.$and;

    const sortMap = {
      name: { name: 1 },
      "-name": { name: -1 },
      recent: { lastContactedAt: -1, name: 1 },
      "-createdAt": { createdAt: -1 },
    };
    const sort = sortMap[req.query.sort] || sortMap.name;

    const [contacts, total] = await Promise.all([
      Contact.find(filter)
        .collation({ locale: "id", strength: 2 })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate("createdBy", "name username avatar")
        .lean(),
      Contact.countDocuments(filter),
    ]);

    res.json({
      contacts: contacts.map((c) => serialize(c, req.user)),
      page,
      pages: Math.ceil(total / limit) || 1,
      total,
    });
  } catch (err) {
    handleValidation(err, res, next);
  }
};

// ===== GET /api/contacts/stats =====
export const getContactStats = async (req, res, next) => {
  try {
    if (isGuestUser(req.user)) return httpError(res, 403, "Tidak diizinkan");

    const base = accessFilter(req.user);
    const [byCategory, total, favorites, emergency] = await Promise.all([
      Contact.aggregate([
        { $match: base },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
      Contact.countDocuments(base),
      Contact.countDocuments({ ...base, favoritedBy: req.user._id }),
      Contact.countDocuments({ ...base, isEmergency: true }),
    ]);

    res.json({
      total,
      favorites,
      emergency,
      byCategory: Object.fromEntries(byCategory.map((x) => [x._id, x.count])),
    });
  } catch (err) {
    next(err);
  }
};

// ===== GET /api/contacts/:id =====
export const getContactById = async (req, res, next) => {
  try {
    if (isGuestUser(req.user)) return httpError(res, 403, "Tidak diizinkan");
    if (!mongoose.isValidObjectId(req.params.id)) return httpError(res, 400, "ID tidak valid");

    const contact = await Contact.findById(req.params.id)
      .populate("createdBy", "name username avatar")
      .populate("updatedBy", "name username");
    if (!contact || !canView(contact, req.user)) return httpError(res, 404, "Kontak tidak ditemukan");

    res.json({ contact: serialize(contact, req.user) });
  } catch (err) {
    handleValidation(err, res, next);
  }
};

// ===== POST /api/contacts =====
export const createContact = async (req, res, next) => {
  try {
    if (isGuestUser(req.user)) return httpError(res, 403, "Guest tidak bisa menambah kontak");

    const data = pickBody(req.body);
    if (!data.name?.trim()) return httpError(res, 400, "Nama wajib diisi");
    if (!data.phones?.length) return httpError(res, 400, "Minimal 1 nomor telepon wajib diisi");

    const contact = await Contact.create({
      ...data,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    res.status(201).json({ contact: serialize(contact, req.user) });
  } catch (err) {
    handleValidation(err, res, next);
  }
};

// ===== PUT /api/contacts/:id =====
export const updateContact = async (req, res, next) => {
  try {
    if (isGuestUser(req.user)) return httpError(res, 403, "Tidak diizinkan");
    if (!mongoose.isValidObjectId(req.params.id)) return httpError(res, 400, "ID tidak valid");

    const contact = await Contact.findById(req.params.id);
    if (!contact || !canView(contact, req.user)) return httpError(res, 404, "Kontak tidak ditemukan");
    if (!canModify(contact, req.user)) return httpError(res, 403, "Kamu tidak punya akses mengubah kontak ini");

    const data = pickBody(req.body);
    if (data.name !== undefined && !String(data.name).trim()) return httpError(res, 400, "Nama wajib diisi");
    if (data.phones !== undefined && !data.phones.length) {
      return httpError(res, 400, "Minimal 1 nomor telepon wajib diisi");
    }

    contact.set(data);
    contact.updatedBy = req.user._id;
    await contact.save(); // menjalankan validator & hook normalisasi

    res.json({ contact: serialize(contact, req.user) });
  } catch (err) {
    handleValidation(err, res, next);
  }
};

// ===== DELETE /api/contacts/:id =====
export const deleteContact = async (req, res, next) => {
  try {
    if (isGuestUser(req.user)) return httpError(res, 403, "Tidak diizinkan");
    if (!mongoose.isValidObjectId(req.params.id)) return httpError(res, 400, "ID tidak valid");

    const contact = await Contact.findById(req.params.id);
    if (!contact || !canView(contact, req.user)) return httpError(res, 404, "Kontak tidak ditemukan");
    if (!canModify(contact, req.user)) return httpError(res, 403, "Kamu tidak punya akses menghapus kontak ini");

    await contact.deleteOne();
    res.json({ message: "Kontak berhasil dihapus" });
  } catch (err) {
    handleValidation(err, res, next);
  }
};

// ===== PATCH /api/contacts/:id/favorite =====
export const toggleFavorite = async (req, res, next) => {
  try {
    if (isGuestUser(req.user)) return httpError(res, 403, "Tidak diizinkan");
    if (!mongoose.isValidObjectId(req.params.id)) return httpError(res, 400, "ID tidak valid");

    const contact = await Contact.findById(req.params.id).select("favoritedBy visibility createdBy");
    if (!contact || !canView(contact, req.user)) return httpError(res, 404, "Kontak tidak ditemukan");

    const uid = String(req.user._id);
    const has = contact.favoritedBy.some((id) => String(id) === uid);
    if (has) contact.favoritedBy.pull(req.user._id);
    else contact.favoritedBy.push(req.user._id);

    await contact.save({ validateBeforeSave: false });
    res.json({ isFavorite: !has });
  } catch (err) {
    handleValidation(err, res, next);
  }
};

// ===== PATCH /api/contacts/:id/contacted =====
// Catat "terakhir dihubungi" (dipanggil saat tombol Call / WhatsApp ditekan)
export const markContacted = async (req, res, next) => {
  try {
    if (isGuestUser(req.user)) return httpError(res, 403, "Tidak diizinkan");
    if (!mongoose.isValidObjectId(req.params.id)) return httpError(res, 400, "ID tidak valid");

    const contact = await Contact.findById(req.params.id).select("visibility createdBy");
    if (!contact || !canView(contact, req.user)) return httpError(res, 404, "Kontak tidak ditemukan");

    const lastContactedAt = new Date();
    await Contact.updateOne({ _id: contact._id }, { $set: { lastContactedAt } });
    res.json({ lastContactedAt });
  } catch (err) {
    handleValidation(err, res, next);
  }
};