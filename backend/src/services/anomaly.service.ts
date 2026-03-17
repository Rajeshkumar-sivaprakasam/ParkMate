import {
  Anomaly,
  IAnomalyDocument,
  AnomalyType,
  AnomalySeverity,
} from "../models/Anomaly.js";
import { Booking } from "../models/Booking.js";
import { AuditLog } from "../models/AuditLog.js";
import { User } from "../models/index.js";

interface DetectionContext {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  email?: string;
  metadata?: Record<string, unknown>;
}

interface BookingContext extends DetectionContext {
  lotId?: string;
  vehicleId?: string;
  totalAmount?: number;
  date?: string;
}

interface LoginContext extends DetectionContext {
  email?: string;
  success?: boolean;
}

class AnomalyService {
  // Configuration for detection thresholds
  private readonly config = {
    // Failed login detection
    failedLoginsThreshold: 3,
    failedLoginsWindowMinutes: 15,

    // Rapid booking detection
    rapidBookingCount: 5,
    rapidBookingWindowMinutes: 10,

    // High value booking
    highValueThreshold: 500, // MYR

    // Repeated cancellation
    cancellationCount: 3,
    cancellationWindowHours: 24,

    // Multiple locations
    uniqueLocationsThreshold: 3,
    locationWindowMinutes: 30,

    // Password change detection
    passwordChangeAnomaly: true,
  };

  /**
   * Detect failed login pattern
   * Triggers when multiple failed logins occur in a short time
   */
  async detectFailedLoginPattern(
    context: LoginContext,
  ): Promise<IAnomalyDocument | null> {
    if (!context.userId || context.success !== false) {
      return null;
    }

    // Check for recent failed logins
    const windowStart = new Date(
      Date.now() - this.config.failedLoginsWindowMinutes * 60 * 1000,
    );

    const recentFailedLogins = await AuditLog.countDocuments({
      userId: context.userId,
      action: "login_failed",
      createdAt: { $gte: windowStart },
    });

    if (recentFailedLogins >= this.config.failedLoginsThreshold) {
      const anomaly = await Anomaly.create({
        userId: context.userId as unknown as import("mongoose").Types.ObjectId,
        type: "failed_login",
        severity: "high",
        description: `Multiple failed login attempts detected: ${recentFailedLogins} attempts in ${this.config.failedLoginsWindowMinutes} minutes`,
        details: {
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          threshold: this.config.failedLoginsThreshold,
          actualValue: recentFailedLogins,
          metadata: {
            windowMinutes: this.config.failedLoginsWindowMinutes,
            lastAttemptAt: new Date().toISOString(),
          },
        },
        detectedAt: new Date(),
        flaggedBy: "system",
      });

      return anomaly;
    }

    return null;
  }

  /**
   * Detect rapid booking pattern
   * Triggers when a user makes multiple bookings in a short time
   */
  async detectRapidBooking(
    context: BookingContext,
  ): Promise<IAnomalyDocument | null> {
    if (!context.userId) {
      return null;
    }

    const windowStart = new Date(
      Date.now() - this.config.rapidBookingWindowMinutes * 60 * 1000,
    );

    const recentBookings = await Booking.countDocuments({
      userId: context.userId,
      createdAt: { $gte: windowStart },
    });

    if (recentBookings >= this.config.rapidBookingCount) {
      const anomaly = await Anomaly.create({
        userId: context.userId as unknown as import("mongoose").Types.ObjectId,
        type: "rapid_booking",
        severity: "medium",
        description: `Rapid booking pattern detected: ${recentBookings} bookings in ${this.config.rapidBookingWindowMinutes} minutes`,
        details: {
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          threshold: this.config.rapidBookingCount,
          actualValue: recentBookings,
          metadata: {
            windowMinutes: this.config.rapidBookingWindowMinutes,
            lotId: context.lotId,
            vehicleId: context.vehicleId,
          },
        },
        relatedEntityType: "Booking",
        detectedAt: new Date(),
        flaggedBy: "system",
      });

      return anomaly;
    }

    return null;
  }

