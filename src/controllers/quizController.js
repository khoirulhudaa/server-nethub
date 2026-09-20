import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/QuizAttempt.js";
import QuizComment from "../models/QuizComment.js";

// ====================== CRUD ======================
export const createQuiz = async (req, res, next) => {
  try {
    const { title, description, category, tags, questions, isPublished } = req.body;

    if (!questions || questions.length < 5 || questions.length > 20) {
      return res.status(400).json({ message: "Quiz harus berisi 5–20 soal" });
    }

    const quiz = await Quiz.create({
      title,
      description,
      category,
      tags: Array.isArray(tags) ? tags : [],
      questions,
      isPublished: Boolean(isPublished),
      author: req.user._id,
    });

    const populated = await quiz.populate("author", "name avatar title");
    res.status(201).json({ quiz: populated });
  } catch (err) {
    next(err);
  }
};

export const getQuizzes = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;
    const filter = { isPublished: true };

    if (category) filter.category = category;
    if (search) filter.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);

    const [quizzes, total] = await Promise.all([
      Quiz.find(filter)
        .populate("author", "name avatar title")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select("-questions.correctTopology -questions.options.isCorrect"),
      Quiz.countDocuments(filter),
    ]);

    res.json({
      quizzes,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    next(err);
  }
};

export const getQuizById = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate(
      "author",
      "name avatar title"
    );
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const isOwner =
      req.user && String(quiz.author._id) === String(req.user._id);

    if (!quiz.isPublished && !isOwner) {
      return res.status(403).json({ message: "Quiz belum dipublish" });
    }

    const data = quiz.toObject();

    if (!isOwner) {
      data.questions = data.questions.map((q) => {
        if (q.type === "topology") {
          const { correctTopology, ...rest } = q;
          return rest;
        }
        if (q.type === "multiple_choice") {
          return {
            ...q,
            options: q.options.map(({ text }) => ({ text })),
          };
        }
        return q;
      });
    }

    res.json({ quiz: data });
  } catch (err) {
    next(err);
  }
};

export const updateQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    if (String(quiz.author) !== String(req.user._id)) {
      return res.status(403).json({ message: "Hanya author yang boleh edit" });
    }

    const fields = [
      "title",
      "description",
      "category",
      "tags",
      "questions",
      "isPublished",
    ];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) quiz[f] = req.body[f];
    });

    await quiz.save();
    res.json({ quiz });
  } catch (err) {
    next(err);
  }
};

export const deleteQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    if (String(quiz.author) !== String(req.user._id)) {
      return res.status(403).json({ message: "Hanya author yang boleh hapus" });
    }

    await Promise.all([
      quiz.deleteOne(),
      QuizAttempt.deleteMany({ quiz: quiz._id }),
      QuizComment.deleteMany({ quiz: quiz._id }),
    ]);

    res.json({ message: "Quiz dihapus" });
  } catch (err) {
    next(err);
  }
};

export const getMyQuizzes = async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({ author: req.user._id }).sort({
      createdAt: -1,
    });
    res.json({ quizzes });
  } catch (err) {
    next(err);
  }
};

// ====================== ATTEMPT ======================
export const submitAttempt = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const { answers = [], timeSpent = 0 } = req.body;

    let totalScore = 0;
    let maxScore = 0;
    const graded = [];

    for (const q of quiz.questions) {
      maxScore += q.points;
      const ans = answers.find((a) => String(a.questionId) === String(q._id));
      let isCorrect = false;
      let score = 0;

      if (!ans) {
        graded.push({ questionId: q._id, isCorrect: false, score: 0 });
        continue;
      }

      if (q.type === "multiple_choice") {
        const correctIdx = q.options
          .map((o, i) => (o.isCorrect ? i : -1))
          .filter((i) => i >= 0);
        const selected = ans.selectedOptions || [];

        if (q.allowMultiple) {
          isCorrect =
            correctIdx.length === selected.length &&
            correctIdx.every((i) => selected.includes(i));
        } else {
          isCorrect =
            selected.length === 1 && correctIdx.includes(selected[0]);
        }
        score = isCorrect ? q.points : 0;
      }

      if (q.type === "topology") {
        score = 0; // sementara
      }

      totalScore += score;
      graded.push({
        questionId: q._id,
        selectedOptions: ans.selectedOptions,
        submittedTopology: ans.submittedTopology,
        isCorrect,
        score,
      });
    }

    const percentage =
      maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    const attempt = await QuizAttempt.create({
      quiz: quiz._id,
      user: req.user._id,
      answers: graded,
      totalScore,
      maxScore,
      percentage,
      timeSpent,
    });

    quiz.attempts += 1;
    quiz.averageScore =
      (quiz.averageScore * (quiz.attempts - 1) + percentage) / quiz.attempts;
    await quiz.save();

    res.json({ attempt, graded, totalScore, maxScore, percentage });
  } catch (err) {
    next(err);
  }
};

export const getQuizAttempts = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    if (String(quiz.author) !== String(req.user._id)) {
      return res.status(403).json({ message: "Hanya author" });
    }

    const attempts = await QuizAttempt.find({ quiz: quiz._id })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 });

    res.json({ attempts });
  } catch (err) {
    next(err);
  }
};

