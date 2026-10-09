import mongoose from "mongoose";

export const TASK_STATUSES = ["todo", "in_progress", "done"];
export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"];
export const TASK_REPEATS = ["none", "daily", "weekly", "monthly"];

const PRIORITY_RANK = { low: 1, medium: 2, high: 3, urgent: 4 };

const checklistSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 200 },
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000, default: "" },

    status: { type: String, enum: TASK_STATUSES, default: "todo", index: true },
    priority: { type: String, enum: TASK_PRIORITIES, default: "medium" },
    dueDate: { type: Date, default: null },
    repeat: { type: String, enum: TASK_REPEATS, default: "none" },

    listName: { type: String, trim: true, maxlength: 40, default: "Umum" }, // pengelompokan: Pekerjaan, Pribadi, dll.
    tags: {
      type: [{ type: String, trim: true, lowercase: true, maxlength: 30 }],
      validate: { validator: (v) => v.length <= 6, message: "Maksimal 6 tags" },
      default: [],
    },
    checklist: {
      type: [checklistSchema],
      validate: { validator: (v) => v.length <= 30, message: "Maksimal 30 sub-tugas" },
      default: [],
    },
    pinned: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },

    // Field turunan (otomatis) untuk sorting
    priorityRank: { type: Number, default: 2 },
    dueSortKey: { type: Number, default: Number.MAX_SAFE_INTEGER },
    isDone: { type: Boolean, default: false },

    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

taskSchema.pre("validate", function (next) {
  this.priorityRank = PRIORITY_RANK[this.priority] || 2;
  this.dueSortKey = this.dueDate ? this.dueDate.getTime() : Number.MAX_SAFE_INTEGER;
  this.isDone = this.status === "done";
  if (this.isDone && !this.completedAt) this.completedAt = new Date();
  if (!this.isDone) this.completedAt = null;
  next();
});

taskSchema.index({ owner: 1, isDone: 1, dueSortKey: 1 });
taskSchema.index({ owner: 1, listName: 1 });
taskSchema.index({ title: "text", description: "text", tags: "text" });

export default mongoose.model("Task", taskSchema);