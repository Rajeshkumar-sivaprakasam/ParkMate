import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config/index.js";
import { connectDB } from "./config/database.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import {
  apiLimiter,
  authLimiter,
  paymentLimiter,
  webhookLimiter,
} from "./middleware/rateLimiter.js";

// Routes
import authRoutes from "./routes/auth.js";
import parkingRoutes from "./routes/parking.js";
import parkingSpotRoutes from "./routes/parking-spots.js";
import bookingRoutes from "./routes/booking.js";
import bookingApprovalRoutes from "./routes/booking-approval.js";
import vehicleRoutes from "./routes/vehicle.js";
import webhookRoutes from "./routes/webhook.js";
import refundPolicyRoutes from "./routes/refund-policy.js";
import analyticsRoutes from "./routes/analytics.js";
import invoiceRoutes from "./routes/invoice.js";
import calendarRoutes from "./routes/calendar.js";
import organizationRoutes from "./routes/organization.js";
import anomalyRoutes from "./routes/anomaly.js";

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API Routes with rate limiting
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/parking", apiLimiter, parkingRoutes);
app.use("/api/parking-spots", apiLimiter, parkingSpotRoutes);
app.use("/api/bookings", apiLimiter, bookingApprovalRoutes); // Must be before bookingRoutes
app.use("/api/bookings", apiLimiter, bookingRoutes);
app.use("/api/vehicles", apiLimiter, vehicleRoutes);
app.use("/api/webhooks", webhookLimiter, webhookRoutes);
app.use("/api/refund-policies", apiLimiter, refundPolicyRoutes);
app.use("/api/analytics", apiLimiter, analyticsRoutes);
app.use("/api/invoices", paymentLimiter, invoiceRoutes);
app.use("/api/calendar", apiLimiter, calendarRoutes);
app.use("/api/organizations", apiLimiter, organizationRoutes);
app.use("/api/anomalies", apiLimiter, anomalyRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;
