import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, maxlength: 2000, trim: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null }, // null = top-level
  },
  { timestamps: true }
);

export default mongoose.model("Comment", commentSchema);
