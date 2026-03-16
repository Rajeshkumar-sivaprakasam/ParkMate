import { Router } from "express";
import { body } from "express-validator";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import { authenticate, authorize } from "../middleware/auth.js";
import { Booking, ParkingLot, Vehicle, RefundPolicy } from "../models/index.js";
import { AppError } from "../middleware/errorHandler.js";
import type { AuthRequest } from "../middleware/auth.js";

const router = Router();

// Get user's bookings
router.get("/", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const userId = req.user?.userId;

    const query: any = { userId };
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate("lotId", "name address hourlyRate")
      .populate("vehicleId", "licensePlate make model")
      .sort({ date: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      message: "Bookings retrieved successfully",
      data: bookings,
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
});

// Get booking by ID
router.get("/:id", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      userId: req.user?.userId,
    })
      .populate("lotId")
      .populate("vehicleId")
      .populate("zoneId");

    if (!booking) {
      throw new AppError("Booking not found", 404, "BOOKING_NOT_FOUND");
    }

    res.json({
      success: true,
      message: "Booking retrieved successfully",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
});

// Create booking
router.post(
  "/",
  authenticate,
  [
    body("vehicleId").notEmpty().withMessage("Vehicle ID is required"),
    body("lotId").notEmpty().withMessage("Lot ID is required"),
    body("date").isISO8601().withMessage("Valid date is required"),
    body("startTime").notEmpty().withMessage("Start time is required"),
    body("endTime").notEmpty().withMessage("End time is required"),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const {
        vehicleId,
        lotId,
        zoneId,
        date,
        startTime,
        endTime,
        isRecurring,
        recurringPattern,
        isVisitorBooking,
        visitorName,
        visitorPhone,
        hostUserId,
      } = req.body;
      const userId = req.user?.userId;

      // Verify vehicle belongs to user
      const vehicle = await Vehicle.findOne({ _id: vehicleId, userId });
      if (!vehicle) {
        throw new AppError("Vehicle not found", 404, "VEHICLE_NOT_FOUND");
      }

      // Get lot details
      const lot = await ParkingLot.findById(lotId);
      if (!lot) {
        throw new AppError("Parking lot not found", 404, "LOT_NOT_FOUND");
      }

      // Calculate duration and amount
      const startHour = parseInt(startTime.split(":")[0], 10);
      const endHour = parseInt(endTime.split(":")[0], 10);
      const duration = endHour - startHour;
      const hourlyRate = zoneId
        ? (await import("../models/index.js")).ParkingZone.findById(
            zoneId,
          ).then((z) => z?.hourlyRate || lot.hourlyRate)
        : lot.hourlyRate;
      const totalAmount = duration * (await Promise.resolve(hourlyRate));

      // Generate QR code and passcode
      const qrCodeData = {
        bookingId: uuidv4(),
        userId,
        lotId,
        date,
        startTime,
        endTime,
      };
      const qrCode = await QRCode.toDataURL(JSON.stringify(qrCodeData));
      const passcode = uuidv4().slice(0, 8).toUpperCase();

      // Create booking
      const booking = await Booking.create({
        userId,
        vehicleId,
        lotId,
        zoneId,
        bookingType: "hourly",
        status: "confirmed",
        date: new Date(date),
        startTime,
        endTime,
        duration,
        totalAmount,
        currency: lot.currency || "MYR",
        paymentStatus: "completed", // Mock - in production would integrate with payment gateway
        qrCode,
        passcode,
        qrCodeGeneratedAt: new Date(),
        isRecurring: isRecurring || false,
        recurringPattern,
        isVisitorBooking: isVisitorBooking || false,
        visitorName,
        visitorPhone,
        hostUserId: hostUserId || userId,
        nonRefundable: false,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.status(201).json({
        success: true,
        message: "Booking created successfully",
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Cancel booking
router.post(
  "/:id/cancel",
  authenticate,
  [body("reason").optional()],
  async (req: AuthRequest, res, next) => {
    try {
      const { reason } = req.body;
      const userId = req.user?.userId;

      const booking = await Booking.findOne({
        _id: req.params.id,
        userId,
      });

      if (!booking) {
        throw new AppError("Booking not found", 404, "BOOKING_NOT_FOUND");
      }

      if (booking.status === "cancelled") {
        throw new AppError(
          "Booking already cancelled",
          400,
          "ALREADY_CANCELLED",
        );
      }

      if (booking.status === "checked_in" || booking.status === "checked_out") {
        throw new AppError(
          "Cannot cancel checked-in or checked-out booking",
          400,
          "INVALID_STATUS",
        );
      }

      // Calculate refund based on policy
      let refundAmount = 0;
      let refundPercentage = 0;

      if (!booking.nonRefundable) {
        const policy = await RefundPolicy.findOne({
          isDefault: true,
          isActive: true,
        });

        if (policy) {
          const bookingDate = new Date(booking.date);
          const now = new Date();
          const hoursUntilBooking =
            (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

          // Find applicable tier
          const tier = policy.tiers
            .filter((t) => hoursUntilBooking >= t.hoursBeforeBooking)
            .sort((a, b) => b.hoursBeforeBooking - a.hoursBeforeBooking)[0];

          if (tier && !tier.isNonRefundable) {
            refundPercentage = tier.refundPercentage;
            refundAmount = (booking.totalAmount * refundPercentage) / 100;
          }
        }
      }

      // Update booking
      booking.status = "cancelled";
      booking.cancelledAt = new Date();
      booking.cancellationReason = reason;

      if (refundAmount > 0) {
        booking.refundStatus = "pending";
        booking.refundAmount = refundAmount;
      }

      await booking.save();

      res.json({
        success: true,
        message: "Booking cancelled successfully",
        data: {
          booking,
          refund: {
            amount: refundAmount,
            percentage: refundPercentage,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

// Check-in
router.post(
  "/:id/check-in",
  authenticate,
  async (req: AuthRequest, res, next) => {
    try {
      const booking = await Booking.findOne({
        _id: req.params.id,
        userId: req.user?.userId,
      });

      if (!booking) {
        throw new AppError("Booking not found", 404, "BOOKING_NOT_FOUND");
      }

      if (booking.status !== "confirmed") {
        throw new AppError(
          "Booking cannot be checked in",
          400,
          "INVALID_STATUS",
        );
      }

      booking.status = "checked_in";
      booking.checkedInAt = new Date();
      booking.actualCheckInTime = new Date().toTimeString().slice(0, 5);
      await booking.save();

      res.json({
        success: true,
        message: "Check-in successful",
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Check-out
router.post(
  "/:id/check-out",
  authenticate,
  async (req: AuthRequest, res, next) => {
    try {
      const booking = await Booking.findOne({
        _id: req.params.id,
        userId: req.user?.userId,
      });

      if (!booking) {
        throw new AppError("Booking not found", 404, "BOOKING_NOT_FOUND");
      }

      if (booking.status !== "checked_in") {
        throw new AppError(
          "Booking cannot be checked out",
          400,
          "INVALID_STATUS",
        );
      }

      booking.status = "checked_out";
      booking.checkedOutAt = new Date();
      booking.actualCheckOutTime = new Date().toTimeString().slice(0, 5);
      await booking.save();

      res.json({
        success: true,
        message: "Check-out successful",
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
