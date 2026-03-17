import mongoose, { Document, Schema } from "mongoose";

export interface IParkingSpotDocument extends Document {
  lotId: mongoose.Types.ObjectId;
  zoneId?: mongoose.Types.ObjectId;
  spotNumber: string;
  floor?: number;
  row?: string;
  column?: number;
  spotType: "standard" | "compact" | "ev" | "handicap" | "vip" | "visitor";
  status: "available" | "occupied" | "reserved" | "maintenance" | "blocked";
  width?: number;
  length?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const parkingSpotSchema = new Schema<IParkingSpotDocument>(
  {
    lotId: {
      type: Schema.Types.ObjectId,
      ref: "ParkingLot",
      required: true,
    },
    zoneId: {
      type: Schema.Types.ObjectId,
      ref: "ParkingZone",
    },
    spotNumber: {
      type: String,
      required: true,
    },
    floor: {
      type: Number,
      default: 1,
    },
    row: {
      type: String,
    },
    column: {
      type: Number,
    },
    spotType: {
      type: String,
      enum: ["standard", "compact", "ev", "handicap", "vip", "visitor"],
      default: "standard",
    },
    status: {
      type: String,
      enum: ["available", "occupied", "reserved", "maintenance", "blocked"],
      default: "available",
    },
    width: {
      type: Number,
      default: 2.5,
    },
    length: {
      type: Number,
      default: 5,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
parkingSpotSchema.index({ lotId: 1, spotNumber: 1 }, { unique: true });
parkingSpotSchema.index({ lotId: 1, status: 1 });
parkingSpotSchema.index({ lotId: 1, floor: 1 });

export const ParkingSpot = mongoose.model<IParkingSpotDocument>(
  "ParkingSpot",
  parkingSpotSchema
);
