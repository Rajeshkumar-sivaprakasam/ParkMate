import mongoose, { Document, Schema } from "mongoose";

export interface IBookingDocument extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  lotId: mongoose.Types.ObjectId;
  zoneId?: mongoose.Types.ObjectId;
  spotId?: mongoose.Types.ObjectId;
  bookingType: "hourly" | "daily" | "monthly" | "visitor" | "event";
  status:
    | "pending"
    | "confirmed"
    | "checked_in"
    | "checked_out"
    | "cancelled"
    | "no_show"
    | "expired";
  approvalStatus:
    | "auto_approved"
    | "pending_approval"
    | "approved"
    | "rejected";
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  totalAmount: number;
  currency: string;
  paymentStatus:
    | "pending"
    | "processing"
    | "completed"
    | "failed"
    | "refunded"
    | "partially_refunded";
  paymentMethod?: "card" | "wallet" | "bank_transfer" | "corporate";
  paymentId?: string;
  transactionId?: string;
  qrCode?: string;
  passcode?: string;
  qrCodeGeneratedAt?: Date;
  checkedInAt?: Date;
  checkedOutAt?: Date;
  actualCheckInTime?: string;
  actualCheckOutTime?: string;
  isRecurring: boolean;
  recurringPattern?: {
    frequency: "daily" | "weekly" | "monthly";
    daysOfWeek: number[];
    endDate?: Date;
    maxOccurrences?: number;
    skipDates: Date[];
  };
  parentBookingId?: mongoose.Types.ObjectId;
  isVisitorBooking: boolean;
  visitorName?: string;
  visitorPhone?: string;
  hostUserId?: mongoose.Types.ObjectId;
  cancelledAt?: Date;
  cancellationReason?: string;
  refundStatus?: "none" | "pending" | "processing" | "completed" | "failed";
  refundAmount?: number;
  refundId?: string;
  refundProcessedAt?: Date;
  nonRefundable: boolean;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBookingDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    lotId: {
      type: Schema.Types.ObjectId,
      ref: "ParkingLot",
      required: true,
    },
    zoneId: {
      type: Schema.Types.ObjectId,
      ref: "ParkingZone",
    },
    spotId: {
      type: Schema.Types.ObjectId,
      ref: "ParkingSpot",
    },
    bookingType: {
      type: String,
      enum: ["hourly", "daily", "monthly", "visitor", "event"],
      default: "hourly",
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "checked_in",
        "checked_out",
        "cancelled",
        "no_show",
        "expired",
      ],
      default: "pending",
    },
    approvalStatus: {
      type: String,
      enum: ["auto_approved", "pending_approval", "approved", "rejected"],
      default: "auto_approved",
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Booking date is required"],
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
    },
    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: 1,
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: 0,
    },
    currency: {
      type: String,
      default: "MYR",
    },
    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "processing",
        "completed",
        "failed",
        "refunded",
        "partially_refunded",
      ],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["card", "wallet", "bank_transfer", "corporate"],
    },
    paymentId: {
      type: String,
    },
    transactionId: {
      type: String,
    },
    qrCode: {
      type: String,
    },
    passcode: {
      type: String,
    },
    qrCodeGeneratedAt: {
      type: Date,
    },
    checkedInAt: {
      type: Date,
    },
    checkedOutAt: {
      type: Date,
    },
    actualCheckInTime: {
      type: String,
    },
    actualCheckOutTime: {
      type: String,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPattern: {
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly"],
      },
      daysOfWeek: [
        {
          type: Number,
          min: 0,
          max: 6,
        },
      ],
      endDate: {
        type: Date,
      },
      maxOccurrences: {
        type: Number,
      },
      skipDates: [
        {
          type: Date,
        },
      ],
    },
    parentBookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
    },
    isVisitorBooking: {
      type: Boolean,
      default: false,
    },
    visitorName: {
      type: String,
      trim: true,
    },
    visitorPhone: {
      type: String,
      trim: true,
    },
    hostUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
    refundStatus: {
      type: String,
      enum: ["none", "pending", "processing", "completed", "failed"],
      default: "none",
    },
    refundAmount: {
      type: Number,
      min: 0,
    },
    refundId: {
      type: String,
    },
    refundProcessedAt: {
      type: Date,
    },
    nonRefundable: {
      type: Boolean,
      default: false,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
bookingSchema.index({ userId: 1, date: -1 });
bookingSchema.index({ lotId: 1, date: -1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ qrCode: 1 });
bookingSchema.index({ transactionId: 1 });
bookingSchema.index({ date: 1, status: 1 });

export const Booking = mongoose.model<IBookingDocument>(
  "Booking",
  bookingSchema,
);