// ====================== SOCIAL ======================
export const toggleLikeQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const uid = req.user._id;
    const already = quiz.likes.some((id) => String(id) === String(uid));
    const op = already ? "$pull" : "$addToSet";

    const updated = await Quiz.findByIdAndUpdate(
      req.params.id,
      { [op]: { likes: uid } },
      { new: true }
    );

    res.json({
      liked: !already,
      likesCount: updated.likes.length,
    });
  } catch (err) {
    next(err);
  }
};

export const rateQuiz = async (req, res, next) => {
  try {
    const { value } = req.body;
    if (!value || value < 1 || value > 5) {
      return res.status(400).json({ message: "Rating harus 1–5" });
    }

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const uid = req.user._id;
    const existing = quiz.ratings.find((r) => String(r.user) === String(uid));

    if (existing) {
      existing.value = value;
    } else {
      quiz.ratings.push({ user: uid, value });
    }

    const total = quiz.ratings.reduce((sum, r) => sum + r.value, 0);
    quiz.ratingCount = quiz.ratings.length;
    quiz.averageRating =
      Math.round((total / quiz.ratingCount) * 10) / 10;

    await quiz.save();

    res.json({
      averageRating: quiz.averageRating,
      ratingCount: quiz.ratingCount,
      userRating: value,
    });
  } catch (err) {
    next(err);
  }
};

export const getQuizComments = async (req, res, next) => {
  try {
    const comments = await QuizComment.find({
      quiz: req.params.id,
      parent: null,
    })
      .populate("user", "name avatar title")
      .sort({ createdAt: -1 });

    const withReplies = await Promise.all(
      comments.map(async (c) => {
        const replies = await QuizComment.find({ parent: c._id })
          .populate("user", "name avatar title")
          .sort({ createdAt: 1 });
        return { ...c.toObject(), replies };
      })
    );

    res.json({ comments: withReplies });
  } catch (err) {
    next(err);
  }
};

export const addQuizComment = async (req, res, next) => {
  try {
    const { content, parent } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ message: "Komentar tidak boleh kosong" });
    }

    const comment = await QuizComment.create({
      quiz: req.params.id,
      user: req.user._id,
      content: content.trim(),
      parent: parent || null,
    });

    const populated = await comment.populate("user", "name avatar title");
    res.status(201).json({ comment: populated });
  } catch (err) {
    next(err);
  }
};

export const deleteQuizComment = async (req, res, next) => {
  try {
    const comment = await QuizComment.findById(req.params.commentId);
    if (!comment)
      return res.status(404).json({ message: "Komentar tidak ditemukan" });

    if (String(comment.user) !== String(req.user._id)) {
      return res
        .status(403)
        .json({ message: "Hanya penulis yang boleh hapus" });
    }

    await QuizComment.deleteMany({
      $or: [{ _id: comment._id }, { parent: comment._id }],
    });

    res.json({ message: "Komentar dihapus" });
  } catch (err) {
    next(err);
  }
};

// ====================== TRENDING ======================
export const getTrendingQuizzes = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 6, 20);
    const sortBy = req.query.sort || "likes"; // "likes" | "rating"

    const filter = { isPublished: true };

    let sort = {};
    if (sortBy === "rating") {
      // Highest rated (minimal punya 1 rating)
      sort = { averageRating: -1, ratingCount: -1 };
      filter.ratingCount = { $gte: 1 };
    } else {
      // Most loved (berdasarkan jumlah likes)
      sort = { likesCount: -1, createdAt: -1 };
    }

    // Karena likes adalah array, kita pakai aggregation supaya bisa sort by length
    if (sortBy === "likes") {
      const quizzes = await Quiz.aggregate([
        { $match: filter },
        {
          $addFields: {
            likesCount: { $size: { $ifNull: ["$likes", []] } },
            questionsCount: { $size: { $ifNull: ["$questions", []] } },
          },
        },
        { $sort: { likesCount: -1, createdAt: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: "users",
            localField: "author",
            foreignField: "_id",
            as: "author",
          },
        },
        { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            title: 1,
            description: 1,
            category: 1,
            tags: 1,
            averageRating: 1,
            ratingCount: 1,
            likesCount: 1,
            questionsCount: 1,
            attempts: 1,
            createdAt: 1,
            "author._id": 1,
            "author.name": 1,
            "author.avatar": 1,
            "author.title": 1,
          },
        },
      ]);

      return res.json({ quizzes, sort: "likes" });
    }

    // Rating sort (bisa pakai find biasa)
    const quizzes = await Quiz.find(filter)
      .populate("author", "name avatar title")
      .sort(sort)
      .limit(limit)
      .select(
        "title description category tags averageRating ratingCount likes attempts createdAt"
      )
      .lean();

    // Tambahkan likesCount & questionsCount
    const result = quizzes.map((q) => ({
      ...q,
      likesCount: q.likes?.length || 0,
      questionsCount: q.questions?.length || 0,
    }));

    res.json({ quizzes: result, sort: "rating" });
  } catch (err) {
    next(err);
  }
};