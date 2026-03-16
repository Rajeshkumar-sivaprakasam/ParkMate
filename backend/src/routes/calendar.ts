import { Router, Response, NextFunction } from "express";
import { authenticate } from "../middleware/auth.js";
import { calendarService } from "../services/calendar.service.js";
import type { AuthRequest } from "../middleware/auth.js";

const router = Router();

// Get ICS for single booking
router.get(
  "/booking/:bookingId",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { bookingId } = req.params;
      const userId = req.user?.userId;

      const booking = await import("../models/index.js").then((m) =>
        m.Booking.findById(bookingId),
      );

      if (!booking || booking.userId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const icsContent = await calendarService.generateBookingICS(bookingId);

      if (!icsContent) {
        return res.status(404).json({
          success: false,
          message: "Failed to generate calendar file",
        });
      }

      res.setHeader("Content-Type", "text/calendar");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="booking-${bookingId}.ics"`,
      );
      res.send(icsContent);
    } catch (error) {
      next(error);
    }
  },
);

// Get ICS for all user's bookings
router.get(
  "/my-bookings",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;

      const icsContent = await calendarService.generateUserBookingsICS(userId!);

      if (!icsContent) {
        return res.status(404).json({
          success: false,
          message: "No upcoming bookings found",
        });
      }

      res.setHeader("Content-Type", "text/calendar");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="my-bookings.ics"`,
      );
      res.send(icsContent);
    } catch (error) {
      next(error);
    }
  },
);

// Get ICS for multiple bookings
router.post(
  "/bookings",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { bookingIds } = req.body;
      const userId = req.user?.userId;

      if (!bookingIds || !Array.isArray(bookingIds)) {
        return res.status(400).json({
          success: false,
          message: "Booking IDs array is required",
        });
      }

      // Verify ownership
      const bookings = await import("../models/index.js").then((m) =>
        m.Booking.find({ _id: { $in: bookingIds } }),
      );

      const authorizedIds = bookings
        .filter((b) => b.userId.toString() === userId)
        .map((b) => b._id.toString());

      if (authorizedIds.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const icsContent =
        await calendarService.generateMultipleBookingsICS(authorizedIds);

      if (!icsContent) {
        return res.status(404).json({
          success: false,
          message: "Failed to generate calendar file",
        });
      }

      res.setHeader("Content-Type", "text/calendar");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="bookings.ics"`,
      );
      res.send(icsContent);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
