import Post, { POST_CATEGORIES } from "../models/Post.js";
import Comment from "../models/Comment.js";
import { getRelatedPosts } from "../utils/recommend.js";
import User from "../models/User.js";

export const createPost = async (req, res, next) => {
  try {
    const { 
      title, 
      excerpt, 
      content, 
      coverImage, 
      category, 
      tags, 
      hardwareMeshes, 
      gallery, 
      topology,
      steps,
      customTables,
      flowchart,
      referencesImages,
      codeBlocks,          // ← tambahkan ini
    } = req.body;

    const refs = Array.isArray(referencesImages) ? referencesImages : [];
    if (refs.length > 4) {
      return res.status(400).json({ message: "Maksimal 4 reference images" });
    }

    if (!POST_CATEGORIES.includes(category)) {
      return res.status(400).json({ 
        message: `Category must be one of: ${POST_CATEGORIES.join(", ")}` 
      });
    }

    const tagsValue = Array.isArray(req.body.tags) ? req.body.tags : [];
    if (tagsValue.length > 4) {
      return res.status(400).json({ message: "Maksimal 4 tags" });
    }

    const post = await Post.create({
      title,
      excerpt,
      content,
      coverImage,
      category,
      tags: Array.isArray(tags) ? tags : [],
      hardwareMeshes: Array.isArray(hardwareMeshes) ? hardwareMeshes : [],
      gallery: Array.isArray(gallery) ? gallery : [],
      topology: topology || { nodes: [], edges: [] },
      referencesImages: refs,
      flowchart: flowchart || { nodes: [], edges: [] },
      steps: Array.isArray(steps) ? steps : [],
      customTables: Array.isArray(customTables) ? customTables : [],
      codeBlocks: Array.isArray(codeBlocks) ? codeBlocks : [],   // ← tambahkan ini
      author: req.user._id,
    });

    const populated = await post.populate("author", "name avatar title");
    res.status(201).json({ post: populated });
  } catch (err) {
    next(err);
  }
};

// export const getPosts = async (req, res, next) => {
//   try {
//     const { category, search, author, page = 1, limit = 12 } = req.query;
//     const filter = {};
//     if (category && POST_CATEGORIES.includes(category)) filter.category = category;
//     if (author) filter.author = author;
//     if (search) filter.$text = { $search: search };

//     const skip = (Number(page) - 1) * Number(limit);

//     // Kalau ada filter author → ambil semua post author (tidak dipisah pinned)
//     if (author) {
//       const [posts, total] = await Promise.all([
//         Post.find(filter)
//           .populate("author", "name avatar title")
//           .sort({ isPinned: -1, createdAt: -1 }) // pinned dulu
//           .skip(skip)
//           .limit(Number(limit)),
//         Post.countDocuments(filter),
//       ]);

//       return res.json({
//         pinned: [],
//         posts,
//         total,
//         page: Number(page),
//         pages: Math.ceil(total / Number(limit)),
//         categories: POST_CATEGORIES,
//       });
//     }

//     // Default behaviour (Dashboard)
//     const [pinned, posts, total] = await Promise.all([
//       Post.find({ ...filter, isPinned: true })
//         .populate("author", "name avatar title")
//         .sort({ createdAt: -1 })
//         .limit(4),
//       Post.find({ ...filter, isPinned: false }) // ← exclude pinned, biar gak duplikat
//         .populate("author", "name avatar title")
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(Number(limit)),
//       Post.countDocuments({ ...filter, isPinned: false }), // ← total juga exclude pinned
//     ]);

//     res.json({
//       pinned,
//       posts,
//       total,
//       page: Number(page),
//       pages: Math.ceil(total / Number(limit)),
//       categories: POST_CATEGORIES,
//     });

//     res.json({
//       pinned,
//       posts,
//       total,
//       page: Number(page),
//       pages: Math.ceil(total / Number(limit)),
//       categories: POST_CATEGORIES,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

