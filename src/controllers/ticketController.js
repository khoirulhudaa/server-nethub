import Ticket from "../models/Ticket.js";
import Post from "../models/Post.js";
import {
  TICKET_CATEGORIES_LIST,
  TICKET_STATUS_LIST,
  TICKET_PRIORITY_LIST,
} from "../models/Ticket.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

// ====================== CREATE ======================
export const createTicket = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      sinceWhen,
      requesterName,
      location,
      pcOwner,
      computerName,
      anydeskNumber,
      anydeskPassword,
      priority,
      attachments,
    } = req.body;

    // Validasi field wajib
    if (
      !title?.trim() ||
      !description?.trim() ||
      !category ||
      !sinceWhen ||
      !location ||
      !pcOwner?.trim() ||
      !requesterName?.trim()
    ) {
      return res.status(400).json({ message: "Field wajib belum lengkap" });
    }

    const ticketData = {
      title: title.trim(),
      description: description.trim(),
      category,
      sinceWhen,
      requesterName: requesterName.trim(),          // ← ambil dari form
      location: location.trim(),
      pcOwner: pcOwner.trim(),
      computerName: computerName || "",
      anydeskNumber: anydeskNumber || "",
      anydeskPassword: anydeskPassword || "",
      priority: priority || "Medium",
      attachments: attachments || [],
      statusHistory: [
        {
          status: "Baru",
          changedBy: req.user?._id || null,
          note: req.user ? "Tiket dibuat" : "Tiket dibuat oleh guest",
        },
      ],
    };

    // Hanya isi createdBy kalau user login
    if (req.user?._id) {
      ticketData.createdBy = req.user._id;
    }

    const ticket = await Ticket.create(ticketData);

    const populated = await ticket.populate("createdBy", "name avatar title");

    // ===== Buat notifikasi untuk Admin =====
    try {
      const admins = await User.find({
        role: { $in: ["admin", "superAdmin"] },
      }).select("_id");

      if (admins.length > 0) {
        const notifications = admins.map((admin) => ({
          recipient: admin._id,
          type: "new_ticket",
          title: "Tiket Baru Masuk",
          message: `${requesterName} membuat tiket: ${ticket.title}`,
          link: `/tickets/${ticket._id}`,
          meta: { ticketId: ticket._id },
        }));

        await Notification.insertMany(notifications);
      }
    } catch (notifErr) {
      console.error("Gagal membuat notifikasi:", notifErr.message);
    }

    res.status(201).json({ ticket: populated });
  } catch (err) {
    next(err);
  }
};

// ====================== GET ALL (Admin / Own) ======================
export const getTickets = async (req, res, next) => {
  try {
    const { status, category, priority, page = 1, limit = 20, search } = req.query;
    const isAdmin = req.user.role === "superAdmin" || req.user.role === "admin";

    const filter = {};

    // User biasa hanya lihat miliknya
    if (!isAdmin) {
      filter.createdBy = req.user._id;
    }

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate("createdBy", "name avatar title")
        .populate("assignedTo", "name avatar")
        .populate("usedGuide", "title slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Ticket.countDocuments(filter),
    ]);

    res.json({
      tickets,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    next(err);
  }
};

// ====================== GET DETAIL + REKOMENDASI GUIDES ======================
// ====================== GET DETAIL + REKOMENDASI GUIDES ======================
export const getTicketById = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("createdBy", "name avatar title")
      .populate("assignedTo", "name avatar title")
      .populate("usedGuide", "title slug category")
      .populate("comments.user", "name avatar title")
      .populate("statusHistory.changedBy", "name");

    if (!ticket) {
      return res.status(404).json({ message: "Tiket tidak ditemukan" });
    }

    // ===== Authorization =====
    const isAdmin = req.user?.role === "superAdmin" || req.user?.role === "admin";
    
    // Kalau tiket dibuat guest (createdBy null), hanya admin yang boleh lihat
    // Kalau ada createdBy, pemilik atau admin yang boleh
    const isOwner = ticket.createdBy && String(ticket.createdBy._id) === String(req.user?._id);

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "Akses ditolak" });
    }

    // ===== Rekomendasi Guides (versi aman) =====
    let recommendedGuides = [];
    let bestGuide = null;

    try {
      const categoryMap = {
        Network: "Topology",
        "PC/Laptop": "Hardware",
        Printer: "Hardware",
        Server: "Installation",
        Email: "Maintenance",
        Aplikasi: "Code",
        Lainnya: null,
      };

      const mappedCategory = categoryMap[ticket.category];

      // Query sederhana & aman (tanpa $text dulu supaya tidak error)
      const postFilter = {};

      if (mappedCategory) {
        postFilter.category = mappedCategory;
      }

      // Ambil guides berdasarkan kategori dulu
      recommendedGuides = await Post.find(postFilter)
        .select("title slug excerpt category tags coverImage views")
        .sort({ views: -1, createdAt: -1 })
        .limit(5)
        .lean();

      // Kalau ingin lebih pintar, bisa filter manual pakai keyword
      if (recommendedGuides.length > 0) {
        const keywords = `${ticket.title} ${ticket.description}`
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w.length > 3);

        // Urutkan manual yang paling banyak mengandung keyword
        recommendedGuides = recommendedGuides
          .map((guide) => {
            const text = `${guide.title} ${guide.excerpt} ${(guide.tags || []).join(" ")}`.toLowerCase();
            const score = keywords.reduce((acc, kw) => (text.includes(kw) ? acc + 1 : acc), 0);
            return { ...guide, score };
          })
          .sort((a, b) => b.score - a.score || b.views - a.views);

        bestGuide = recommendedGuides[0] || null;
      }
    } catch (guideErr) {
      console.error("Gagal mengambil rekomendasi guides:", guideErr.message);
      // Jangan gagalkan seluruh request hanya karena rekomendasi error
    }

    res.json({
      ticket,
      recommendedGuides,
      bestGuide,
    });
  } catch (err) {
    next(err);
  }
};

