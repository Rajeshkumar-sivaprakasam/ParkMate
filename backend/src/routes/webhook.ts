import { Router, Request, Response, NextFunction } from "express";
import { body } from "express-validator";
import { ringgitPayService } from "../services/ringgitpay.service.js";
import type { RinggitPayWebhookPayload } from "../services/ringgitpay.service.js";
import logger from "../utils/logger.js";

const router = Router();

// RinggitPay webhook endpoint
router.post(
  "/ringgitpay",
  [
    body("event").notEmpty().withMessage("Event type is required"),
    body("paymentId").notEmpty().withMessage("Payment ID is required"),
    body("orderId").notEmpty().withMessage("Order ID is required"),
    body("status").notEmpty().withMessage("Status is required"),
    body("signature").notEmpty().withMessage("Signature is required"),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const signature = req.headers["x-ringgitpay-signature"] as string;

      if (!signature) {
        logger.warn("Webhook received without signature");
        return res.status(401).json({
          success: false,
          message: "Missing signature",
        });
      }

      // Verify webhook signature
      const rawBody = JSON.stringify(req.body);
      const isValidSignature = ringgitPayService.verifyWebhookSignature(
        rawBody,
        signature,
      );

      if (!isValidSignature) {
        logger.warn("Invalid webhook signature received");
        return res.status(401).json({
          success: false,
          message: "Invalid signature",
        });
      }

      const payload = req.body as RinggitPayWebhookPayload;
      logger.info(
        `Received webhook: ${payload.event} for order ${payload.orderId}`,
      );

      // Process webhook
      const success = await ringgitPayService.handleWebhook(payload);

      if (success) {
        res.status(200).json({
          success: true,
          message: "Webhook processed successfully",
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to process webhook",
        });
      }
    } catch (error) {
      logger.error("Webhook processing error:", error);
      next(error);
    }
  },
);

// Health check for webhook endpoint
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "webhook",
    timestamp: new Date().toISOString(),
  });
});

export default router;
