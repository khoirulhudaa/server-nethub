import { Router } from "express";
import {
  getTasks, getTaskStats, getTaskById, createTask, updateTask,
  toggleTask, toggleChecklistItem, deleteTask, clearCompleted,
} from "../controllers/taskController.js";
import { protect } from "../middleware/auth.js";
import { noGuest } from "../middleware/noGuest.js";

const router = Router();
router.use(protect, noGuest);

// Route statis di atas "/:id"
router.get("/stats", getTaskStats);
router.delete("/completed", clearCompleted);

router.route("/").get(getTasks).post(createTask);
router.patch("/:id/toggle", toggleTask);
router.patch("/:id/checklist/:idx", toggleChecklistItem);
router.route("/:id").get(getTaskById).put(updateTask).delete(deleteTask);

export default router;