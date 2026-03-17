import mongoose, { Document, Schema } from "mongoose";

const dayHoursSchema = new Schema(
  {
    open: { type: String, default: "00:00" },
    close: { type: String, default: "23:59" },
    isClosed: { type: Boolean, default: false },
  },
  { _id: false },
);

const operatingHoursSchema = new Schema(
  {
    monday: { type: dayHoursSchema, default: () => ({}) },
    tuesday: { type: dayHoursSchema, default: () => ({}) },
    wednesday: { type: dayHoursSchema, default: () => ({}) },
    thursday: { type: dayHoursSchema, default: () => ({}) },
    friday: { type: dayHoursSchema, default: () => ({}) },
    saturday: { type: dayHoursSchema, default: () => ({}) },
    sunday: { type: dayHoursSchema, default: () => ({}) },
  },
  { _id: false },
);

export interface IParkingLotDocument extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  location: {
    type: string;
    coordinates: number[];
  };
  description?: string;
  images: string[];
  totalSpots: number;
  availableSpots: number;
  operatingHours: {
    monday: { open: string; close: string; isClosed: boolean };
    tuesday: { open: string; close: string; isClosed: boolean };
    wednesday: { open: string; close: string; isClosed: boolean };
    thursday: { open: string; close: string; isClosed: boolean };
    friday: { open: string; close: string; isClosed: boolean };
    saturday: { open: string; close: string; isClosed: boolean };
    sunday: { open: string; close: string; isClosed: boolean };
  };
  hourlyRate: number;
  dailyRate: number;
  monthlyRate: number;
  currency: string;
  amenities: string[];
  isActive: boolean;
  requireApproval: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const parkingLotSchema = new Schema<IParkingLotDocument>(
  {
    name: {
      type: String,
      required: [true, "Parking lot name is required"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    description: {
      type: String,
      trim: true,
    },
    images: [
      {
        type: String,
      },
    ],
    totalSpots: {
      type: Number,
      required: [true, "Total spots is required"],
      min: 0,
    },
    availableSpots: {
      type: Number,
      default: 0,
      min: 0,
    },
    operatingHours: {
      type: operatingHoursSchema,
      default: {
        monday: { open: "00:00", close: "23:59", isClosed: false },
        tuesday: { open: "00:00", close: "23:59", isClosed: false },
        wednesday: { open: "00:00", close: "23:59", isClosed: false },
        thursday: { open: "00:00", close: "23:59", isClosed: false },
        friday: { open: "00:00", close: "23:59", isClosed: false },
        saturday: { open: "00:00", close: "23:59", isClosed: false },
        sunday: { open: "00:00", close: "23:59", isClosed: false },
      },
    },
    hourlyRate: {
      type: Number,
      required: [true, "Hourly rate is required"],
      min: 0,
    },
    dailyRate: {
      type: Number,
      required: [true, "Daily rate is required"],
      min: 0,
    },
    monthlyRate: {
      type: Number,
      required: [true, "Monthly rate is required"],
      min: 0,
    },
    currency: {
      type: String,
      default: "MYR",
    },
    amenities: [
      {
        type: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    requireApproval: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
// parkingLotSchema.index({ location: "2dsphere" });
parkingLotSchema.index({ name: "text", address: "text" });

// Pre-validate hook to sync coordinates to location
// parkingLotSchema.pre("validate", function (next) {
//   if (this.isModified("coordinates") && this.coordinates) {
//     this.location = {
//       type: "Point",
//       coordinates: [this.coordinates.lng, this.coordinates.lat],
//     };
//   }
//   next();
// });

export const ParkingLot = mongoose.model<IParkingLotDocument>(
  "ParkingLot",
  parkingLotSchema,
);
