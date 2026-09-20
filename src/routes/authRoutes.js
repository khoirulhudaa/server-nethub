import { Router } from "express";
import { body } from "express-validator";
import {
  register,
  login,
  getMe,
  updateProfile,
  getAuthorProfile,
  changeUsername,
  changeEmail,
  changePassword,
  guestLogin,
  toggleFollow,
  getMyFollowing,
  getReadingList,
  addToReadingList,
  removeFromReadingList,
  toggleReadingListComplete,
  reorderReadingList,
  updateReadingListItem,
  getHighlights,
  addHighlight,
  removeHighlight,
} from "../controllers/authController.js";
import { protect, protectWrite } from "../middleware/auth.js";

const router = Router();

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("A valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  register
);

router.post(
  "/login",
  [body("email").isEmail().withMessage("A valid email is required"), body("password").notEmpty()],
  login
);

router.get("/me", protect, getMe);
router.put("/me", protect, updateProfile);
router.get("/authors/:id", getAuthorProfile);

router.put(
  "/me/username",
  protect,
  [body("username").trim().isLength({ min: 3 }).withMessage("Username must be at least 3 characters")],
  changeUsername
);

router.put(
  "/me/email",
  protect,
  [
    body("email").isEmail().withMessage("A valid email is required"),
    body("currentPassword").notEmpty().withMessage("Current password is required"),
  ],
  changeEmail
);

router.put(
  "/me/password",
  protect,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
  ],
  changePassword
);

router.post("/follow/:id", protect, protectWrite, toggleFollow);
router.get("/me/following", protect, getMyFollowing);
router.post("/guest", guestLogin);
router.get("/me/reading-list", protect, getReadingList);
router.post("/me/reading-list", protect, addToReadingList);
router.delete("/me/reading-list/:postId", protect, removeFromReadingList);
router.patch("/me/reading-list/:postId/complete", protect, toggleReadingListComplete);
router.put("/me/reading-list", protect, reorderReadingList);
router.patch("/me/reading-list/:postId", protect, updateReadingListItem);
router.get("/me/highlights/:postId", protect, getHighlights);
router.post("/me/highlights/:postId", protect, addHighlight);
router.delete("/me/highlights/:postId", protect, removeHighlight);

export default router;