// Pakai SETELAH `protect`. Menolak akun guest.
export const noGuest = (req, res, next) => {
  const u = req.user;
  if (!u || u.isGuest || u.role === "guest") {
    return res.status(403).json({ message: "Fitur ini hanya untuk user yang sudah login" });
  }
  next();
};