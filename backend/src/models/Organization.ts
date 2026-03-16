import mongoose, { Document, Schema } from "mongoose";

export interface IOrganizationDocument extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  logo?: string;
  website?: string;
  contactEmail: string;
  contactPhone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  settings: {
    allowPublicBooking: boolean;
    requireApproval: boolean;
    maxAdvanceBookingDays: number;
    defaultRefundPolicy?: mongoose.Types.ObjectId;
    allowVisitorBooking: boolean;
    workingHours?: {
      start: string;
      end: string;
      timezone: string;
    };
  };
  subscription: {
    plan: "free" | "basic" | "premium" | "enterprise";
    status: "active" | "suspended" | "expired";
    startDate: Date;
    endDate?: Date;
    maxUsers: number;
    maxParkingLots: number;
  };
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<IOrganizationDocument>(
  {
    name: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
      maxlength: 100,
    },
    code: {
      type: String,
      required: [true, "Organization code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 20,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    logo: {
      type: String,
    },
    website: {
      type: String,
      trim: true,
    },
    contactEmail: {
      type: String,
      required: [true, "Contact email is required"],
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: { type: String, default: "Malaysia" },
    },
    settings: {
      allowPublicBooking: {
        type: Boolean,
        default: true,
      },
      requireApproval: {
        type: Boolean,
        default: false,
      },
      maxAdvanceBookingDays: {
        type: Number,
        default: 30,
        min: 1,
        max: 365,
      },
      defaultRefundPolicy: {
        type: Schema.Types.ObjectId,
        ref: "RefundPolicy",
      },
      allowVisitorBooking: {
        type: Boolean,
        default: true,
      },
      workingHours: {
        start: {
          type: String,
          default: "00:00",
        },
        end: {
          type: String,
          default: "23:59",
        },
        timezone: {
          type: String,
          default: "Asia/Kuala_Lumpur",
        },
      },
    },
    subscription: {
      plan: {
        type: String,
        enum: ["free", "basic", "premium", "enterprise"],
        default: "free",
      },
      status: {
        type: String,
        enum: ["active", "suspended", "expired"],
        default: "active",
      },
      startDate: {
        type: Date,
        default: Date.now,
      },
      endDate: Date,
      maxUsers: {
        type: Number,
        default: 10,
      },
      maxParkingLots: {
        type: Number,
        default: 1,
      },
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
organizationSchema.index({ code: 1 });
organizationSchema.index({ isActive: 1 });
organizationSchema.index({ "subscription.status": 1 });

export const Organization = mongoose.model<IOrganizationDocument>(
  "Organization",
  organizationSchema,
);
