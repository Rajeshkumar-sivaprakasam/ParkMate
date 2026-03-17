import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { User, AuditLog } from "../models/index.js";
import { AppError } from "../middleware/errorHandler.js";
import type { AuthRequest } from "../middleware/auth.js";
import { anomalyService } from "../services/anomaly.service.js";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      company,
      department,
      employeeId,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError("Email already registered", 400, "EMAIL_EXISTS");
    }

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      company,
      department,
      employeeId,
    });

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn },
    );

    // Create audit log
    await AuditLog.create({
      userId: user._id,
      action: "create",
      entityType: "User",
      entityId: user._id.toString(),
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw new AppError(
        "Invalid email or password",
        401,
        "INVALID_CREDENTIALS",
      );
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > new Date()) {
      const lockTimeRemaining = Math.ceil(
        (user.lockUntil.getTime() - Date.now()) / 1000 / 60,
      );
      throw new AppError(
        `Account is locked. Try again in ${lockTimeRemaining} minutes`,
        403,
        "ACCOUNT_LOCKED",
      );
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Increment failed login attempts
      const newAttempts = (user.failedLoginAttempts || 0) + 1;
      const MAX_ATTEMPTS = 5;
      const LOCK_DURATION = 15 * 60 * 1000; // 15 minutes

      let updateData: Record<string, unknown> = {
        failedLoginAttempts: newAttempts,
        lastFailedLogin: new Date(),
      };

      // Lock account after MAX_ATTEMPTS failed attempts
      if (newAttempts >= MAX_ATTEMPTS) {
        updateData.lockUntil = new Date(Date.now() + LOCK_DURATION);
        updateData.failedLoginAttempts = 0; // Reset after locking
      }

      await User.findByIdAndUpdate(user._id, updateData);

      // Create audit log for failed login
      await AuditLog.create({
        userId: user._id,
        action: "login_failed",
        entityType: "User",
        entityId: user._id.toString(),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
        metadata: { attempts: newAttempts },
      });

      // Detect anomaly pattern (run in background, don't await)
      anomalyService
        .detectFailedLoginPattern({
          userId: user._id.toString(),
          ipAddress: req.ip || undefined,
          userAgent: req.get("User-Agent") || undefined,
          success: false,
        })
        .catch(console.error);

      throw new AppError(
        "Invalid email or password",
        401,
        "INVALID_CREDENTIALS",
      );
    }

    // Reset failed login attempts on successful login
    if (user.failedLoginAttempts > 0 || user.lockUntil) {
      await User.findByIdAndUpdate(user._id, {
        failedLoginAttempts: 0,
        lockUntil: undefined,
        lastFailedLogin: undefined,
      });
    }

    if (!user.isActive) {
      throw new AppError("Account is inactive", 403, "ACCOUNT_INACTIVE");
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn },
    );

    const refreshToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn },
    );

    // Create audit log
    await AuditLog.create({
      userId: user._id,
      action: "login",
      entityType: "User",
      entityId: user._id.toString(),
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          company: user.company,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId).select("-password");
    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    res.json({
      success: true,
      message: "Profile retrieved successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { firstName, lastName, phone, preferences, company } = req.body;
    const userId = req.user?.userId;

    const user = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, phone, preferences, company },
      { new: true, runValidators: true },
    );

    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    await AuditLog.create({
      userId,
      action: "update",
      entityType: "User",
      entityId: userId,
      newValues: { firstName, lastName, phone, preferences, company },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError(
        "Refresh token is required",
        400,
        "REFRESH_TOKEN_REQUIRED",
      );
    }

    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as {
      userId: string;
      email: string;
      role: string;
    };

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw new AppError("Invalid refresh token", 401, "INVALID_REFRESH_TOKEN");
    }

    const newToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn },
    );

    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: { token: newToken },
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError("Invalid refresh token", 401, "INVALID_REFRESH_TOKEN"));
      return;
    }
    next(error);
  }
};