export const getPosts = async (req, res, next) => {
  try {
    const { category, search, author, tag, page = 1, limit = 12 } = req.query;
    const filter = {};

    if (category && POST_CATEGORIES.includes(category)) filter.category = category;
    if (author) filter.author = author;
    if (tag) filter.tags = tag.toLowerCase().trim(); // exact match pada array tags
    if (search) filter.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);

    // Kalau ada filter author → ambil semua post author (tidak dipisah pinned)
    if (author) {
      const [posts, total] = await Promise.all([
        Post.find(filter)
          .populate("author", "name avatar title")
          .sort({ isPinned: -1, createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Post.countDocuments(filter),
      ]);

      return res.json({
        pinned: [],
        posts,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        categories: POST_CATEGORIES,
      });
    }

    // Default behaviour (Dashboard) — tetap exclude pinned supaya tidak duplikat
    const [pinned, posts, total] = await Promise.all([
      Post.find({ ...filter, isPinned: true })
        .populate("author", "name avatar title")
        .sort({ createdAt: -1 })
        .limit(4),
      Post.find({ ...filter, isPinned: false })
        .populate("author", "name avatar title")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Post.countDocuments({ ...filter, isPinned: false }),
    ]);

    res.json({
      pinned,
      posts,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      categories: POST_CATEGORIES,
    });
  } catch (err) {
    next(err);
  }
};

// POST /posts/:id/view  atau  /posts/:slug/view
export const incrementView = async (req, res, next) => {
  try {
    const post = await Post.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { views: 1 } },
      { new: true }
    ).select("views");

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.json({ views: post.views });
  } catch (err) {
    next(err);
  }
};

export const getPostBySlug = async (req, res, next) => {
  try {
    const post = await Post.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { views: 1 } },
      { new: true }
    ).populate("author", "name avatar title bio");

    if (!post) return res.status(404).json({ message: "Post not found" });

    // Ambil related, lalu buang yang isPinned = true
    let related = await getRelatedPosts(post, 4);
    related = related.filter((p) => !p.isPinned);

    res.json({ post, related });
  } catch (err) {
    next(err);
  }
};

export const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (String(post.author) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only edit your own posts" });
    }
    
    const tagsValue = Array.isArray(req.body.tags) ? req.body.tags : [];
    if (tagsValue.length > 4) {
      return res.status(400).json({ message: "Maksimal 4 tags" });
    }

    // updatePost
    const fields = [
      "title", 
      "excerpt", 
      "content", 
      "coverImage", 
      "category", 
      "tags", 
      "hardwareMeshes", 
      "gallery", 
      "topology",
      "referencesImages",
      "steps",
      "customTables",
      "flowchart",
      "codeBlocks",        // ← tambahkan ini
    ];
    
    fields.forEach((f) => {
      if (req.body[f] !== undefined) post[f] = req.body[f];
    });

    await post.save();
    res.json({ post });
  } catch (err) {
    next(err);
  }
};

export const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (String(post.author) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only delete your own posts" });
    }

    // Bersihkan juga jejaknya di semua User (likedPosts & bookmarks)
    // agar tidak ada id "hantu" yang nyangkut di profile orang lain.
    await Promise.all([
      post.deleteOne(),
      Comment.deleteMany({ post: post._id }),
      User.updateMany(
        { $or: [{ likedPosts: post._id }, { bookmarks: post._id }] },
        { $pull: { likedPosts: post._id, bookmarks: post._id } }
      ),
    ]);

    res.json({ message: "Post deleted" });
  } catch (err) {
    next(err);
  }
};

export const togglePin = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (String(post.author) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only pin your own posts" });
    }
    post.isPinned = !post.isPinned;
    await post.save();
    res.json({ post });
  } catch (err) {
    next(err);
  }
};

// PATCH /posts/:id/like
// Menyimpan relasi like di DUA sisi: Post.likes (siapa yang like guide ini)
// dan User.likedPosts (guide apa saja yang di-like user ini) — sehingga
// daftar "Liked" di halaman profile bisa langsung diambil dari User.likedPosts.
export const toggleLike = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const uid = req.user._id;

    const existingPost = await Post.findById(postId);
    if (!existingPost) return res.status(404).json({ message: "Post not found" });

    const alreadyLiked = existingPost.likes.some((l) => String(l) === String(uid));
    const op = alreadyLiked ? "$pull" : "$addToSet";

    const [updatedPost] = await Promise.all([
      Post.findByIdAndUpdate(postId, { [op]: { likes: uid } }, { new: true }),
      User.findByIdAndUpdate(uid, { [op]: { likedPosts: postId } }),
    ]);

    res.json({ likesCount: updatedPost.likes.length, liked: !alreadyLiked });
  } catch (err) {
    next(err);
  }
};

