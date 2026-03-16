import { Router } from "express";
import { body, query } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.js";
import { ParkingLot, ParkingZone } from "../models/index.js";

const router = Router();

// Get all parking lots
router.get("/lots", async (req, res, next) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;

    let lots;
    if (lat && lng) {
      // Geo-spatial query
      lots = await ParkingLot.find({
        coordinates: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [
                parseFloat(lng as string),
                parseFloat(lat as string),
              ],
            },
            $maxDistance: parseInt(radius as string, 10),
          },
        },
        isActive: true,
      });
    } else {
      lots = await ParkingLot.find({ isActive: true });
    }

    res.json({
      success: true,
      message: "Parking lots retrieved successfully",
      data: lots,
    });
  } catch (error) {
    next(error);
  }
});

// Get parking lot by ID
router.get("/lots/:id", async (req, res, next) => {
  try {
    const lot = await ParkingLot.findById(req.params.id);
    if (!lot) {
      res.status(404).json({
        success: false,
        message: "Parking lot not found",
      });
      return;
    }

    // Get zones for this lot
    const zones = await ParkingZone.find({ lotId: lot._id, isActive: true });

    res.json({
      success: true,
      message: "Parking lot retrieved successfully",
      data: { ...lot.toObject(), zones },
    });
  } catch (error) {
    next(error);
  }
});

// Get zones for a lot
router.get("/lots/:lotId/zones", async (req, res, next) => {
  try {
    const zones = await ParkingZone.find({
      lotId: req.params.lotId,
      isActive: true,
    });

    res.json({
      success: true,
      message: "Zones retrieved successfully",
      data: zones,
    });
  } catch (error) {
    next(error);
  }
});

// Check availability for a lot on a specific date
router.get(
  "/lots/:id/availability",
  [query("date").isISO8601().withMessage("Valid date is required")],
  async (req, res, next) => {
    try {
      const lot = await ParkingLot.findById(req.params.id);
      if (!lot) {
        res.status(404).json({
          success: false,
          message: "Parking lot not found",
        });
        return;
      }

      const zones = await ParkingZone.find({ lotId: lot._id, isActive: true });

      // In a real implementation, we'd check existing bookings for that date
      // and calculate actual availability
      const availability = zones.map((zone) => ({
        zoneId: zone._id,
        zoneName: zone.name,
        zoneType: zone.type,
        totalSpots: zone.totalSpots,
        availableSpots: zone.availableSpots,
        hourlyRate: zone.hourlyRate,
      }));

      res.json({
        success: true,
        message: "Availability retrieved successfully",
        data: {
          lotId: lot._id,
          lotName: lot.name,
          date: req.query.date,
          availability,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

// Admin: Create parking lot (admin only)
router.post(
  "/lots",
  authenticate,
  authorize("admin", "superadmin"),
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("address").notEmpty().withMessage("Address is required"),
    body("coordinates.lat").isNumeric().withMessage("Latitude is required"),
    body("coordinates.lng").isNumeric().withMessage("Longitude is required"),
    body("totalSpots")
      .isInt({ min: 1 })
      .withMessage("Total spots must be at least 1"),
    body("hourlyRate")
      .isFloat({ min: 0 })
      .withMessage("Hourly rate must be positive"),
  ],
  async (req, res, next) => {
    try {
      const lot = await ParkingLot.create(req.body);
      res.status(201).json({
        success: true,
        message: "Parking lot created successfully",
        data: lot,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Admin: Create parking zone (admin only)
router.post(
  "/zones",
  authenticate,
  authorize("admin", "superadmin"),
  [
    body("lotId").notEmpty().withMessage("Lot ID is required"),
    body("name").notEmpty().withMessage("Name is required"),
    body("type")
      .isIn([
        "standard",
        "ev",
        "disabled",
        "visitor",
        "compact",
        "carpool",
        "motorcycle",
        "reserved",
      ])
      .withMessage("Valid zone type is required"),
    body("totalSpots")
      .isInt({ min: 1 })
      .withMessage("Total spots must be at least 1"),
    body("hourlyRate")
      .isFloat({ min: 0 })
      .withMessage("Hourly rate must be positive"),
  ],
  async (req, res, next) => {
    try {
      const zone = await ParkingZone.create(req.body);

      // Update lot available spots
      await ParkingLot.findByIdAndUpdate(req.body.lotId, {
        $inc: { availableSpots: req.body.totalSpots },
      });

      res.status(201).json({
        success: true,
        message: "Parking zone created successfully",
        data: zone,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