  /**
   * Detect high value booking
   */
  async detectHighValueBooking(
    context: BookingContext,
  ): Promise<IAnomalyDocument | null> {
    if (!context.userId || !context.totalAmount) {
      return null;
    }

    if (context.totalAmount >= this.config.highValueThreshold) {
      const anomaly = await Anomaly.create({
        userId: context.userId as unknown as import("mongoose").Types.ObjectId,
        type: "high_value_booking",
        severity:
          context.totalAmount >= this.config.highValueThreshold * 2
            ? "high"
            : "medium",
        description: `High value booking detected: ${context.totalAmount} MYR (threshold: ${this.config.highValueThreshold} MYR)`,
        details: {
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          threshold: this.config.highValueThreshold,
          actualValue: context.totalAmount,
          metadata: {
            lotId: context.lotId,
            vehicleId: context.vehicleId,
            date: context.date,
          },
        },
        relatedEntityType: "Booking",
        detectedAt: new Date(),
        flaggedBy: "system",
      });

      return anomaly;
    }

    return null;
  }

  /**
   * Detect repeated cancellations
   */
  async detectRepeatedCancellation(
    context: BookingContext,
  ): Promise<IAnomalyDocument | null> {
    if (!context.userId) {
      return null;
    }

    const windowStart = new Date(
      Date.now() - this.config.cancellationWindowHours * 60 * 60 * 1000,
    );

    const recentCancellations = await Booking.countDocuments({
      userId: context.userId,
      status: "cancelled",
      updatedAt: { $gte: windowStart },
    });

    if (recentCancellations >= this.config.cancellationCount) {
      const anomaly = await Anomaly.create({
        userId: context.userId as unknown as import("mongoose").Types.ObjectId,
        type: "repeated_cancellation",
        severity: "medium",
        description: `Repeated cancellation pattern: ${recentCancellations} cancellations in ${this.config.cancellationWindowHours} hours`,
        details: {
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          threshold: this.config.cancellationCount,
          actualValue: recentCancellations,
          metadata: {
            windowHours: this.config.cancellationWindowHours,
          },
        },
        relatedEntityType: "Booking",
        detectedAt: new Date(),
        flaggedBy: "system",
      });

      return anomaly;
    }

    return null;
  }

  /**
   * Detect unusual login location
   * Triggers when user logs in from multiple different locations in short time
   */
  async detectUnusualLoginLocation(
    context: LoginContext,
  ): Promise<IAnomalyDocument | null> {
    if (!context.userId || !context.ipAddress) {
      return null;
    }

    const windowStart = new Date(
      Date.now() - this.config.uniqueLocationsThreshold * 60 * 1000,
    );

    // Get unique IPs in the window
    const uniqueIPs = await AuditLog.distinct("ipAddress", {
      userId: context.userId,
      action: { $in: ["login", "login_success"] },
      createdAt: { $gte: windowStart },
    });

    if (uniqueIPs.length >= this.config.uniqueLocationsThreshold) {
      const anomaly = await Anomaly.create({
        userId: context.userId as unknown as import("mongoose").Types.ObjectId,
        type: "multiple_login",
        severity: "high",
        description: `Unusual login locations detected: ${uniqueIPs.length} different IP addresses in ${this.config.uniqueLocationsThreshold * 10} minutes`,
        details: {
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          threshold: this.config.uniqueLocationsThreshold,
          actualValue: uniqueIPs.length,
          metadata: {
            uniqueIPs: uniqueIPs.slice(0, 10),
            windowMinutes: this.config.uniqueLocationsThreshold * 10,
          },
        },
        detectedAt: new Date(),
        flaggedBy: "system",
      });

      return anomaly;
    }

    return null;
  }

