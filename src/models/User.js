import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      unique: true,
      sparse: true, // izinkan user lama tanpa username sampai mereka set sendiri
    },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    avatar: { type: String, default: "" },
    bio: { type: String, default: "", maxlength: 500 },
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    likedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }], 
    readingList: [
    {
      post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true,
      },
      order: {
        type: Number,
        required: true,
      },
      completed: {
        type: Boolean,
        default: false,
      },
      completedAt: {
        type: Date,
      },
      plannedDate: {
        type: Date, // opsional, untuk scheduling
      },
      notes: {
        type: String,
        default: "",
        maxlength: 200,
      },
    },
  ],
  title: { type: String, default: "Network Engineer" },
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  role: {
    type: String,
    enum: ["user", "admin", "superAdmin"],
    default: "user",
    index: true,
  },
  highlights: [
    {
      post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true,
      },
      items: [
        {
          text: { type: String, required: true },
          color: { type: String, default: "#fef08a" },
          createdAt: { type: Date, default: Date.now },
        },
      ],
    },
  ],
  },
  { timestamps: true }
);

userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    username: this.username || "",
    email: this.email,
    avatar: this.avatar,
    bio: this.bio,
    title: this.title,
    role: this.role || "user",
    createdAt: this.createdAt,
    // ===== FOLLOW STATS =====
    followersCount: this.followers?.length || 0,
    followingCount: this.following?.length || 0,
    readingListCount: this.readingList?.length || 0,
    readingListCompleted: this.readingList?.filter((i) => i.completed).length || 0,
  };
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model("User", userSchema);