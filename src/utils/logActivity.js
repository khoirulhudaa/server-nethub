import Activity from "../models/Activity.js";

// "::ffff:1.2.3.4" -> "1.2.3.4"
const normalizeIp = (raw = "") => String(raw).trim().replace(/^::ffff:/i, "").slice(0, 64);

/**
 * Ambil IP client.
 * - Utamakan req.ip. Kalau app.set("trust proxy", 1) aktif, Express sudah membaca
 *   X-Forwarded-For dengan benar dan aman.
 * - X-Forwarded-For dipakai hanya sebagai cadangan, karena header itu bisa dipalsukan
 *   client kalau tidak ada proxy tepercaya di depan server.
 */
export const getClientIp = (req) => {
  if (!req) return "";
  const forwarded = req.headers?.["x-forwarded-for"]?.split(",")[0];
  return normalizeIp(req.ip || req.socket?.remoteAddress || forwarded || "");
};

// Dibatasi panjangnya supaya header iseng tidak membengkakkan database
export const getUserAgent = (req) =>
  String(req?.headers?.["user-agent"] || "").slice(0, 400);

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

    await Activity.create({
      user: userId,
      action,
      targetType,
      targetId,
      metadata,
      ip: getClientIp(req),
      userAgent: getUserAgent(req),
    });
  } catch (err) {
    console.error("[logActivity] failed:", err.message);
  }
};