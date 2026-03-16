import { Router } from "express";
import { body } from "express-validator";
import * as authController from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";

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

export default router;
