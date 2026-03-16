import { Router, Response, NextFunction } from "express";
import { authenticate } from "../middleware/auth.js";
import { invoiceService } from "../services/invoice.service.js";
import type { AuthRequest } from "../middleware/auth.js";

const router = Router();

// Get invoice data
router.get(
  "/:bookingId",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { bookingId } = req.params;
      const userId = req.user?.userId;

      const invoice = await invoiceService.generateInvoiceData(bookingId);

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      // Check if user owns this booking
      const booking = await import("../models/index.js").then((m) =>
        m.Booking.findById(bookingId),
      );

      if (!booking || booking.userId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      res.json({
        success: true,
        message: "Invoice retrieved successfully",
        data: invoice,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Get invoice HTML
router.get(
  "/:bookingId/html",
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

      const html = await invoiceService.generateInvoiceHTML(bookingId);

      if (!html) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      res.setHeader("Content-Type", "text/html");
      res.send(html);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
