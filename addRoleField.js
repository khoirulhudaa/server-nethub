/**
 * Script migrasi: menambahkan field `role` ke semua user yang belum punya.
 * Default: "user"
 *
 * Cara pakai:
 *   node scripts/addRoleField.js
 *
 * Pastikan .env sudah berisi MONGODB_URI yang benar (production).
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Support ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env dari root project
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGODB_URI = 'mongodb+srv://muhammadkhoirulhuda111:Or7WWpo68Y2NpUy9@cluster0.vv8acqa.mongodb.net/?appName=Cluster0' || process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI / MONGO_URI tidak ditemukan di .env");
  process.exit(1);
}

async function migrate() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected");

    const db = mongoose.connection.db;
    const users = db.collection("users");

    // 1. Cek berapa user yang belum punya field role
    const withoutRole = await users.countDocuments({
      role: { $exists: false },
    });

    console.log(`📊 User tanpa field role: ${withoutRole}`);

    if (withoutRole === 0) {
      console.log("✅ Semua user sudah punya field role. Tidak ada yang diubah.");
      await mongoose.disconnect();
      process.exit(0);
    }

    // 2. Update semua yang belum punya role → set default "user"
    const result = await users.updateMany(
      { role: { $exists: false } },
      { $set: { role: "user" } }
    );

    console.log(`✅ Updated ${result.modifiedCount} user(s) → role: "user"`);

    // 3. (Opsional) Tampilkan ringkasan role setelah migrasi
    const summary = await users
      .aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray();

    console.log("\n📈 Ringkasan role setelah migrasi:");
    summary.forEach((s) => {
      console.log(`   ${s._id || "(null)"}: ${s.count}`);
    });

    await mongoose.disconnect();
    console.log("\n🎉 Migrasi selesai. Koneksi ditutup.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error saat migrasi:", err);
    process.exit(1);
  }
}

migrate();