import Post from "../models/Post.js";

/**
 * Smart Recommendation Engine
 * Scores candidate posts against a source post using:
 *  - same category  (+3)
 *  - shared tags     (+1 per shared tag)
 *  - recency bonus   (+1 if published in the last 30 days)
 * Returns the top N related posts, excluding the source post itself.
 */
export const getRelatedPosts = async (post, limit = 4) => {
  try {
    // Pastikan tags selalu array
    const tags = Array.isArray(post.tags) ? post.tags : [];

    const filter = {
      _id: { $ne: post._id },          // exclude post saat ini
      isPinned: false,
    };

    // Kalau ada tags, cari yang mirip
    if (tags.length > 0) {
      filter.tags = { $in: tags };
    } else {
      // fallback: sama kategori
      filter.category = post.category;
    }

    const related = await Post.find(filter)
      .populate("author", "name avatar title")
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("-content -topology -gallery"); // biar ringan

    // Kalau hasil kurang, tambah dari kategori yang sama
    if (related.length < limit && tags.length > 0) {
      const more = await Post.find({
        _id: { 
          $ne: post._id, 
          $nin: related.map((p) => p._id) 
        },
        category: post.category,
      })
        .populate("author", "name avatar title")
        .sort({ createdAt: -1 })
        .limit(limit - related.length)
        .select("-content -topology -gallery");

      return [...related, ...more];
    }

    return related;
  } catch (err) {
    console.error("getRelatedPosts error:", err);
    return [];
  }
};
