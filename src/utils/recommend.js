import Post from "../models/Post.js";

/**
 * Smart Recommendation Engine
 * Scores candidate posts against a source post using:
 *  - same category  (+3)
 *  - shared tags     (+1 per shared tag)
 *  - recency bonus   (+1 if published in the last 30 days)
 * Returns the top N related posts, excluding the source post itself.
 */
export const getRelatedPosts = async (sourcePost, limit = 4) => {
  const candidates = await Post.find({
    _id: { $ne: sourcePost._id },
    $or: [{ category: sourcePost.category }, { tags: { $in: sourcePost.tags } }],
  })
    .populate("author", "name avatar")
    .limit(50)
    .lean();

  const now = Date.now();
  const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30;

  const scored = candidates.map((post) => {
    let score = 0;
    if (post.category === sourcePost.category) score += 3;
    const sharedTags = (post.tags || []).filter((t) => sourcePost.tags?.includes(t));
    score += sharedTags.length;
    if (now - new Date(post.createdAt).getTime() < THIRTY_DAYS) score += 1;
    return { post, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.post);
};