export const getMyPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({ author: req.user._id }).sort({ createdAt: -1 });
    res.json({ posts });
  } catch (err) {
    next(err);
  }
};

export const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "author",
      "name avatar title"
    );
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Opsional: pastikan hanya author yang bisa akses (untuk edit form)
    if (String(post.author._id) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only edit your own posts" });
    }

    res.json({ post });
  } catch (err) {
    next(err);
  }
};

// GET /posts/me/likes — daftar guide yang di-like oleh user yang sedang login.
// Diambil langsung dari User.likedPosts (bukan query balik ke Post.likes),
// karena keduanya sudah dijaga tetap sinkron oleh toggleLike di atas.
export const getMyLikedPosts = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "likedPosts",
      populate: { path: "author", select: "name avatar title" },
      options: { sort: { createdAt: -1 } },
    });
    res.json({ posts: user.likedPosts || [] });
  } catch (err) {
    next(err);
  }
};

// POST /posts/:id/bookmark
// Sama seperti like: disimpan di DUA sisi — User.bookmarks (guide apa saja
// yang disimpan user ini) dan Post.savedBy (siapa saja yang menyimpan guide ini).
export const toggleBookmark = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const uid = req.user._id;

    const existingUser = await User.findById(uid);
    if (!existingUser) return res.status(404).json({ message: "User not found" });

    const alreadyBookmarked = existingUser.bookmarks.some((b) => String(b) === String(postId));
    const op = alreadyBookmarked ? "$pull" : "$addToSet";

    const [, updatedPost] = await Promise.all([
      User.findByIdAndUpdate(uid, { [op]: { bookmarks: postId } }),
      Post.findByIdAndUpdate(postId, { [op]: { savedBy: uid } }, { new: true }),
    ]);

    if (!updatedPost) return res.status(404).json({ message: "Post not found" });

    res.json({ bookmarked: !alreadyBookmarked, savesCount: updatedPost.savedBy?.length || 0 });
  } catch (err) {
    next(err);
  }
};

// GET /users/me/bookmarks
export const getMyBookmarks = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "bookmarks",
      populate: { path: "author", select: "name avatar title" },
      options: { sort: { createdAt: -1 } },
    });
    res.json({ posts: user.bookmarks });
  } catch (err) {
    next(err);
  }
};

// GET /api/posts/trending?limit=12&period=7
export const getTrendingPosts = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 12, 30);
    const period = Number(req.query.period) || 30; // hari

    const since = new Date();
    since.setDate(since.getDate() - period);

    const posts = await Post.find({
      createdAt: { $gte: since },
    })
      .populate("author", "name avatar title")
      .sort({ views: -1, likes: -1 }) // paling banyak views dulu
      .limit(limit);

    // Fallback: kalau belum ada post di periode ini, ambil all-time top
    if (posts.length === 0) {
      const allTime = await Post.find()
        .populate("author", "name avatar title")
        .sort({ views: -1 })
        .limit(limit);
      return res.json({ posts: allTime, period: "all-time" });
    }

    res.json({ posts, period: `${period}d` });
  } catch (err) {
    next(err);
  }
};

// di getPosts, atau endpoint khusus /posts/stats
export const getPostStats = async (req, res, next) => {
  try {
    const [result] = await Post.aggregate([
      {
        $group: {
          _id: null,
          totalGuides: { $sum: 1 },
          totalReads: { $sum: "$views" },
        },
      },
    ]);

    res.json({
      totalGuides: result?.totalGuides || 0,
      totalReads: result?.totalReads || 0,
      totalCategories: POST_CATEGORIES.length,
    });
  } catch (err) {
    next(err);
  }
};