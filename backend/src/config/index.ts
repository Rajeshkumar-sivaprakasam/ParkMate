import dotenv from "dotenv";
dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  // MongoDB
  mongodb: {
    uri:
      process.env.MONGODB_URI || "mongodb://localhost:27017/kilo-car-parking",
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || "default-secret-change-me",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "default-refresh-secret",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  },

  // RinggitPay
  ringgitpay: {
    apiUrl:
      process.env.RINGGITPAY_API_URL || "https://api.ringgitpay.example.com",
    apiKey: process.env.RINGGITPAY_API_KEY || "",
    apiSecret: process.env.RINGGITPAY_API_SECRET || "",
    webhookSecret: process.env.RINGGITPAY_WEBHOOK_SECRET || "",
  },

  // Email
  smtp: {
    host: process.env.SMTP_HOST || "smtp.example.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "noreply@kilocar.example.com",
  },

  // Frontend
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",

  // QR Code
  qrCode: {
    expiryHours: parseInt(process.env.QR_CODE_EXPIRY_HOURS || "24", 10),
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || "info",
};
