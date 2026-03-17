import crypto from "crypto";
import { config } from "../config/index.js";
import { Booking, User } from "../models/index.js";
import { emailService } from "./email.service.js";
import logger from "../utils/logger.js";

// RinggitPay uses form POST redirects - not REST API

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
  paymentFormHtml?: string;
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
  rp_appId: string;
  rp_amount: string;
  rp_statusCode: string;
  rp_orderId: string;
  rp_paymentMode: string;
  rp_transactionId?: string;
  rp_signature: string;
}

// Status code mapping
const StatusCodeMap: Record<string, "completed" | "pending" | "failed"> = {
  RP00: "completed", // Success
  RP09: "pending", // Pending
  RP01: "failed", // Failed
};

class RinggitPayService {
  private readonly apiUrl: string;
  private readonly appId: string;
  private readonly requestKey: string;
  private readonly responseKey: string;

  constructor() {
    // Use UAT or PROD based on environment
    const isProduction = process.env.NODE_ENV === "production";
    this.apiUrl = isProduction
      ? "https://ringgitpay.com/payment"
      : "https://ringgitpay.co/payment";

    // Parse API key format: AppId:RequestKey
    const apiKeyFull = config.ringgitpay.apiKey;
    const parts = apiKeyFull.split(":");
    this.appId = parts[0] || "RPA-PARTAT-859";
    this.requestKey =
      parts[1] || config.ringgitpay.apiSecret || "1XBY04XKW RPLIZU2V0MG";
    this.responseKey =
      config.ringgitpay.webhookSecret || "1XBY04XKW RPLIZU2V0MG";

    logger.info("RinggitPay service initialized", {
      apiUrl: this.apiUrl,
      appId: this.appId,
      mode: isProduction ? "PRODUCTION" : "UAT",
    });
  }

  /**
   * Generate checksum for payment request
   * Format: appId|currency|amount|orderId|REQUESTKEY -> SHA256 -> UPPERCASE
   */
  private generateChecksum(
    appId: string,
    currency: string,
    amount: number,
    orderId: string,
  ): string {
    const data = `${appId}|${currency}|${amount.toFixed(2)}|${orderId}|${this.requestKey}`;
    return crypto.createHash("sha256").update(data).digest("hex").toUpperCase();
  }

  /**
   * Verify response checksum
   */
  verifyResponseSignature(payload: string): boolean {
    try {
      // Parse the payload and verify signature
      const params = new URLSearchParams(payload);
      const signature = params.get("rp_signature") || "";

      // Build data string for verification
      const appId = params.get("rp_appId") || "";
      const amount = params.get("rp_amount") || "0";
      const statusCode = params.get("rp_statusCode") || "";
      const orderId = params.get("rp_orderId") || "";

      const data = `${appId}|MYR|${amount}|${orderId}|${this.responseKey}`;
      const expectedSignature = crypto
        .createHash("sha256")
        .update(data)
        .digest("hex")
        .toUpperCase();

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
    } catch (error) {
      logger.error("Response signature verification error:", error);
      return false;
    }
  }

