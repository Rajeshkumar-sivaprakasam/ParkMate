import mongoose, { Document, Schema } from "mongoose";

export interface IParkingZoneDocument extends Document {
  _id: mongoose.Types.ObjectId;
  lotId: mongoose.Types.ObjectId;
  name: string;
  type:
    | "standard"
    | "ev"
    | "disabled"
    | "visitor"
    | "compact"
    | "carpool"
    | "motorcycle"
    | "reserved";
  totalSpots: number;
  availableSpots: number;
  hourlyRate: number;
  description?: string;
  amenities: string[];
  restrictions: {
    type: "vehicle_type" | "height" | "weight" | "time" | "user_group";
    value: string;
    message: string;
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const parkingZoneSchema = new Schema<IParkingZoneDocument>(
  {
    lotId: {
      type: Schema.Types.ObjectId,
      ref: "ParkingLot",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Zone name is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "standard",
        "ev",
        "disabled",
        "visitor",
        "compact",
        "carpool",
        "motorcycle",
        "reserved",
      ],
      default: "standard",
    },
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
    hourlyRate: {
      type: Number,
      required: [true, "Hourly rate is required"],
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    amenities: [
      {
        type: String,
      },
    ],
    restrictions: [
      {
        type: {
          type: String,
          enum: ["vehicle_type", "height", "weight", "time", "user_group"],
        },
        value: {
          type: String,
        },
        message: {
          type: String,
        },
      },
    ],
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
parkingZoneSchema.index({ lotId: 1 });
parkingZoneSchema.index({ lotId: 1, type: 1 });

export const ParkingZone = mongoose.model<IParkingZoneDocument>(
  "ParkingZone",
  parkingZoneSchema,
);
