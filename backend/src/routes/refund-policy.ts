import { Router, Request, Response, NextFunction } from "express";
import { body, param, query } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.js";
import { RefundPolicy, User, AuditLog } from "../models/index.js";
import { AppError } from "../middleware/errorHandler.js";
import type { AuthRequest } from "../middleware/auth.js";
import mongoose from "mongoose";

const router = Router();

// Get all refund policies (admin only)
router.get(
  "/",
  authenticate,
  authorize("admin", "superadmin"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 10, isActive } = req.query;

      const queryObj: Record<string, unknown> = {};
      if (isActive !== undefined) {
        queryObj.isActive = isActive === "true";
      }

      const policies = await RefundPolicy.find(queryObj)
        .populate("createdBy", "firstName lastName email")
        .populate("applicableZones", "name")
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));

      const total = await RefundPolicy.countDocuments(queryObj);

      res.json({
        success: true,
        message: "Refund policies retrieved successfully",
        data: policies,
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

// Get single refund policy by ID
router.get(
  "/:id",
  authenticate,
  authorize("admin", "superadmin"),
  [param("id").isMongoId().withMessage("Valid policy ID is required")],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const policy = await RefundPolicy.findById(req.params.id)
        .populate("createdBy", "firstName lastName email")
        .populate("applicableZones", "name");

      if (!policy) {
        throw new AppError("Refund policy not found", 404, "POLICY_NOT_FOUND");
      }

      res.json({
        success: true,
        message: "Refund policy retrieved successfully",
        data: policy,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Get default refund policy
router.get(
  "/default",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const policy = await RefundPolicy.findOne({
        isDefault: true,
        isActive: true,
      })
        .populate("createdBy", "firstName lastName email")
        .populate("applicableZones", "name");

      if (!policy) {
        throw new AppError(
          "No default refund policy found",
          404,
          "POLICY_NOT_FOUND",
        );
      }

      res.json({
        success: true,
        message: "Default refund policy retrieved successfully",
        data: policy,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Create refund policy (admin only)
router.post(
  "/",
  authenticate,
  authorize("admin", "superadmin"),
  [
    body("name").notEmpty().withMessage("Policy name is required").trim(),
    body("description").optional().trim(),
    body("isDefault").optional().isBoolean(),
    body("tiers")
      .isArray({ min: 1 })
      .withMessage("At least one tier is required"),
    body("tiers.*.name").notEmpty().withMessage("Tier name is required"),
    body("tiers.*.hoursBeforeBooking")
      .isNumeric()
      .withMessage("Hours before booking must be a number"),
    body("tiers.*.refundPercentage")
      .isNumeric()
      .withMessage("Refund percentage must be a number")
      .custom((value) => {
        if (value < 0 || value > 100) {
          throw new Error("Refund percentage must be between 0 and 100");
        }
        return true;
      }),
    body("tiers.*.isNonRefundable").optional().isBoolean(),
    body("applicableZones").optional().isArray(),
    body("applicableUserRoles").optional().isArray(),
    body("minAdvanceHours").optional().isNumeric(),
    body("maxAdvanceDays")
      .optional()
      .isNumeric()
      .custom((value) => {
        if (value < 1) {
          throw new Error("Max advance days must be at least 1");
        }
        return true;
      }),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const {
        name,
        description,
        isDefault,
        tiers,
        applicableZones,
        applicableUserRoles,
        minAdvanceHours,
        maxAdvanceDays,
      } = req.body;

      // If setting as default, unset other defaults
      if (isDefault) {
        await RefundPolicy.updateMany({}, { isDefault: false });
      }

      // If no default policy exists, make this one default
      const existingDefault = await RefundPolicy.findOne({ isDefault: true });
      const shouldBeDefault = isDefault || !existingDefault;

      const policy = await RefundPolicy.create({
        name,
        description,
        isDefault: shouldBeDefault,
        tiers: tiers.map((tier: Record<string, unknown>) => ({
          name: tier.name,
          hoursBeforeBooking: tier.hoursBeforeBooking,
          refundPercentage: tier.refundPercentage,
          isNonRefundable: tier.isNonRefundable || false,
        })),
        applicableZones: applicableZones || [],
        applicableUserRoles: applicableUserRoles || ["user"],
        minAdvanceHours: minAdvanceHours || 0,
        maxAdvanceDays: maxAdvanceDays || 30,
        isActive: true,
        createdBy: req.user?.userId,
      });

      // Create audit log
      await AuditLog.create({
        userId: req.user?.userId,
        action: "create",
        entityType: "RefundPolicy",
        entityId: policy._id,
        newValues: policy.toObject(),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.status(201).json({
        success: true,
        message: "Refund policy created successfully",
        data: policy,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Update refund policy (admin only)
router.put(
  "/:id",
  authenticate,
  authorize("admin", "superadmin"),
  [
    param("id").isMongoId().withMessage("Valid policy ID is required"),
    body("name")
      .optional()
      .notEmpty()
      .withMessage("Policy name cannot be empty")
      .trim(),
    body("description").optional().trim(),
    body("isDefault").optional().isBoolean(),
    body("tiers")
      .optional()
      .isArray({ min: 1 })
      .withMessage("At least one tier is required"),
    body("applicableZones").optional().isArray(),
    body("applicableUserRoles").optional().isArray(),
    body("minAdvanceHours").optional().isNumeric(),
    body("maxAdvanceDays").optional().isNumeric(),
    body("isActive").optional().isBoolean(),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const policy = await RefundPolicy.findById(req.params.id);

      if (!policy) {
        throw new AppError("Refund policy not found", 404, "POLICY_NOT_FOUND");
      }

      const oldValues = policy.toObject();
      const {
        name,
        description,
        isDefault,
        tiers,
        applicableZones,
        applicableUserRoles,
        minAdvanceHours,
        maxAdvanceDays,
        isActive,
      } = req.body;

      // If setting as default, unset other defaults
      if (isDefault && !policy.isDefault) {
        await RefundPolicy.updateMany(
          { _id: { $ne: policy._id } },
          { isDefault: false },
        );
      }

      // Update fields
      if (name) policy.name = name;
      if (description !== undefined) policy.description = description;
      if (isDefault !== undefined) policy.isDefault = isDefault;
      if (tiers) {
        policy.tiers = tiers.map((tier: Record<string, unknown>) => ({
          _id: new mongoose.Types.ObjectId(),
          name: tier.name,
          hoursBeforeBooking: tier.hoursBeforeBooking,
          refundPercentage: tier.refundPercentage,
          isNonRefundable: tier.isNonRefundable || false,
        }));
      }
      if (applicableZones) policy.applicableZones = applicableZones;
      if (applicableUserRoles) policy.applicableUserRoles = applicableUserRoles;
      if (minAdvanceHours !== undefined)
        policy.minAdvanceHours = minAdvanceHours;
      if (maxAdvanceDays !== undefined) policy.maxAdvanceDays = maxAdvanceDays;
      if (isActive !== undefined) policy.isActive = isActive;

      await policy.save();

      // Create audit log
      await AuditLog.create({
        userId: req.user?.userId,
        action: "update",
        entityType: "RefundPolicy",
        entityId: policy._id,
        oldValues,
        newValues: policy.toObject(),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.json({
        success: true,
        message: "Refund policy updated successfully",
        data: policy,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Delete refund policy (admin only)
router.delete(
  "/:id",
  authenticate,
  authorize("admin", "superadmin"),
  [param("id").isMongoId().withMessage("Valid policy ID is required")],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const policy = await RefundPolicy.findById(req.params.id);

      if (!policy) {
        throw new AppError("Refund policy not found", 404, "POLICY_NOT_FOUND");
      }

      // Don't allow deletion of default policy
      if (policy.isDefault) {
        throw new AppError(
          "Cannot delete the default refund policy. Set another policy as default first.",
          400,
          "CANNOT_DELETE_DEFAULT",
        );
      }

      const deletedPolicy = await RefundPolicy.findByIdAndDelete(req.params.id);

      // Create audit log
      await AuditLog.create({
        userId: req.user?.userId,
        action: "delete",
        entityType: "RefundPolicy",
        entityId: req.params.id,
        oldValues: deletedPolicy?.toObject(),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.json({
        success: true,
        message: "Refund policy deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },
);

// Set default policy (admin only)
router.post(
  "/:id/set-default",
  authenticate,
  authorize("admin", "superadmin"),
  [param("id").isMongoId().withMessage("Valid policy ID is required")],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const policy = await RefundPolicy.findById(req.params.id);

      if (!policy) {
        throw new AppError("Refund policy not found", 404, "POLICY_NOT_FOUND");
      }

      if (!policy.isActive) {
        throw new AppError(
          "Cannot set an inactive policy as default",
          400,
          "POLICY_INACTIVE",
        );
      }

      // Unset all other defaults
      await RefundPolicy.updateMany({}, { isDefault: false });

      // Set this as default
      policy.isDefault = true;
      await policy.save();

      // Create audit log
      await AuditLog.create({
        userId: req.user?.userId,
        action: "admin_action",
        entityType: "RefundPolicy",
        entityId: policy._id,
        metadata: { action: "set_default" },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.json({
        success: true,
        message: "Default refund policy updated successfully",
        data: policy,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
