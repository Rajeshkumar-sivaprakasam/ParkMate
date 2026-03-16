import mongoose, { Document, Schema } from "mongoose";

export interface IVehicleDocument extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  color: string;
  vehicleType: "sedan" | "suv" | "van" | "motorcycle" | "truck" | "compact";
  isElectric: boolean;
  evChargerRequired?: boolean;
  registrationExpiry: Date;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const vehicleSchema = new Schema<IVehicleDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    licensePlate: {
      type: String,
      required: [true, "License plate is required"],
      uppercase: true,
      trim: true,
    },
    make: {
      type: String,
      required: [true, "Make is required"],
      trim: true,
    },
    model: {
      type: String,
      required: [true, "Model is required"],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
      min: 1900,
      max: new Date().getFullYear() + 1,
    },
    color: {
      type: String,
      required: [true, "Color is required"],
      trim: true,
    },
    vehicleType: {
      type: String,
      enum: ["sedan", "suv", "van", "motorcycle", "truck", "compact"],
      default: "sedan",
    },
    isElectric: {
      type: Boolean,
      default: false,
    },
    evChargerRequired: {
      type: Boolean,
      default: false,
    },
    registrationExpiry: {
      type: Date,
      required: [true, "Registration expiry date is required"],
    },
    isDefault: {
      type: Boolean,
      default: false,
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

// Indexes
vehicleSchema.index({ userId: 1 });
vehicleSchema.index({ licensePlate: 1 });
vehicleSchema.index({ userId: 1, isDefault: 1 });

export const Vehicle = mongoose.model<IVehicleDocument>(
  "Vehicle",
  vehicleSchema,
);
