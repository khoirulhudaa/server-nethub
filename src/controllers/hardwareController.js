import Hardware, { HARDWARE_CATEGORIES_LIST } from "../models/Hardware.js";

// GET /api/hardware — publik (hanya published)
export const getHardwareList = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const filter = { isPublished: true };

    if (category && HARDWARE_CATEGORIES_LIST.includes(category)) {
      filter.category = category;
    }
    if (search?.trim()) {
      filter.$text = { $search: search.trim() };
    }

    const items = await Hardware.find(filter)
      .populate("createdBy", "name avatar")
      .sort({ createdAt: -1 });

    res.json({ items, categories: HARDWARE_CATEGORIES_LIST });
  } catch (err) {
    next(err);
  }
};

// GET /api/hardware/admin — semua (superAdmin)
export const getAllHardware = async (req, res, next) => {
  try {
    const items = await Hardware.find()
      .populate("createdBy", "name avatar")
      .sort({ createdAt: -1 });
    res.json({ items, categories: HARDWARE_CATEGORIES_LIST });
  } catch (err) {
    next(err);
  }
};

// GET /api/hardware/:id
export const getHardwareById = async (req, res, next) => {
  try {
    const item = await Hardware.findById(req.params.id).populate(
      "createdBy",
      "name avatar"
    );
    if (!item) return res.status(404).json({ message: "Hardware tidak ditemukan" });
    res.json({ item });
  } catch (err) {
    next(err);
  }
};

// POST /api/hardware
export const createHardware = async (req, res, next) => {
  try {
    const { name, brand, category, description, image, specs, accentColor, isPublished } =
      req.body;

    if (!name?.trim() || !image) {
      return res.status(400).json({ message: "Nama dan gambar wajib diisi" });
    }

    const item = await Hardware.create({
      name: name.trim(),
      brand: brand?.trim() || "",
      category: category || "Other",
      description: description?.trim() || "",
      image,
      element: req.body.element || "protocol",
      power: req.body.power != null ? Number(req.body.power) : 100,
      specs: Array.isArray(specs) ? specs : [],
      accentColor: accentColor || "#3b82f6",
      isPublished: isPublished !== undefined ? isPublished : true,
      createdBy: req.user._id,
    });

    const populated = await item.populate("createdBy", "name avatar");
    res.status(201).json({ item: populated });
  } catch (err) {
    next(err);
  }
};

// PUT /api/hardware/:id
export const updateHardware = async (req, res, next) => {
  try {
    const item = await Hardware.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Hardware tidak ditemukan" });
    }

    const fields = [
      "name",
      "brand",
      "category",
      "description",
      "image",
      "specs",
      "accentColor",
      "isPublished",
      "element", // ← wajib
      "power",   // ← wajib
    ];

    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        item[f] = req.body[f];
      }
    });

    // optional: normalisasi power
    if (req.body.power !== undefined) {
      item.power = Number(req.body.power) || 100;
    }

    await item.save();
    const populated = await item.populate("createdBy", "name avatar");
    res.json({ item: populated });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/hardware/:id
export const deleteHardware = async (req, res, next) => {
  try {
    const item = await Hardware.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Hardware tidak ditemukan" });
    await item.deleteOne();
    res.json({ message: "Hardware dihapus" });
  } catch (err) {
    next(err);
  }
};