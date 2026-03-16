import { Router, Response, NextFunction } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { analyticsService } from "../services/analytics.service.js";
import type { AuthRequest } from "../middleware/auth.js";

const router = Router();

// Get dashboard statistics (admin only)
router.get(
  "/dashboard",
  authenticate,
  authorize("admin", "superadmin"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const stats = await analyticsService.getDashboardStats();

      res.json({
        success: true,
        message: "Dashboard statistics retrieved successfully",
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Get revenue data
router.get(
  "/revenue",
  authenticate,
  authorize("admin", "superadmin"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate, days } = req.query;

      let start: Date;
      let end: Date = new Date();

      if (days) {
        start = new Date();
        start.setDate(start.getDate() - Number(days));
      } else if (startDate && endDate) {
        start = new Date(startDate as string);
        end = new Date(endDate as string);
      } else {
        // Default: last 30 days
        start = new Date();
        start.setDate(start.getDate() - 30);
      }

      const data = await analyticsService.getRevenueData(start, end);

      res.json({
        success: true,
        message: "Revenue data retrieved successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Get hourly occupancy
router.get(
  "/occupancy/hourly",
  authenticate,
  authorize("admin", "superadmin"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { date } = req.query;
      const queryDate = date ? new Date(date as string) : new Date();

      const data = await analyticsService.getHourlyOccupancy(queryDate);

      res.json({
        success: true,
        message: "Hourly occupancy data retrieved successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Get top parking lots
router.get(
  "/top-lots",
  authenticate,
  authorize("admin", "superadmin"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { limit } = req.query;
      const data = await analyticsService.getTopParkingLots(
        limit ? Number(limit) : 10,
      );

      res.json({
        success: true,
        message: "Top parking lots retrieved successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Get booking trends
router.get(
  "/trends",
  authenticate,
  authorize("admin", "superadmin"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { days } = req.query;
      const data = await analyticsService.getBookingTrends(
        days ? Number(days) : 30,
      );

      res.json({
        success: true,
        message: "Booking trends retrieved successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Get cancellation rate
router.get(
  "/cancellation-rate",
  authenticate,
  authorize("admin", "superadmin"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { days } = req.query;
      const rate = await analyticsService.getCancellationRate(
        days ? Number(days) : 30,
      );

      res.json({
        success: true,
        message: "Cancellation rate retrieved successfully",
        data: { rate },
      });
    } catch (error) {
      next(error);
    }
  },
);

// Get user booking stats (for logged in user)
router.get(
  "/my-stats",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const stats = await analyticsService.getUserBookingStats(userId);

      res.json({
        success: true,
        message: "User booking statistics retrieved successfully",
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
