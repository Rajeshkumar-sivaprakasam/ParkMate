import { Router, Response, NextFunction } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { anomalyService } from "../services/anomaly.service.js";
import type { AuthRequest } from "../middleware/auth.js";

const router = Router();

// Get all anomalies (admin only)
router.get(
  "/",
  authenticate,
  authorize("admin", "superadmin"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 20, severity, status, userId } = req.query;

      const result = await anomalyService.getAnomalies({
        page: Number(page),
        limit: Number(limit),
        severity: severity as
          | "low"
          | "medium"
          | "high"
          | "critical"
          | undefined,
        status: status as string | undefined,
        userId: userId as string | undefined,
      });

      res.json({
        success: true,
        message: "Anomalies retrieved successfully",
        data: result.data,
        meta: {
          page: Number(page),
          limit: Number(limit),
          total: result.total,
          totalPages: Math.ceil(result.total / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

// Get anomaly statistics (admin only)
router.get(
  "/stats",
  authenticate,
  authorize("admin", "superadmin"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const stats = await anomalyService.getAnomalyStats();

      res.json({
        success: true,
        message: "Anomaly statistics retrieved successfully",
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Get anomaly by ID (admin only)
router.get(
  "/:id",
  authenticate,
  authorize("admin", "superadmin"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { Anomaly } = await import("../models/index.js");
      const anomaly = await Anomaly.findById(req.params.id);

      if (!anomaly) {
        res.status(404).json({
          success: false,
          message: "Anomaly not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Anomaly retrieved successfully",
        data: anomaly,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Resolve anomaly (admin only)
router.post(
  "/:id/resolve",
  authenticate,
  authorize("admin", "superadmin"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { resolution } = req.body;
      const adminId = req.user?.userId;

      if (!resolution) {
        res.status(400).json({
          success: false,
          message: "Resolution is required",
        });
        return;
      }

      const anomaly = await anomalyService.resolveAnomaly(
        req.params.id,
        adminId!,
        resolution,
      );

      if (!anomaly) {
        res.status(404).json({
          success: false,
          message: "Anomaly not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Anomaly resolved successfully",
        data: anomaly,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Mark anomaly as false positive (admin only)
router.post(
  "/:id/false-positive",
  authenticate,
  authorize("admin", "superadmin"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { reason } = req.body;
      const adminId = req.user?.userId;

      if (!reason) {
        res.status(400).json({
          success: false,
          message: "Reason is required",
        });
        return;
      }

      const anomaly = await anomalyService.markAsFalsePositive(
        req.params.id,
        adminId!,
        reason,
      );

      if (!anomaly) {
        res.status(404).json({
          success: false,
          message: "Anomaly not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Anomaly marked as false positive",
        data: anomaly,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