// ====================== UPDATE STATUS ======================
export const updateTicketStatus = async (req, res, next) => {
  try {
    const { status, note, usedGuide, solutionNote } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) return res.status(404).json({ message: "Tiket tidak ditemukan" });

    const isAdmin = req.user.role === "superAdmin" || req.user.role === "admin";
    if (!isAdmin) {
      return res.status(403).json({ message: "Hanya admin yang boleh ubah status" });
    }

    if (!TICKET_STATUS_LIST.includes(status)) {
      return res.status(400).json({ message: "Status tidak valid" });
    }

    // Kosongkan AnyDesk saat selesai / ditutup
    if (["Selesai", "Ditutup"].includes(status)) {
      ticket.anydeskNumber = "";
      ticket.anydeskPassword = "";
    }

    ticket.status = status;
    if (usedGuide) ticket.usedGuide = usedGuide;
    if (solutionNote) ticket.solutionNote = solutionNote;

    ticket.statusHistory.push({
      status,
      changedBy: req.user._id,
      note: note || "",
    });

    await ticket.save();

    const populated = await Ticket.findById(ticket._id)
      .populate("createdBy", "name avatar")
      .populate("assignedTo", "name avatar")
      .populate("usedGuide", "title slug");

    res.json({ ticket: populated });
  } catch (err) {
    next(err);
  }
};

// ====================== ADD COMMENT ======================
export const addTicketComment = async (req, res, next) => {
  try {
    const { content, isInternal = false } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) return res.status(404).json({ message: "Tiket tidak ditemukan" });

    if (!content?.trim()) {
      return res.status(400).json({ message: "Komentar tidak boleh kosong" });
    }

    const isAdmin = req.user.role === "superAdmin" || req.user.role === "admin";
    const isOwner = String(ticket.createdBy) === String(req.user._id);

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "Akses ditolak" });
    }

    // User biasa tidak boleh buat komentar internal
    const finalIsInternal = isAdmin ? Boolean(isInternal) : false;

    ticket.comments.push({
      user: req.user._id,
      content: content.trim(),
      isInternal: finalIsInternal,
    });

    await ticket.save();

    const populated = await Ticket.findById(ticket._id)
      .populate("comments.user", "name avatar title");

    res.status(201).json({ comments: populated.comments });
  } catch (err) {
    next(err);
  }
};

// ====================== GET OPTIONS (untuk form) ======================
export const getTicketOptions = async (req, res) => {
  res.json({
    categories: TICKET_CATEGORIES_LIST,
    statuses: TICKET_STATUS_LIST,
    priorities: TICKET_PRIORITY_LIST,
  });
};