  /**
   * Detect account takeover attempt
   * Triggers when password is changed after multiple failed logins
   */
  async detectAccountTakeover(
    context: DetectionContext,
  ): Promise<IAnomalyDocument | null> {
    if (!context.userId) {
      return null;
    }

    // Check for recent failed logins before this action
    const windowStart = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes

    const recentFailedLogins = await AuditLog.countDocuments({
      userId: context.userId,
      action: "login_failed",
      createdAt: { $gte: windowStart },
    });

    if (recentFailedLogins >= 3) {
      const anomaly = await Anomaly.create({
        userId: context.userId as unknown as import("mongoose").Types.ObjectId,
        type: "account_takeover",
        severity: "critical",
        description: `Possible account takeover: Password changed after ${recentFailedLogins} failed login attempts`,
        details: {
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          metadata: {
            recentFailedLogins,
            windowMinutes: 30,
            action: "password_change",
          },
        },
        relatedEntityType: "User",
        detectedAt: new Date(),
        flaggedBy: "system",
      });

      return anomaly;
    }

    return null;
  }

  /**
   * Get anomalies for admin review
   */
  async getAnomalies(
    options: {
      page?: number;
      limit?: number;
      severity?: AnomalySeverity;
      status?: string;
      userId?: string;
    } = {},
  ): Promise<{ data: IAnomalyDocument[]; total: number }> {
    const { page = 1, limit = 20, severity, status, userId } = options;

    const query: Record<string, unknown> = { isActive: true };

    if (severity) {
      query.severity = severity;
    }

    if (status) {
      query.status = status;
    }

    if (userId) {
      query.userId = userId;
    }

    const [data, total] = await Promise.all([
      Anomaly.find(query)
        .sort({ detectedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Anomaly.countDocuments(query),
    ]);

    return { data, total };
  }

  /**
   * Resolve an anomaly
   */
  async resolveAnomaly(
    anomalyId: string,
    resolvedBy: string,
    resolution: string,
  ): Promise<IAnomalyDocument | null> {
    const anomaly = await Anomaly.findByIdAndUpdate(
      anomalyId,
      {
        status: "resolved",
        resolvedAt: new Date(),
        resolvedBy: resolvedBy as unknown as import("mongoose").Types.ObjectId,
        resolution,
      },
      { new: true },
    );

    return anomaly;
  }

  /**
   * Mark as false positive
   */
  async markAsFalsePositive(
    anomalyId: string,
    resolvedBy: string,
    reason: string,
  ): Promise<IAnomalyDocument | null> {
    const anomaly = await Anomaly.findByIdAndUpdate(
      anomalyId,
      {
        status: "false_positive",
        resolvedAt: new Date(),
        resolvedBy: resolvedBy as unknown as import("mongoose").Types.ObjectId,
        resolution: reason,
        isActive: false,
      },
      { new: true },
    );

    return anomaly;
  }

  /**
   * Get anomaly statistics for dashboard
   */
  async getAnomalyStats(): Promise<{
    total: number;
    bySeverity: Record<AnomalySeverity, number>;
    byType: Record<AnomalyType, number>;
    pendingCount: number;
    criticalCount: number;
  }> {
    const [total, bySeverity, byType, pendingCount, criticalCount] =
      await Promise.all([
        Anomaly.countDocuments({ isActive: true }),
        Anomaly.aggregate([
          { $match: { isActive: true } },
          { $group: { _id: "$severity", count: { $sum: 1 } } },
        ]),
        Anomaly.aggregate([
          { $match: { isActive: true } },
          { $group: { _id: "$type", count: { $sum: 1 } } },
        ]),
        Anomaly.countDocuments({ status: "pending", isActive: true }),
        Anomaly.countDocuments({ severity: "critical", isActive: true }),
      ]);

    const severityMap: Record<string, number> = {};
    const typeMap: Record<string, number> = {};

    bySeverity.forEach((item) => {
      severityMap[item._id] = item.count;
    });

    byType.forEach((item) => {
      typeMap[item._id] = item.count;
    });

    return {
      total,
      bySeverity: severityMap as Record<AnomalySeverity, number>,
      byType: typeMap as Record<AnomalyType, number>,
      pendingCount,
      criticalCount,
    };
  }
}

export const anomalyService = new AnomalyService();