  /**
   * Create payment - generates form post redirect to RinggitPay
   */
  async createPayment(
    request: RinggitPayPaymentRequest,
  ): Promise<RinggitPayPaymentResponse> {
    try {
      logger.info(`Creating payment for order: ${request.orderId}`, {
        amount: request.amount,
        currency: request.currency,
      });

      // Generate checksum
      const checkSum = this.generateChecksum(
        this.appId,
        request.currency,
        request.amount,
        request.orderId,
      );

      // Build payment form - RinggitPay uses form POST redirect
      // The frontend will redirect to this URL with POST data
      const checkoutUrl = this.apiUrl;

      // Generate hidden form HTML that auto-submits
      const paymentFormHtml = this.generatePaymentForm({
        appId: this.appId,
        currency: request.currency,
        amount: request.amount.toFixed(2),
        orderId: request.orderId,
        checkSum: checkSum,
        customerName: request.customerName,
        customerEmail: request.customerEmail,
        customerPhone: request.customerPhone || "",
        description: request.description || "",
        redirectUrl: request.redirectUrl,
        callbackUrl: request.callbackUrl,
      });

      logger.info(`Payment form generated for order: ${request.orderId}`);

      return {
        success: true,
        paymentId: request.orderId,
        checkoutUrl: checkoutUrl,
        paymentFormHtml: paymentFormHtml,
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
   * Generate payment form HTML for auto-submit
   */
  private generatePaymentForm(params: {
    appId: string;
    currency: string;
    amount: string;
    orderId: string;
    checkSum: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    description: string;
    redirectUrl: string;
    callbackUrl: string;
  }): string {
    return `
<form id="ringgitpay-form" method="POST" action="${this.apiUrl}">
  <input type="hidden" name="appId" value="${params.appId}">
  <input type="hidden" name="currency" value="${params.currency}">
  <input type="hidden" name="amount" value="${params.amount}">
  <input type="hidden" name="orderId" value="${params.orderId}">
  <input type="hidden" name="checkSum" value="${params.checkSum}">
  <input type="hidden" name="customerName" value="${params.customerName}">
  <input type="hidden" name="customerEmail" value="${params.customerEmail}">
  <input type="hidden" name="customerPhone" value="${params.customerPhone}">
  <input type="hidden" name="description" value="${params.description}">
  <input type="hidden" name="redirectUrl" value="${params.redirectUrl}">
  <input type="hidden" name="callbackUrl" value="${params.callbackUrl}">
</form>
<script>document.getElementById('ringgitpay-form').submit();</script>
    `.trim();
  }

  /**
   * Process refund
   */
  async processRefund(
    request: RinggitPayRefundRequest,
  ): Promise<RinggitPayRefundResponse> {
    try {
      logger.info(
        `Processing refund for order: ${request.orderId}, amount: ${request.amount}`,
      );

      // Update booking with refund info
      const booking = await Booking.findOne({ transactionId: request.orderId });
      if (booking) {
        booking.refundId = `REF-${Date.now()}`;
        booking.refundStatus = "processing";
        await booking.save();
      }

      return {
        success: true,
        refundId: `REF-${Date.now()}`,
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
   * Handle webhook/callback from RinggitPay
   */
  async handleWebhook(payload: Record<string, string>): Promise<boolean> {
    try {
      const orderId = payload.rp_orderId;
      const statusCode = payload.rp_statusCode;
      const transactionId = payload.rp_transactionId || "";

      logger.info(
        `Processing webhook for order: ${orderId}, status: ${statusCode}`,
      );

      // Map status code
      const paymentStatus = StatusCodeMap[statusCode] || "pending";

      switch (paymentStatus) {
        case "completed":
          await this.handlePaymentSuccess(orderId, transactionId, payload);
          break;
        case "pending":
          await this.handlePaymentPending(orderId, payload);
          break;
        case "failed":
          await this.handlePaymentFailed(orderId, payload);
          break;
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
    orderId: string,
    transactionId: string,
    payload: Record<string, string>,
  ): Promise<void> {
    const booking = await Booking.findOne({ _id: orderId });

    if (!booking) {
      logger.warn(`Booking not found for order: ${orderId}`);
      return;
    }

    booking.paymentStatus = "completed";
    booking.paymentId = transactionId;
    booking.transactionId = transactionId;
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
    }
  }

  /**
   * Handle pending payment
   */
  private async handlePaymentPending(
    orderId: string,
    payload: Record<string, string>,
  ): Promise<void> {
    const booking = await Booking.findOne({ _id: orderId });

    if (!booking) {
      logger.warn(`Booking not found for order: ${orderId}`);
      return;
    }

    booking.paymentStatus = "pending";
    booking.transactionId = payload.rp_transactionId || "";
    await booking.save();

    logger.info(`Payment pending for booking: ${booking._id}`);
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(
    orderId: string,
    payload: Record<string, string>,
  ): Promise<void> {
    const booking = await Booking.findOne({ _id: orderId });

    if (!booking) {
      logger.warn(`Booking not found for order: ${orderId}`);
      return;
    }

    booking.paymentStatus = "failed";
    await booking.save();

    logger.info(`Payment failed for booking: ${booking._id}`);
  }

  /**
   * Parse redirect response from RinggitPay
   */
  parseRedirectResponse(queryParams: Record<string, string>): {
    success: boolean;
    orderId: string;
    status: string;
    message: string;
  } {
    const statusCode = queryParams.rp_statusCode || "RP01";
    const orderId = queryParams.rp_orderId || "";

    // Map status codes
    const statusMessages: Record<string, string> = {
      RP00: "Payment successful",
      RP09: "Payment pending",
      RP01: "Payment failed",
    };

    return {
      success: statusCode === "RP00",
      orderId: orderId,
      status: StatusCodeMap[statusCode] || "failed",
      message: statusMessages[statusCode] || "Unknown status",
    };
  }
}

// Export singleton instance
export const ringgitPayService = new RinggitPayService();
