import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import quizRoutes from "./routes/quizRouter.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import collectionRoutes from "./routes/hardwareRoutes.js";

dotenv.config();
connectDB();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://texnet-hub.vercel.app",
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",") : []),
].map((o) => o.trim().replace(/\/$/, ""));

app.use(
  cors({
    origin: (origin, cb) => {
      // origin kosong = request dari Postman/curl/server-to-server
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" })); // generous limit for base64 hardware images
const router = express.Router();


app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/hardware", collectionRoutes);
app.use("/api", commentRoutes); // exposes /api/posts/:postId/comments and /api/comments/:id
app.use("/api/quizzes", quizRoutes);                     // ← tambahkan
app.use("/api/announcements", announcementRoutes);
app.get("/", (req, res) => {
  res.json({ message: "Networking Hub API", status: "ok" });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "production") {
  app.listen(5000, () => console.log(`Running on port ${PORT}`));
}

export default app;