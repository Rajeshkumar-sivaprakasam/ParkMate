import { Router, Response, NextFunction } from "express";
import { body, param } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.js";
import { Organization, AuditLog } from "../models/index.js";
import { AppError } from "../middleware/errorHandler.js";
import type { AuthRequest } from "../middleware/auth.js";

const router = Router();

// Get all organizations (admin only)
router.get(
  "/",
  authenticate,
  authorize("admin", "superadmin"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 10 } = req.query;

      const organizations = await Organization.find()
        .populate("createdBy", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));

      const total = await Organization.countDocuments();

      res.json({
        success: true,
        message: "Organizations retrieved successfully",
        data: organizations,
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

// Get current organization
router.get(
  "/me",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // For now, return the first active organization
      // In production, this would be based on user's organization
      const organization = await Organization.findOne({
        isActive: true,
      }).populate("createdBy", "firstName lastName email");

      if (!organization) {
        return res.status(404).json({
          success: false,
          message: "No organization found",
        });
      }

      res.json({
        success: true,
        message: "Organization retrieved successfully",
        data: organization,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Get organization by ID
router.get(
  "/:id",
  authenticate,
  authorize("admin", "superadmin"),
  [param("id").isMongoId().withMessage("Valid organization ID is required")],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const organization = await Organization.findById(req.params.id).populate(
        "createdBy",
        "firstName lastName email",
      );

      if (!organization) {
        throw new AppError(
          "Organization not found",
          404,
          "ORGANIZATION_NOT_FOUND",
        );
      }

      res.json({
        success: true,
        message: "Organization retrieved successfully",
        data: organization,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Create organization (admin only)
router.post(
  "/",
  authenticate,
  authorize("admin", "superadmin"),
  [
    body("name").notEmpty().withMessage("Organization name is required").trim(),
    body("code")
      .notEmpty()
      .withMessage("Organization code is required")
      .trim()
      .toUpperCase(),
    body("contactEmail")
      .isEmail()
      .withMessage("Valid contact email is required"),
    body("contactPhone").optional(),
    body("description").optional().trim(),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const {
        name,
        code,
        description,
        logo,
        website,
        contactEmail,
        contactPhone,
        address,
        settings,
        subscription,
      } = req.body;

      // Check if code already exists
      const existing = await Organization.findOne({ code });
      if (existing) {
        throw new AppError(
          "Organization code already exists",
          400,
          "CODE_EXISTS",
        );
      }

      const organization = await Organization.create({
        name,
        code,
        description,
        logo,
        website,
        contactEmail,
        contactPhone,
        address,
        settings: settings || {},
        subscription: subscription || {},
        createdBy: req.user?.userId,
      });

      // Create audit log
      await AuditLog.create({
        userId: req.user?.userId,
        action: "create",
        entityType: "Organization",
        entityId: organization._id,
        newValues: organization.toObject(),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.status(201).json({
        success: true,
        message: "Organization created successfully",
        data: organization,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Update organization
router.put(
  "/:id",
  authenticate,
  authorize("admin", "superadmin"),
  [param("id").isMongoId().withMessage("Valid organization ID is required")],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const organization = await Organization.findById(req.params.id);

      if (!organization) {
        throw new AppError(
          "Organization not found",
          404,
          "ORGANIZATION_NOT_FOUND",
        );
      }

      const oldValues = organization.toObject();
      const allowedUpdates = [
        "name",
        "description",
        "logo",
        "website",
        "contactEmail",
        "contactPhone",
        "address",
        "settings",
        "subscription",
        "isActive",
      ];

      allowedUpdates.forEach((field) => {
        if (req.body[field] !== undefined) {
          (organization as Record<string, unknown>)[field] = req.body[field];
        }
      });

      await organization.save();

      // Create audit log
      await AuditLog.create({
        userId: req.user?.userId,
        action: "update",
        entityType: "Organization",
        entityId: organization._id,
        oldValues,
        newValues: organization.toObject(),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.json({
        success: true,
        message: "Organization updated successfully",
        data: organization,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Delete organization
router.delete(
  "/:id",
  authenticate,
  authorize("superadmin"),
  [param("id").isMongoId().withMessage("Valid organization ID is required")],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const organization = await Organization.findById(req.params.id);

      if (!organization) {
        throw new AppError(
          "Organization not found",
          404,
          "ORGANIZATION_NOT_FOUND",
        );
      }

      // Soft delete - just mark as inactive
      organization.isActive = false;
      await organization.save();

      // Create audit log
      await AuditLog.create({
        userId: req.user?.userId,
        action: "delete",
        entityType: "Organization",
        entityId: organization._id,
        oldValues: organization.toObject(),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.json({
        success: true,
        message: "Organization deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
