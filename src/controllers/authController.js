import { validationResult } from "express-validator";
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import jwt from 'jsonwebtoken';

export const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email is already registered" });

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);
    res.status(201).json({ token, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = generateToken(user._id);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res) => {
  // Guest
  if (req.user?.isGuest || req.user?.role === "guest") {
    return res.json({
      user: {
        id: "guest",
        name: "Guest Reader",
        role: "guest",
        isGuest: true,
      },
    });
  }

  res.json({ user: req.user.toSafeObject() });
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, title, avatar } = req.body;
    const user = req.user;
    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (title !== undefined) user.title = title;
    if (avatar !== undefined) user.avatar = avatar;
    await user.save();
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

export const getAuthorProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select(
      "name username avatar bio title createdAt followers following"
    );
    if (!user) return res.status(404).json({ message: "Author not found" });
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// PUT /auth/me/username
export const changeUsername = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const normalized = req.body.username.trim().toLowerCase();
    const taken = await User.findOne({ username: normalized, _id: { $ne: req.user._id } });
    if (taken) return res.status(409).json({ message: "Username is already taken" });

    req.user.username = normalized;
    await req.user.save();
    res.json({ user: req.user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// PUT /auth/me/email
export const changeEmail = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const { email, currentPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");
    const matches = await user.comparePassword(currentPassword);
    if (!matches) return res.status(401).json({ message: "Current password is incorrect" });

    const normalized = email.trim().toLowerCase();
    const taken = await User.findOne({ email: normalized, _id: { $ne: user._id } });
    if (taken) return res.status(409).json({ message: "Email is already registered" });

    user.email = normalized;
    await user.save();
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// PUT /auth/me/password
export const changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");
    const matches = await user.comparePassword(currentPassword);
    if (!matches) return res.status(401).json({ message: "Current password is incorrect" });

    user.password = newPassword; // hashing terjadi otomatis di pre('save') hook
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/follow/:id
export const toggleFollow = async (req, res, next) => {
  try {
    // ===== BLOKIR GUEST =====
    if (req.user?.isGuest || req.user?.role === "guest" || req.user?._id === "guest") {
      return res.status(403).json({
        message: "Guest tidak bisa follow. Silakan daftar dulu.",
      });
    }

    const targetId = req.params.id;
    const myId = req.user._id;

    if (String(targetId) === String(myId)) {
      return res.status(400).json({ message: "Tidak bisa follow diri sendiri" });
    }

    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ message: "Author tidak ditemukan" });

    const me = await User.findById(myId);
    if (!me) return res.status(401).json({ message: "User tidak ditemukan" });

    const alreadyFollowing = (me.following || []).some(
      (id) => String(id) === String(targetId)
    );

    if (alreadyFollowing) {
      await Promise.all([
        User.findByIdAndUpdate(myId, { $pull: { following: targetId } }),
        User.findByIdAndUpdate(targetId, { $pull: { followers: myId } }),
      ]);
      const updated = await User.findById(targetId).select("followers");
      return res.json({
        following: false,
        message: "Unfollowed",
        followersCount: updated?.followers?.length || 0,
      });
    }

    await Promise.all([
      User.findByIdAndUpdate(myId, { $addToSet: { following: targetId } }),
      User.findByIdAndUpdate(targetId, { $addToSet: { followers: myId } }),
    ]);
    const updated = await User.findById(targetId).select("followers");
    return res.json({
      following: true,
      message: "Followed",
      followersCount: updated?.followers?.length || 0,
    });
    return res.json({ following: true, message: "Followed" });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me/following
export const getMyFollowing = async (req, res, next) => {
  try {
    // ===== BLOKIR GUEST =====
    if (req.user?.isGuest || req.user?.role === "guest" || req.user?._id === "guest") {
      return res.json({ following: [] });
    }

    const user = await User.findById(req.user._id)
      .populate("following", "name avatar title")
      .select("following");

    if (!user) return res.json({ following: [] });

    res.json({ following: user.following || [] });
  } catch (err) {
    next(err);
  }
};

export const guestLogin = async (req, res, next) => {
  try {
    const guestPayload = {
      id: "guest",
      role: "guest",
    };

    const token = jwt.sign(guestPayload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: "guest",
        name: "Guest Reader",
        role: "guest",
        isGuest: true,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me/reading-list
export const getReadingList = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: "readingList.post",
        select: "title slug excerpt coverImage category views likes author createdAt",
        populate: { path: "author", select: "name avatar title" },
      })
      .select("readingList");

    // sort by order
    const list = (user.readingList || [])
      .filter((item) => item.post) // buang yang post-nya sudah dihapus
      .sort((a, b) => a.order - b.order);

    const completed = list.filter((i) => i.completed).length;
    const total = list.length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    res.json({
      readingList: list,
      stats: { total, completed, progress, remaining: total - completed },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/me/reading-list  body: { postId, plannedDate?, notes? }
export const addToReadingList = async (req, res, next) => {
  try {
    const { postId, plannedDate, notes } = req.body;
    const user = await User.findById(req.user._id);

    // cek apakah sudah ada
    const exists = user.readingList.some(
      (item) => String(item.post) === String(postId)
    );
    if (exists) {
      return res.status(400).json({ message: "Guide sudah ada di Reading List" });
    }

    // ambil order tertinggi + 1
    const maxOrder = user.readingList.reduce(
      (max, item) => Math.max(max, item.order || 0),
      0
    );

    user.readingList.push({
      post: postId,
      order: maxOrder + 1,
      plannedDate: plannedDate || null,
      notes: notes || "",
    });

    await user.save();
    res.status(201).json({ message: "Ditambahkan ke Reading List" });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/auth/me/reading-list/:postId
export const removeFromReadingList = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.readingList = user.readingList.filter(
      (item) => String(item.post) !== String(req.params.postId)
    );

    // re-normalize order
    user.readingList
      .sort((a, b) => a.order - b.order)
      .forEach((item, idx) => (item.order = idx + 1));

    await user.save();
    res.json({ message: "Dihapus dari Reading List" });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/auth/me/reading-list/:postId/complete
export const toggleReadingListComplete = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const item = user.readingList.find(
      (i) => String(i.post) === String(req.params.postId)
    );
    if (!item) return res.status(404).json({ message: "Tidak ditemukan di list" });

    item.completed = !item.completed;
    item.completedAt = item.completed ? new Date() : null;

    await user.save();
    res.json({ completed: item.completed });
  } catch (err) {
    next(err);
  }
};

// PUT /api/auth/me/reading-list  body: { orderedPostIds: ["id1", "id2", ...] }
export const reorderReadingList = async (req, res, next) => {
  try {
    const { orderedPostIds } = req.body; // array of postId sesuai urutan baru
    const user = await User.findById(req.user._id);

    const newList = [];
    orderedPostIds.forEach((postId, index) => {
      const existing = user.readingList.find(
        (i) => String(i.post) === String(postId)
      );
      if (existing) {
        newList.push({
          ...existing.toObject(),
          order: index + 1,
        });
      }
    });

    user.readingList = newList;
    await user.save();
    res.json({ message: "Urutan berhasil diubah" });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/auth/me/reading-list/:postId  (update plannedDate / notes)
export const updateReadingListItem = async (req, res, next) => {
  try {
    const { plannedDate, notes } = req.body;
    const user = await User.findById(req.user._id);
    const item = user.readingList.find(
      (i) => String(i.post) === String(req.params.postId)
    );
    if (!item) return res.status(404).json({ message: "Tidak ditemukan" });

    if (plannedDate !== undefined) item.plannedDate = plannedDate || null;
    if (notes !== undefined) item.notes = notes;

    await user.save();
    res.json({ message: "Updated" });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me/highlights/:postId
export const getHighlights = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("highlights");
    const entry = user.highlights?.find(
      (h) => String(h.post) === String(req.params.postId)
    );
    res.json({ highlights: entry?.items || [] });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/me/highlights/:postId
// body: { text, color }
export const addHighlight = async (req, res, next) => {
  try {
    const { text, color } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ message: "Text is required" });
    }

    const user = await User.findById(req.user._id);
    let entry = user.highlights.find(
      (h) => String(h.post) === String(req.params.postId)
    );

    if (!entry) {
      user.highlights.push({
        post: req.params.postId,
        items: [{ text: text.trim(), color: color || "#fef08a" }],
      });
    } else {
      // Cegah duplikat
      const exists = entry.items.some((i) => i.text === text.trim());
      if (!exists) {
        entry.items.push({ text: text.trim(), color: color || "#fef08a" });
      }
    }

    await user.save();
    const updated = user.highlights.find(
      (h) => String(h.post) === String(req.params.postId)
    );
    res.json({ highlights: updated?.items || [] });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/auth/me/highlights/:postId
// body: { text }
export const removeHighlight = async (req, res, next) => {
  try {
    const { text } = req.body;
    const user = await User.findById(req.user._id);

    const entry = user.highlights.find(
      (h) => String(h.post) === String(req.params.postId)
    );
    if (!entry) return res.json({ highlights: [] });

    entry.items = entry.items.filter((i) => i.text !== text);
    await user.save();

    res.json({ highlights: entry.items });
  } catch (err) {
    next(err);
  }
};