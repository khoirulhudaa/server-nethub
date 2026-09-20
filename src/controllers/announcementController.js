import Announcement from "../models/Announcement.js";

// GET /api/announcements  → public (hanya yang aktif)
export const getActiveAnnouncements = async (req, res, next) => {
  try {
    const now = new Date();

    const announcements = await Announcement.find({
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    })
      .populate("createdBy", "name avatar")
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ announcements });
  } catch (err) {
    next(err);
  }
};

// GET /api/announcements/:id  → public (detail 1 pengumuman)
export const getAnnouncementById = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate("createdBy", "name avatar");

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    // Opsional: hanya izinkan yang masih aktif & belum expired
    const now = new Date();
    const isExpired =
      announcement.expiresAt && new Date(announcement.expiresAt) <= now;

    if (!announcement.isActive || isExpired) {
      return res.status(404).json({ message: "Announcement not found or inactive" });
    }

    res.json({ announcement });
  } catch (err) {
    next(err);
  }
};

// GET /api/announcements/admin  → superAdmin only (semua)
export const getAllAnnouncements = async (req, res, next) => {
  try {
    const announcements = await Announcement.find()
      .populate("createdBy", "name avatar")
      .sort({ createdAt: -1 });

    res.json({ announcements });
  } catch (err) {
    next(err);
  }
};

// POST /api/announcements
export const createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, type, isActive, expiresAt } = req.body;

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const announcement = await Announcement.create({
      title: title.trim(),
      content: content.trim(),
      type: type || "info",
      isActive: isActive !== undefined ? isActive : true,
      expiresAt: expiresAt || null,
      createdBy: req.user._id,
    });

    const populated = await announcement.populate("createdBy", "name avatar");
    res.status(201).json({ announcement: populated });
  } catch (err) {
    next(err);
  }
};

// PUT /api/announcements/:id
export const updateAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    const { title, content, type, isActive, expiresAt } = req.body;

    if (title !== undefined) announcement.title = title.trim();
    if (content !== undefined) announcement.content = content.trim();
    if (type !== undefined) announcement.type = type;
    if (isActive !== undefined) announcement.isActive = isActive;
    if (expiresAt !== undefined) announcement.expiresAt = expiresAt || null;

    await announcement.save();

    const populated = await announcement.populate("createdBy", "name avatar");
    res.json({ announcement: populated });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/announcements/:id
export const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    await announcement.deleteOne();
    res.json({ message: "Announcement deleted" });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/announcements/:id/toggle
export const toggleActive = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    announcement.isActive = !announcement.isActive;
    await announcement.save();

    res.json({ announcement });
  } catch (err) {
    next(err);
  }
};