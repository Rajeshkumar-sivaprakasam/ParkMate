import { Router } from "express";
import { body, query } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.js";
import { ParkingSpot, Booking, ParkingLot } from "../models/index.js";
import { AppError } from "../middleware/errorHandler.js";
import type { AuthRequest } from "../middleware/auth.js";

const router = Router();

// Get spots for a parking lot
router.get(
  "/lot/:lotId",
  authenticate,
  async (req: AuthRequest, res, next) => {
    try {
      const { lotId } = req.params;
      const { date, startTime, endTime } = req.query;

      // Get all spots for the lot
      const spots = await ParkingSpot.find({
        lotId,
        isActive: true,
      }).sort({ floor: 1, spotNumber: 1 });

      // If no spots exist, return empty
      if (spots.length === 0) {
        return res.json({
          success: true,
          data: {
            spots: [],
            available: 0,
            occupied: 0,
            total: 0,
          },
        });
      }

      // If date/time provided, check bookings
      let bookedSpotIds: string[] = [];
      if (date && startTime && endTime) {
        const bookings = await Booking.find({
          lotId,
          date: new Date(date as string),
          status: { $in: ["confirmed", "pending", "checked_in"] },
          $or: [
            // Overlapping time slots
            {
              startTime: { $lt: endTime },
              endTime: { $gt: startTime },
            },
          ],
        });
        bookedSpotIds = bookings
          .filter((b) => b.spotId)
          .map((b) => b.spotId?.toString());
      }

      // Categorize spots
      const availableSpots = spots.filter(
        (s) => !bookedSpotIds.includes(s._id.toString()) && s.status === "available"
      );
      const occupiedSpots = spots.filter(
        (s) => bookedSpotIds.includes(s._id.toString()) || s.status === "occupied"
      );

      // Return with status
      const spotsWithStatus = spots.map((spot) => ({
        ...spot.toObject(),
        isAvailable:
          !bookedSpotIds.includes(spot._id.toString()) &&
          spot.status === "available",
        isBooked: bookedSpotIds.includes(spot._id.toString()),
      }));

      res.json({
        success: true,
        data: {
          spots: spotsWithStatus,
          available: availableSpots.length,
          occupied: occupiedSpots.length,
          total: spots.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get slot by ID
router.get(
  "/:id",
  authenticate,
  async (req: AuthRequest, res, next) => {
    try {
      const spot = await ParkingSpot.findById(req.params.id).populate("lotId");

      if (!spot) {
        throw new AppError("Parking spot not found", 404, "SPOT_NOT_FOUND");
      }

      res.json({
        success: true,
        data: spot,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Create spots for a lot (admin only)
router.post(
  "/",
  authenticate,
  authorize("admin"),
  [
    body("lotId").notEmpty().withMessage("Lot ID is required"),
    body("spots").isArray().withMessage("Spots array is required"),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const { lotId, spots } = req.body;

      // Verify lot exists
      const lot = await ParkingLot.findById(lotId);
      if (!lot) {
        throw new AppError("Parking lot not found", 404, "LOT_NOT_FOUND");
      }

      // Create spots
      const createdSpots = await ParkingSpot.insertMany(
        spots.map((spot: any) => ({
          lotId,
          spotNumber: spot.spotNumber,
          floor: spot.floor || 1,
          row: spot.row,
          column: spot.column,
          spotType: spot.spotType || "standard",
          status: "available",
        }))
      );

      res.status(201).json({
        success: true,
        message: "Parking spots created successfully",
        data: createdSpots,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Generate spots for a lot (admin - auto create)
router.post(
  "/generate",
  authenticate,
  authorize("admin"),
  [
    body("lotId").notEmpty().withMessage("Lot ID is required"),
    body("rows").isNumeric().withMessage("Number of rows is required"),
    body("spotsPerRow").isNumeric().withMessage("Spots per row is required"),
    body("floors").isNumeric().withMessage("Number of floors is required"),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const { lotId, rows, spotsPerRow, floors = 1 } = req.body;

      const spots = [];
      const rowLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

      for (let floor = 1; floor <= floors; floor++) {
        for (let row = 0; row < rows; row++) {
          for (let col = 1; col <= spotsPerRow; col++) {
            spots.push({
              lotId,
              spotNumber: `${floor}-${rowLetters[row]}${col}`,
              floor,
              row: rowLetters[row],
              column: col,
              spotType: "standard",
              status: "available",
            });
          }
        }
      }

      // Delete existing spots for this lot
      await ParkingSpot.deleteMany({ lotId });

      // Create new spots
      const createdSpots = await ParkingSpot.insertMany(spots);

      // Update lot total spots
      await ParkingLot.findByIdAndUpdate(lotId, {
        totalSpots: createdSpots.length,
      });

      res.status(201).json({
        success: true,
        message: `Generated ${createdSpots.length} parking spots`,
        data: createdSpots,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
