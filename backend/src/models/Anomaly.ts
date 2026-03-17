import mongoose, { Document, Schema } from "mongoose";

export type AnomalyType =
  | "failed_login"
  | "multiple_login"
  | "unusual_booking_pattern"
  | "rapid_booking"
  | "suspicious_location"
  | "payment_anomaly"
  | "high_value_booking"
  | "repeated_cancellation"
  | "account_takeover"
  | "ip_mismatch";

export type AnomalySeverity = "low" | "medium" | "high" | "critical";

export type AnomalyStatus =
  | "pending"
  | "investigating"
  | "resolved"
  | "false_positive";

export interface IAnomalyDocument extends Document {
  _id: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  type: AnomalyType;
  severity: AnomalySeverity;
  status: AnomalyStatus;
  description: string;
  details: {
    ipAddress?: string;
    userAgent?: string;
    location?: {
      country?: string;
      city?: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
    device?: string;
    browser?: string;
    os?: string;
    metadata?: Record<string, unknown>;
    previousValue?: string;
    newValue?: string;
    threshold?: number;
    actualValue?: number;
  };
  relatedEntityType?: "Booking" | "User" | "Payment" | "Vehicle";
  relatedEntityId?: mongoose.Types.ObjectId;
  detectedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  resolution?: string;
  flaggedBy: "system" | "admin";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const anomalySchema = new Schema<IAnomalyDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    type: {
      type: String,
      enum: [
        "failed_login",
        "multiple_login",
        "unusual_booking_pattern",
        "rapid_booking",
        "suspicious_location",
        "payment_anomaly",
        "high_value_booking",
        "repeated_cancellation",
        "account_takeover",
        "ip_mismatch",
      ],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "investigating", "resolved", "false_positive"],
      default: "pending",
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    details: {
      ipAddress: { type: String },
      userAgent: { type: String },
      location: {
        country: { type: String },
        city: { type: String },
        coordinates: {
          lat: { type: Number },
          lng: { type: Number },
        },
      },
      device: { type: String },
      browser: { type: String },
      os: { type: String },
      metadata: { type: Schema.Types.Mixed },
      previousValue: { type: String },
      newValue: { type: String },
      threshold: { type: Number },
      actualValue: { type: Number },
    },
    relatedEntityType: {
      type: String,
      enum: ["Booking", "User", "Payment", "Vehicle"],
    },
    relatedEntityId: {
      type: Schema.Types.ObjectId,
    },
    detectedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    resolution: {
      type: String,
    },
    flaggedBy: {
      type: String,
      enum: ["system", "admin"],
      default: "system",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for efficient querying
anomalySchema.index({ userId: 1, status: 1 });
anomalySchema.index({ type: 1, severity: 1 });
anomalySchema.index({ detectedAt: -1 });
anomalySchema.index({ isActive: 1, status: 1 });

export const Anomaly = mongoose.model<IAnomalyDocument>(
  "Anomaly",
  anomalySchema,
);
