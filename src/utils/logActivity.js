import Activity from "../models/Activity.js";

/**
 * Mencatat aktivitas user.
 * Jangan pernah throw error ke caller — logging gagal tidak boleh merusak request utama.
 */
export const logActivity = async ({
  userId,
  action,
  targetType = null,
  targetId = null,
  metadata = {},
  req = null,
}) => {
  try {
    // Jangan log guest
    if (!userId || userId === "guest") return;

    const ip =
      req?.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req?.ip ||
      req?.socket?.remoteAddress ||
      "";

    const userAgent = req?.headers["user-agent"] || "";

    await Activity.create({
      user: userId,
      action,
      targetType,
      targetId,
      metadata,
      ip,
      userAgent,
    });
  } catch (err) {
    console.error("[logActivity] failed:", err.message);
  }
};