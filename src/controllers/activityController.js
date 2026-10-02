import Activity from "../models/Activity.js";

// GET /api/activities
// Query: page, limit, action, userId
export const getActivities = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.action) filter.action = req.query.action;
    if (req.query.userId) filter.user = req.query.userId;

    const [activities, total] = await Promise.all([
      Activity.find(filter)
        .populate("user", "name username avatar title role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Activity.countDocuments(filter),
    ]);

    res.json({
      activities,
      page,
      pages: Math.ceil(total / limit) || 1,
      total,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/activities/stats  (opsional, ringkasan)
export const getActivityStats = async (req, res, next) => {
  try {
    const stats = await Activity.aggregate([
      {
        $group: {
          _id: "$action",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({ stats });
  } catch (err) {
    next(err);
  }
};