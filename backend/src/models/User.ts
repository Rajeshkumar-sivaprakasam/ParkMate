import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUserDocument extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: "user" | "admin" | "superadmin";
  company?: string;
  department?: string;
  employeeId?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  twoFactorEnabled: boolean;
  failedLoginAttempts: number;
  lockUntil?: Date;
  lastFailedLogin?: Date;
  preferences: {
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    defaultParkingZone?: string;
    favoriteLots: string[];
    theme: "light" | "dark" | "system";
    language: string;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false,
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin", "superadmin"],
      default: "user",
    },
    company: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    employeeId: {
      type: String,
      trim: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    lastFailedLogin: {
      type: Date,
    },
    preferences: {
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
      },
      defaultParkingZone: { type: String },
      favoriteLots: [{ type: Schema.Types.ObjectId, ref: "ParkingLot" }],
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },
      language: {
        type: String,
        default: "en",
      },
    },
  },
  {
    timestamps: true,
  },
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ company: 1 });

export const User = mongoose.model<IUserDocument>("User", userSchema);
