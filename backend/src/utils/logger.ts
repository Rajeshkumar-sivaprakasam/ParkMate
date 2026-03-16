import winston from "winston";
import { config } from "../config/index.js";

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(
    ({ timestamp, level, message, context, ...metadata }) => {
      let msg = `${timestamp} [${context || "App"}] ${level.toUpperCase()}: ${message}`;
      if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
      }
      return msg;
    },
  ),
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(
    ({ timestamp, level, message, context, ...metadata }) => {
      let msg = `${timestamp} [${context || "App"}] ${level}: ${message}`;
      if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata, null, 2)}`;
      }
      return msg;
    },
  ),
);

// Create logger instance
const logger = winston.createLogger({
  level: config.logLevel,
  format: logFormat,
  defaultMeta: { service: "kilo-car" },
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});

/**
 * Create a context-specific logger
 */
export function createLogger(context: string): winston.Logger {
  return logger.child({ context });
}

// Export logger instance
export { logger as default };
