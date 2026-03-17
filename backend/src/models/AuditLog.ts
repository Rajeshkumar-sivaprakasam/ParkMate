import mongoose, { Document, Schema } from "mongoose";

export interface IAuditLogDocument extends Document {
  _id: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  action:
    | "create"
    | "read"
    | "update"
    | "delete"
    | "login"
    | "login_failed"
    | "logout"
    | "book"
    | "cancel"
    | "refund"
    | "check_in"
    | "check_out"
    | "admin_action";
  entityType: string;
  entityId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLogDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    action: {
      type: String,
      enum: [
        "create",
        "read",
        "update",
        "delete",
        "login",
        "login_failed",
        "logout",
        "book",
        "cancel",
        "refund",
        "check_in",
        "check_out",
        "admin_action",
      ],
      required: [true, "Action is required"],
    },
    entityType: {
      type: String,
      required: [true, "Entity type is required"],
    },
    entityId: {
      type: String,
      required: [true, "Entity ID is required"],
    },
    oldValues: {
      type: Schema.Types.Mixed,
    },
    newValues: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for efficient querying
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLogDocument>(
  "AuditLog",
  auditLogSchema,
);
