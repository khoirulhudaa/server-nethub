import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/nama_database_kamu";
const NEW_AUTHOR_ID = "6abdbf8762d6944b9dd14898";

async function changeAllAuthors() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const Post = mongoose.connection.collection("posts");

    const result = await Post.updateMany(
      {}, // semua dokumen
      { $set: { author: new mongoose.Types.ObjectId(NEW_AUTHOR_ID) } }
    );

    console.log(`Berhasil mengubah author ${result.modifiedCount} dokumen`);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

changeAllAuthors();