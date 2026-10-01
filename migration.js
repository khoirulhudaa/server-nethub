// migrate-pinned.js
// Migrasi: isPinned (boolean global) -> pinnedBy (array user, pin personal)
//
// Cara pakai (letakkan di folder backend, sejajar dengan package.json & .env):
//   node migrate-pinned.js --dry   # hanya simulasi, tidak mengubah data
//   node migrate-pinned.js         # jalankan migrasi sungguhan
//
// URI MongoDB dibaca dari .env (MONGODB_URI / MONGO_URI / DATABASE_URL)
// atau bisa dikirim langsung:
//   node migrate-pinned.js "mongodb+srv://user:pass@host/dbname"

import mongoose from "mongoose";

// Load .env kalau dotenv terpasang
try {
  await import("dotenv/config");
} catch {
  /* dotenv tidak ada, lanjut pakai env sistem / argumen */
}

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry");
const uriArg = args.find((a) => a.startsWith("mongodb"));

const MONGO_URI =
  uriArg ||
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  process.env.DATABASE_URL;

if (!MONGO_URI) {
  console.error(
    "❌ URI MongoDB tidak ditemukan. Isi MONGODB_URI di .env atau kirim sebagai argumen."
  );
  process.exit(1);
}

const run = async () => {
  console.log(DRY_RUN ? "🔎 MODE DRY-RUN (tidak ada data yang diubah)\n" : "🚀 Menjalankan migrasi\n");

  await mongoose.connect(MONGO_URI);
  console.log(`✅ Terhubung ke database: ${mongoose.connection.name}`);

  // Pakai collection langsung supaya tidak bergantung pada schema Post terbaru
  const posts = mongoose.connection.db.collection("posts");

  const totalPosts = await posts.countDocuments();
  const pinnedOld = await posts.countDocuments({ isPinned: true });
  const hasField = await posts.countDocuments({ isPinned: { $exists: true } });

  console.log(`📄 Total post              : ${totalPosts}`);
  console.log(`📌 Post dengan isPinned=true: ${pinnedOld}`);
  console.log(`🗂  Post yang punya field isPinned: ${hasField}\n`);

  if (DRY_RUN) {
    console.log("Dry-run selesai. Jalankan tanpa --dry untuk menerapkan perubahan.");
    return;
  }

  // 1) Pin lama dianggap milik author. $setUnion mencegah duplikat
  //    dan tidak menimpa pinnedBy yang sudah ada.
  const r1 = await posts.updateMany({ isPinned: true }, [
    {
      $set: {
        pinnedBy: {
          $setUnion: [{ $ifNull: ["$pinnedBy", []] }, ["$author"]],
        },
      },
    },
  ]);
  console.log(`1️⃣  pinnedBy diisi      : ${r1.modifiedCount} post`);

  // 2) Pastikan semua post punya field pinnedBy (minimal array kosong)
  const r2 = await posts.updateMany(
    { pinnedBy: { $exists: false } },
    { $set: { pinnedBy: [] } }
  );
  console.log(`2️⃣  pinnedBy default [] : ${r2.modifiedCount} post`);

  // 3) Hapus field isPinned yang sudah tidak dipakai
  const r3 = await posts.updateMany(
    { isPinned: { $exists: true } },
    { $unset: { isPinned: "" } }
  );
  console.log(`3️⃣  isPinned dihapus    : ${r3.modifiedCount} post`);

  // 4) Index baru sesuai model
  await posts.createIndex({ pinnedBy: 1, createdAt: -1 });
  await posts.createIndex({ createdAt: -1 });
  await posts.createIndex({ category: 1, createdAt: -1 });
  await posts.createIndex({ author: 1, createdAt: -1 });
  console.log("4️⃣  Index dibuat/dipastikan ada");

  // Verifikasi
  const withPins = await posts.countDocuments({ "pinnedBy.0": { $exists: true } });
  const leftover = await posts.countDocuments({ isPinned: { $exists: true } });
  console.log(`\n✅ Selesai. Post dengan pin: ${withPins}, sisa isPinned: ${leftover}`);
};

run()
  .catch((err) => {
    console.error("❌ Migrasi gagal:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });