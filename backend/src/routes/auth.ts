import { Router, Response, NextFunction } from "express";
import { body, param } from "express-validator";
import * as authController from "../controllers/authController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { User } from "../models/index.js";
import type { AuthRequest } from "../middleware/auth.js";

const router = Router();

// Register
router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("firstName").notEmpty().withMessage("First name is required"),
    body("lastName").notEmpty().withMessage("Last name is required"),
  ],
  authController.register,
);

// Login
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  authController.login,
);

// Refresh token
router.post("/refresh-token", authController.refreshToken);

// Get profile (protected)
router.get("/profile", authenticate, authController.getProfile);

// Update profile (protected)
router.put(
  "/profile",
  authenticate,
  [
    body("firstName").optional(),
    body("lastName").optional(),
    body("phone").optional(),
    body("preferences").optional(),
  ],
  authController.updateProfile,
);

// Get all users (admin only)
router.get(
  "/users",
  authenticate,
  authorize("admin", "superadmin"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 50, role, search } = req.query;

      const query: Record<string, unknown> = {};
      if (role) {
        query.role = role;
      }
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      const users = await User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));

      const total = await User.countDocuments(query);

      res.json({
        success: true,
        message: "Users retrieved successfully",
        data: users,
        meta: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

// Change password (protected)
router.post(
  "/change-password",
  authenticate,
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters"),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.userId;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
