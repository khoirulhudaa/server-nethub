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

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" })); // generous limit for base64 hardware images
const router = express.Router();

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "networking-hub-api" }));

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/hardware", collectionRoutes);
app.use("/api", commentRoutes); // exposes /api/posts/:postId/comments and /api/comments/:id
app.use("/api/quizzes", quizRoutes);                     // ← tambahkan
app.use("/api/announcements", announcementRoutes);
router.get("/", (req, res) => {
  res.json({
    message: "Test route berjalan dengan baik",
    timestamp: new Date().toISOString(),
  });
});

router.post("/echo", (req, res) => {
  res.json({ received: req.body });
});

app.use("/api/test", router);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "production") {
  app.listen(5000, () => console.log(`Networking Hub API running on port ${PORT}`));
}

export default app