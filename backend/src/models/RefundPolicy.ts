import mongoose, { Document, Schema } from "mongoose";

export interface IRefundPolicyDocument extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  isDefault: boolean;
  tiers: {
    _id: mongoose.Types.ObjectId;
    name: string;
    hoursBeforeBooking: number;
    refundPercentage: number;
    isNonRefundable: boolean;
  }[];
  applicableZones: mongoose.Types.ObjectId[];
  applicableUserRoles: string[];
  minAdvanceHours: number;
  maxAdvanceDays: number;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const refundTierSchema = new Schema({
  name: {
    type: String,
    required: [true, "Tier name is required"],
    trim: true,
  },
  hoursBeforeBooking: {
    type: Number,
    required: [true, "Hours before booking is required"],
    min: 0,
  },
  refundPercentage: {
    type: Number,
    required: [true, "Refund percentage is required"],
    min: 0,
    max: 100,
  },
  isNonRefundable: {
    type: Boolean,
    default: false,
  },
});

const refundPolicySchema = new Schema<IRefundPolicyDocument>(
  {
    name: {
      type: String,
      required: [true, "Policy name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    tiers: [refundTierSchema],
    applicableZones: [
      {
        type: Schema.Types.ObjectId,
        ref: "ParkingZone",
      },
    ],
    applicableUserRoles: [
      {
        type: String,
        enum: ["user", "admin", "superadmin"],
      },
    ],
    minAdvanceHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxAdvanceDays: {
      type: Number,
      default: 30,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
refundPolicySchema.index({ isDefault: 1 });
refundPolicySchema.index({ isActive: 1 });

export const RefundPolicy = mongoose.model<IRefundPolicyDocument>(
  "RefundPolicy",
  refundPolicySchema,
);
