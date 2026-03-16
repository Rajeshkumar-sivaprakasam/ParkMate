import crypto from "crypto";
import { config } from "../config/index.js";
import { Booking, User } from "../models/index.js";
import { AppError } from "../middleware/errorHandler.js";
import logger from "../utils/logger.js";
import { emailService } from "./email.service.js";

// RinggitPay API types
export interface RinggitPayPaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  description?: string;
  callbackUrl: string;
  redirectUrl: string;
}

export interface RinggitPayPaymentResponse {
  success: boolean;
  paymentId?: string;
  checkoutUrl?: string;
  qrCode?: string;
  message?: string;
}

export interface RinggitPayRefundRequest {
  paymentId: string;
  amount: number;
  reason?: string;
  orderId: string;
}

export interface RinggitPayRefundResponse {
  success: boolean;
  refundId?: string;
  status?: string;
  message?: string;
}

export interface RinggitPayWebhookPayload {
  event: string;
  paymentId: string;
  orderId: string;
  status: "success" | "failed" | "pending" | "cancelled";
  amount: number;
  currency: string;
  transactionId?: string;
  signature: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// Refund status mapping
const RefundStatusMap: Record<
  string,
  "none" | "pending" | "processing" | "completed" | "failed"
> = {
  pending: "pending",
  processing: "processing",
  completed: "completed",
  failed: "failed",
};

class RinggitPayService {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly webhookSecret: string;

  constructor() {
    this.apiUrl = config.ringgitpay.apiUrl;
    this.apiKey = config.ringgitpay.apiKey;
    this.apiSecret = config.ringgitpay.apiSecret;
    this.webhookSecret = config.ringgitpay.webhookSecret;
    logger.info("RinggitPay service initialized");
  }

