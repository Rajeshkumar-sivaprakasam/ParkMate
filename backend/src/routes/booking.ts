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
      .populate("spotId", "spotNumber floor row column spotType status")
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

// Get cancellation eligibility for a booking
router.get(
  "/:id/cancellation-eligibility",
  authenticate,
  async (req: AuthRequest, res, next) => {
    try {
      const userId = req.user?.userId;

      const booking = await Booking.findOne({
        _id: req.params.id,
        userId,
      }).populate("lotId vehicleId");

      if (!booking) {
        throw new AppError("Booking not found", 404, "BOOKING_NOT_FOUND");
      }

      // Check if already cancelled
      if (booking.status === "cancelled") {
        return res.json({
          success: true,
          data: {
            canCancel: false,
            reason: "Booking is already cancelled",
          },
        });
      }

      // Check if checked in/out
      if (booking.status === "checked_in" || booking.status === "checked_out") {
        return res.json({
          success: true,
          data: {
            canCancel: false,
            reason: "Cannot cancel checked-in or completed bookings",
          },
        });
      }

      // Calculate time until booking starts
      const bookingDateTime = new Date(booking.date);
      const [startHour, startMin] = (booking.startTime || "00:00").split(":");
      bookingDateTime.setHours(
        parseInt(startHour, 10),
        parseInt(startMin, 10),
        0,
        0,
      );

      const now = new Date();
      const hoursUntilStart =
        (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      const restrictedWindowMinutes = 120;
      const withinRestrictedWindow =
        hoursUntilStart * 60 < restrictedWindowMinutes;

      // Calculate refund
      let refundPercentage = 0;
      let refundAmount = 0;
      const isRefundable = !booking.nonRefundable;

      if (isRefundable && !withinRestrictedWindow) {
        if (hoursUntilStart >= 24) {
          refundPercentage = 100;
        } else if (hoursUntilStart >= 12) {
          refundPercentage = 50;
        } else {
          refundPercentage = 0;
        }
        refundAmount = (booking.totalAmount * refundPercentage) / 100;
      }

      res.json({
        success: true,
        data: {
          canCancel:
            !withinRestrictedWindow &&
            booking.status !== "cancelled" &&
            booking.status !== "completed",
          isRefundable,
          refundPercentage,
          refundAmount,
          warnings: booking.nonRefundable
            ? ["This booking is marked as non-refundable"]
            : [],
          restrictions: {
            withinRestrictedWindow,
            restrictedWindowMinutes,
            hoursUntilStart: Math.max(0, hoursUntilStart),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

// Create booking
router.post(
  "/",
  authenticate,
  [
    body("vehicleId").notEmpty().withMessage("Vehicle ID is required"),
    body("lotId").notEmpty().withMessage("Lot ID is required"),
    body("date").isISO8601().withMessage("Valid date is required"),
    body("startTime").optional(),
    body("endTime").optional(),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const {
        vehicleId,
        lotId,
        zoneId,
        spotId,
        date,
        startTime,
        endTime,
        bookingType = "hourly",
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

      // Calculate duration and amount based on booking type
      let totalAmount = 0;
      let duration = 1;

      if (bookingType === "hourly") {
        // Validate time is provided for hourly bookings
        if (!startTime || !endTime) {
          throw new AppError(
            "Start time and end time are required for hourly bookings",
            400,
            "TIME_REQUIRED",
          );
        }
        const startHour = parseInt(startTime.split(":")[0], 10);
        const endHour = parseInt(endTime.split(":")[0], 10);
        duration = endHour - startHour;
        if (duration <= 0) {
          duration = 1; // Minimum 1 hour
        }
        const hourlyRate = zoneId
          ? (await import("../models/index.js")).ParkingZone.findById(
              zoneId,
            ).then((z) => z?.hourlyRate || lot.hourlyRate)
          : lot.hourlyRate;
        totalAmount = duration * (await Promise.resolve(hourlyRate));
      } else if (bookingType === "daily") {
        totalAmount = lot.dailyRate || lot.hourlyRate * 10;
        duration = 10; // Full day
      } else if (bookingType === "monthly") {
        totalAmount =
          lot.monthlyRate || lot.dailyRate * 20 || lot.hourlyRate * 200;
        duration = 240; // Approximate hours in a month
      }

      // All bookings require admin approval by default
      const approvalStatus = "pending_approval";
      const initialStatus = "pending";

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
        spotId,
        bookingType: bookingType || "hourly",
        status: initialStatus || "confirmed",
        approvalStatus: approvalStatus || "auto_approved",
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
  [body("reason").optional(), body("confirmNonRefundable").optional()],
  async (req: AuthRequest, res, next) => {
    try {
      const { reason, confirmNonRefundable } = req.body;
      const userId = req.user?.userId;

      const booking = await Booking.findOne({
        _id: req.params.id,
        userId,
      }).populate("lotId vehicleId");

      if (!booking) {
        throw new AppError("Booking not found", 404, "BOOKING_NOT_FOUND");
      }

      if (booking.status === "cancelled") {
        throw new AppError(
          "Booking already cancelled",
          400,
          "BOOKING_ALREADY_CANCELLED",
        );
      }

      if (booking.status === "checked_in" || booking.status === "checked_out") {
        throw new AppError(
          "Cannot cancel checked-in or checked-out booking",
          400,
          "BOOKING_ALREADY_STARTED",
        );
      }

      // Calculate time until booking starts
      const bookingDateTime = new Date(booking.date);
      const [startHour, startMin] = (booking.startTime || "00:00").split(":");
      bookingDateTime.setHours(
        parseInt(startHour, 10),
        parseInt(startMin, 10),
        0,
        0,
      );

      const now = new Date();
      const hoursUntilStart =
        (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      const restrictedWindowMinutes = 120; // 2 hours

      // Check restricted window (within 2 hours of start time)
      if (hoursUntilStart * 60 < restrictedWindowMinutes) {
        throw new AppError(
          `Cancellations are not permitted within ${restrictedWindowMinutes / 60} hours of booking start time`,
          400,
          "CANCELLATION_NOT_ALLOWED",
        );
      }

      // Calculate refund based on tiers
      let refundAmount = 0;
      let refundPercentage = 0;
      let isRefundable = !booking.nonRefundable;

      if (isRefundable) {
        // Refund tiers according to spec:
        // > 24 hours: 100%
        // 12-24 hours: 50%
        // < 12 hours: 0%
        if (hoursUntilStart >= 24) {
          refundPercentage = 100;
        } else if (hoursUntilStart >= 12) {
          refundPercentage = 50;
        } else {
          refundPercentage = 0;
        }

        refundAmount = (booking.totalAmount * refundPercentage) / 100;
      } else if (!confirmNonRefundable) {
        // Non-refundable booking requires confirmation
        return res.json({
          success: false,
          error: "NON_REFUNDABLE_BOOKING",
          message:
            "This booking is marked as non-refundable. Do you still want to cancel?",
          data: {
            requiresConfirmation: true,
            bookingId: booking._id,
          },
        });
      }

      // Update booking
      booking.status = "cancelled";
      booking.cancelledAt = new Date();
      booking.cancellationReason = reason;

      if (refundAmount > 0) {
        booking.refundStatus = "pending";
        booking.refundAmount = refundAmount;

        // Initiate RinggitPay refund (if payment was made)
        if (booking.transactionId) {
          try {
            const { RinggitPayService } =
              await import("../services/ringgitpay.service.js");
            const ringgitPay = new RinggitPayService();
            const refundResult = await ringgitPay.initiateRefund({
              transactionId: booking.transactionId,
              amount: refundAmount,
              reason: reason || "Customer cancellation",
              metadata: {
                bookingId: booking._id.toString(),
                userId: userId?.toString(),
              },
            });
            booking.refundId = refundResult.refundId;
          } catch (refundError) {
            console.error("Refund initiation failed:", refundError);
          }
        }
      } else {
        booking.refundStatus = "none";
      }

      await booking.save();

      // Log cancellation in audit
      const { AuditLog } = await import("../models/index.js");
      await AuditLog.create({
        bookingId: booking._id,
        userId,
        action: "Cancelled",
        previousStatus: "confirmed",
        newStatus: "cancelled",
        metadata: {
          cancellationReason: reason,
          refundAmount,
          refundPercentage,
          hoursUntilStart,
          ipAddress: req.ip,
        },
      });

      // Send cancellation email
      try {
        const { sendCancellationEmail } =
          await import("../services/email.service.js");
        const user = await import("../models/index.js").then((m) =>
          m.User.findById(userId),
        );
        if (user) {
          await sendCancellationEmail(user, booking, {
            refundAmount,
            refundPercentage,
          });
        }
      } catch (emailError) {
        console.error("Cancellation email failed:", emailError);
      }

      res.json({
        success: true,
        message: "Booking cancelled successfully",
        data: {
          bookingId: booking._id,
          status: "cancelled",
          refund: {
            eligible: refundAmount > 0,
            amount: refundAmount,
            percentage: refundPercentage,
            estimatedProcessingTime: "3-5 business days",
            refundTransactionId: booking.refundId,
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
