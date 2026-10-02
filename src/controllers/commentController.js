import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import { logActivity } from "../utils/logActivity.js";

// Builds a nested tree from a flat list of comments (each with a `parent` ref).
const buildTree = (comments) => {
  const map = new Map();
  comments.forEach((c) => map.set(String(c._id), { ...c, replies: [] }));
  const roots = [];
  map.forEach((c) => {
    if (c.parent) {
      const parent = map.get(String(c.parent));
      if (parent) parent.replies.push(c);
      else roots.push(c); // orphaned reply, surface at top level
    } else {
      roots.push(c);
    }
  });
  return roots;
};

export const getCommentsForPost = async (req, res, next) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate("author", "name avatar")
      .sort({ createdAt: 1 })
      .lean();
    res.json({ comments: buildTree(comments) });
  } catch (err) {
    next(err);
  }
};

export const createComment = async (req, res, next) => {
  try {
    const { content, parent } = req.body;
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (parent) {
      const parentComment = await Comment.findById(parent);
      if (!parentComment || String(parentComment.post) !== String(post._id)) {
        return res.status(400).json({ message: "Invalid parent comment" });
      }
    }

    const comment = await Comment.create({
      post: post._id,
      author: req.user._id,
      content,
      parent: parent || null,
    });
    const populated = await comment.populate("author", "name avatar");
    await logActivity({
      userId: req.user._id,
      action: "comment",
      targetType: "comment",
      targetId: comment._id,
      metadata: { postId: post._id, postTitle: post.title, preview: comment.content.slice(0, 80) },
      req,
    });
    res.status(201).json({ comment: populated });
  } catch (err) {
    next(err);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (String(comment.author) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only delete your own comments" });
    }
    // Delete the comment and any replies pointing at it (one level of cascade).
    await Comment.deleteMany({ $or: [{ _id: comment._id }, { parent: comment._id }] });
    await logActivity({
      userId: req.user._id,
      action: "delete_comment",
      targetType: "comment",
      targetId: comment._id,
      metadata: { postId: comment.post },
      req,
    });
    res.json({ message: "Comment deleted" });
  } catch (err) {
    next(err);
  }
};