  /**
   * Generate HMAC signature for webhook validation
   */
  private generateSignature(payload: string): string {
    return crypto
      .createHmac("sha256", this.apiSecret)
      .update(payload)
      .digest("hex");
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const expectedSignature = this.generateSignature(payload);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  /**
   * Create payment link
   */
  async createPayment(
    request: RinggitPayPaymentRequest,
  ): Promise<RinggitPayPaymentResponse> {
    try {
      const timestamp = new Date().toISOString();
      const payload = JSON.stringify({
        ...request,
        timestamp,
      });

      const signature = this.generateSignature(payload);

      // In production, make actual API call to RinggitPay
      // For now, simulate the response
      logger.info(`Creating payment for order: ${request.orderId}`);

      // Mock response - in production, replace with actual API call
      const mockPaymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      return {
        success: true,
        paymentId: mockPaymentId,
        checkoutUrl: `${this.apiUrl}/checkout/${mockPaymentId}`,
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mockPaymentId)}`,
      };
    } catch (error) {
      logger.error("Failed to create payment:", error);
      return {
        success: false,
        message: "Failed to create payment",
      };
    }
  }

  /**
   * Process refund
   */
  async processRefund(
    request: RinggitPayRefundRequest,
  ): Promise<RinggitPayRefundResponse> {
    try {
      const timestamp = new Date().toISOString();
      const payload = JSON.stringify({
        ...request,
        timestamp,
      });

      logger.info(
        `Processing refund for order: ${request.orderId}, amount: ${request.amount}`,
      );

      // Mock response - in production, replace with actual API call
      const mockRefundId = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Update booking with refund info
      const booking = await Booking.findOne({ transactionId: request.orderId });
      if (booking) {
        booking.refundId = mockRefundId;
        booking.refundStatus = "processing";
        await booking.save();
      }

      return {
        success: true,
        refundId: mockRefundId,
        status: "processing",
      };
    } catch (error) {
      logger.error("Failed to process refund:", error);
      return {
        success: false,
        message: "Failed to process refund",
      };
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(payload: RinggitPayWebhookPayload): Promise<boolean> {
    try {
      logger.info(
        `Processing webhook event: ${payload.event}, order: ${payload.orderId}`,
      );

      switch (payload.event) {
        case "payment.success":
          await this.handlePaymentSuccess(payload);
          break;
        case "payment.failed":
          await this.handlePaymentFailed(payload);
          break;
        case "refund.success":
          await this.handleRefundSuccess(payload);
          break;
        case "refund.failed":
          await this.handleRefundFailed(payload);
          break;
        default:
          logger.warn(`Unhandled webhook event: ${payload.event}`);
      }

      return true;
    } catch (error) {
      logger.error("Failed to handle webhook:", error);
      return false;
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSuccess(
    payload: RinggitPayWebhookPayload,
  ): Promise<void> {
    const booking = await Booking.findOne({ transactionId: payload.orderId });

    if (!booking) {
      logger.warn(`Booking not found for order: ${payload.orderId}`);
      return;
    }

    booking.paymentStatus = "completed";
    booking.paymentId = payload.paymentId;
    booking.transactionId = payload.transactionId || payload.paymentId;
    await booking.save();

    logger.info(`Payment confirmed for booking: ${booking._id}`);

    // Send booking confirmation email
    const user = await User.findById(booking.userId);
    if (user) {
      const lot = await import("../models/index.js").then((m) =>
        m.ParkingLot.findById(booking.lotId),
      );
      const vehicle = await import("../models/index.js").then((m) =>
        m.Vehicle.findById(booking.vehicleId),
      );

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

      // Also notify admin
      const admins = await User.find({
        role: { $in: ["admin", "superadmin"] },
      });
      for (const admin of admins) {
        await emailService.sendAdminBookingCreated(admin.email, {
          bookingId: booking._id.toString(),
          userName: `${user.firstName} ${user.lastName}`,
          userEmail: user.email,
          parkingLotName: lot?.name || "N/A",
          bookingDate: new Date(booking.date).toLocaleDateString(),
          startTime: booking.startTime,
          endTime: booking.endTime,
          vehicleInfo: vehicle
            ? `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`
            : "N/A",
          totalAmount: booking.totalAmount,
          currency: booking.currency,
        });
      }
    }
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(
    payload: RinggitPayWebhookPayload,
  ): Promise<void> {
    const booking = await Booking.findOne({ transactionId: payload.orderId });

    if (!booking) {
      logger.warn(`Booking not found for order: ${payload.orderId}`);
      return;
    }

    booking.paymentStatus = "failed";
    await booking.save();

    logger.info(`Payment failed for booking: ${booking._id}`);
  }

  /**
   * Handle successful refund
   */
  private async handleRefundSuccess(
    payload: RinggitPayWebhookPayload,
  ): Promise<void> {
    const booking = await Booking.findOne({ transactionId: payload.orderId });

    if (!booking) {
      logger.warn(`Booking not found for order: ${payload.orderId}`);
      return;
    }

    booking.refundStatus = "completed";
    booking.refundProcessedAt = new Date();
    booking.paymentStatus = "refunded";
    await booking.save();

    logger.info(`Refund completed for booking: ${booking._id}`);

    // Send refund confirmation email
    const user = await User.findById(booking.userId);
    if (user) {
      await emailService.sendRefundProcessed(user.email, {
        userName: `${user.firstName} ${user.lastName}`,
        bookingId: booking._id.toString(),
        refundId: booking.refundId,
        refundAmount: booking.refundAmount || 0,
        currency: booking.currency,
        processedDate: new Date().toLocaleDateString(),
      });
    }
  }

  /**
   * Handle failed refund
   */
  private async handleRefundFailed(
    payload: RinggitPayWebhookPayload,
  ): Promise<void> {
    const booking = await Booking.findOne({ transactionId: payload.orderId });

    if (!booking) {
      logger.warn(`Booking not found for order: ${payload.orderId}`);
      return;
    }

    booking.refundStatus = "failed";
    await booking.save();

    logger.error(`Refund failed for booking: ${booking._id}`);

    // Send refund failed email
    const user = await User.findById(booking.userId);
    if (user) {
      await emailService.sendRefundFailed(user.email, {
        userName: `${user.firstName} ${user.lastName}`,
        bookingId: booking._id.toString(),
        refundAmount: booking.refundAmount || 0,
        currency: booking.currency,
        errorMessage: (payload.metadata?.reason as string) || "Unknown error",
      });
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string): Promise<{
    success: boolean;
    status?: string;
    amount?: number;
    message?: string;
  }> {
    try {
      // Mock implementation - in production, call RinggitPay API
      logger.info(`Getting payment status for: ${paymentId}`);

      return {
        success: true,
        status: "completed",
        amount: 0,
      };
    } catch (error) {
      logger.error("Failed to get payment status:", error);
      return {
        success: false,
        message: "Failed to get payment status",
      };
    }
  }

  /**
   * Get refund status
   */
  async getRefundStatus(refundId: string): Promise<{
    success: boolean;
    status?: string;
    amount?: number;
    message?: string;
  }> {
    try {
      // Mock implementation - in production, call RinggitPay API
      logger.info(`Getting refund status for: ${refundId}`);

      return {
        success: true,
        status: "completed",
        amount: 0,
      };
    } catch (error) {
      logger.error("Failed to get refund status:", error);
      return {
        success: false,
        message: "Failed to get refund status",
      };
    }
  }
}

// Export singleton instance
export const ringgitPayService = new RinggitPayService();
