import { Router, Response, NextFunction } from "express";
import { body, param } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  Booking,
  User,
  ParkingLot,
  Vehicle,
  AuditLog,
} from "../models/index.js";
import { AppError } from "../middleware/errorHandler.js";
import { emailService } from "../services/email.service.js";
import type { AuthRequest } from "../middleware/auth.js";

const router = Router();

// Get all pending approval bookings (admin only)
router.get(
  "/pending",
  authenticate,
  authorize("admin", "superadmin"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 20, lotId } = req.query;

      const query: Record<string, unknown> = {
        approvalStatus: "pending_approval",
      };

      if (lotId) {
        query.lotId = lotId;
      }

      const bookings = await Booking.find(query)
        .populate("userId", "firstName lastName email phone company")
        .populate("lotId", "name address hourlyRate")
        .populate("vehicleId", "licensePlate make model")
        .sort({ createdAt: 1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));

      const total = await Booking.countDocuments(query);

      res.json({
        success: true,
        message: "Pending approval bookings retrieved successfully",
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
  },
);

// Get booking approval statistics (admin only)
router.get(
  "/approval-stats",
  authenticate,
  authorize("admin", "superadmin"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const [pending, approved, rejected, autoApproved] = await Promise.all([
        Booking.countDocuments({ approvalStatus: "pending_approval" }),
        Booking.countDocuments({ approvalStatus: "approved" }),
        Booking.countDocuments({ approvalStatus: "rejected" }),
        Booking.countDocuments({ approvalStatus: "auto_approved" }),
      ]);

      // Today's pending
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayPending = await Booking.countDocuments({
        approvalStatus: "pending_approval",
        createdAt: { $gte: today, $lt: tomorrow },
      });

      const todayApproved = await Booking.countDocuments({
        approvalStatus: "approved",
        approvedAt: { $gte: today, $lt: tomorrow },
      });

      res.json({
        success: true,
        message: "Approval statistics retrieved successfully",
        data: {
          pending,
          approved,
          rejected,
          autoApproved,
          todayPending,
          todayApproved,
          total: pending + approved + rejected + autoApproved,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

// Approve a booking (admin only)
router.post(
  "/:id/approve",
  authenticate,
  authorize("admin", "superadmin"),
  [param("id").isMongoId().withMessage("Valid booking ID is required")],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        throw new AppError("Booking not found", 404, "BOOKING_NOT_FOUND");
      }

      if (booking.approvalStatus === "approved") {
        throw new AppError(
          "Booking is already approved",
          400,
          "ALREADY_APPROVED",
        );
      }

      if (booking.approvalStatus === "rejected") {
        throw new AppError(
          "Cannot approve a rejected booking",
          400,
          "ALREADY_REJECTED",
        );
      }

      if (booking.approvalStatus === "auto_approved") {
        throw new AppError("Booking was auto-approved", 400, "AUTO_APPROVED");
      }

      // Update booking
      booking.approvalStatus = "approved";
      booking.approvedBy = req.user?.userId;
      booking.approvedAt = new Date();
      booking.status = "confirmed";
      await booking.save();

      // Create audit log
      await AuditLog.create({
        userId: req.user?.userId,
        action: "admin_action",
        entityType: "Booking",
        entityId: booking._id,
        metadata: { action: "approve" },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      // Send approval email to user
      const user = await User.findById(booking.userId);
      const lot = await ParkingLot.findById(booking.lotId);
      const vehicle = await Vehicle.findById(booking.vehicleId);

      if (user) {
        await emailService.sendBookingConfirmation(user.email, {
          userName: `${user.firstName} ${user.lastName}`,
          bookingId: booking._id.toString(),
          parkingLotName: lot?.name || "N/A",
          parkingLotAddress: lot?.address || "N/A",
          bookingDate: new Date(booking.date).toLocaleDateString(),
          startTime: booking.startTime,
          endTime: booking.endTime,
          vehicleInfo: vehicle
            ? `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`
            : "N/A",
          totalAmount: booking.totalAmount,
          currency: booking.currency,
          qrCode: booking.qrCode,
          passcode: booking.passcode,
        });
      }

      res.json({
        success: true,
        message: "Booking approved successfully",
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Reject a booking (admin only)
router.post(
  "/:id/reject",
  authenticate,
  authorize("admin", "superadmin"),
  [
    param("id").isMongoId().withMessage("Valid booking ID is required"),
    body("reason").notEmpty().withMessage("Rejection reason is required"),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { reason } = req.body;
      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        throw new AppError("Booking not found", 404, "BOOKING_NOT_FOUND");
      }

      if (booking.approvalStatus === "rejected") {
        throw new AppError(
          "Booking is already rejected",
          400,
          "ALREADY_REJECTED",
        );
      }

      if (booking.approvalStatus === "approved") {
        throw new AppError(
          "Cannot reject an approved booking",
          400,
          "ALREADY_APPROVED",
        );
      }

      // Update booking
      booking.approvalStatus = "rejected";
      booking.approvedBy = req.user?.userId;
      booking.approvedAt = new Date();
      booking.rejectionReason = reason;
      booking.status = "cancelled";
      booking.cancelledAt = new Date();
      booking.cancellationReason = `Rejected by admin: ${reason}`;
      await booking.save();

      // Create audit log
      await AuditLog.create({
        userId: req.user?.userId,
        action: "admin_action",
        entityType: "Booking",
        entityId: booking._id,
        metadata: { action: "reject", reason },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      // Send rejection email to user
      const user = await User.findById(booking.userId);
      const lot = await ParkingLot.findById(booking.lotId);

      if (user) {
        await emailService.sendBookingCancellation(user.email, {
          userName: `${user.firstName} ${user.lastName}`,
          bookingId: booking._id.toString(),
          parkingLotName: lot?.name || "N/A",
          bookingDate: new Date(booking.date).toLocaleDateString(),
          startTime: booking.startTime,
          endTime: booking.endTime,
          refundAmount: booking.totalAmount, // Full refund for rejected
          refundPercentage: 100,
          currency: booking.currency,
          cancellationReason: reason,
        });
      }

      res.json({
        success: true,
        message: "Booking rejected successfully",
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Bulk approve bookings (admin only)
router.post(
  "/bulk-approve",
  authenticate,
  authorize("admin", "superadmin"),
  [
    body("bookingIds")
      .isArray({ min: 1 })
      .withMessage("Booking IDs array is required"),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { bookingIds } = req.body;

      const pendingBookings = await Booking.find({
        _id: { $in: bookingIds },
        approvalStatus: "pending_approval",
      });

      if (pendingBookings.length === 0) {
        throw new AppError(
          "No pending bookings found",
          404,
          "NO_PENDING_BOOKINGS",
        );
      }

      // Update all bookings
      const updatedBookings = await Promise.all(
        pendingBookings.map(async (booking) => {
          booking.approvalStatus = "approved";
          booking.approvedBy = req.user?.userId;
          booking.approvedAt = new Date();
          booking.status = "confirmed";
          return booking.save();
        }),
      );

      // Create audit log
      await AuditLog.create({
        userId: req.user?.userId,
        action: "admin_action",
        entityType: "Booking",
        entityId: null,
        metadata: { action: "bulk_approve", count: pendingBookings.length },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      // Send emails to users
      for (const booking of pendingBookings) {
        const user = await User.findById(booking.userId);
        const lot = await ParkingLot.findById(booking.lotId);
        const vehicle = await Vehicle.findById(booking.vehicleId);

        if (user) {
          await emailService.sendBookingConfirmation(user.email, {
            userName: `${user.firstName} ${user.lastName}`,
            bookingId: booking._id.toString(),
            parkingLotName: lot?.name || "N/A",
            parkingLotAddress: lot?.address || "N/A",
            bookingDate: new Date(booking.date).toLocaleDateString(),
            startTime: booking.startTime,
            endTime: booking.endTime,
            vehicleInfo: vehicle
              ? `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`
              : "N/A",
            totalAmount: booking.totalAmount,
            currency: booking.currency,
            qrCode: booking.qrCode,
            passcode: booking.passcode,
          });
        }
      }

      res.json({
        success: true,
        message: `${pendingBookings.length} bookings approved successfully`,
        data: {
          approved: updatedBookings.length,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
