import { Router } from "express";
import { body } from "express-validator";
import { authenticate } from "../middleware/auth.js";
import { Vehicle } from "../models/index.js";
import { AppError } from "../middleware/errorHandler.js";
import type { AuthRequest } from "../middleware/auth.js";

const router = Router();

// Get all vehicles for user
router.get("/", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user?.userId;
    const vehicles = await Vehicle.find({ userId, isActive: true });

    res.json({
      success: true,
      message: "Vehicles retrieved successfully",
      data: vehicles,
    });
  } catch (error) {
    next(error);
  }
});

// Get vehicle by ID
router.get("/:id", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user?.userId;
    const vehicle = await Vehicle.findOne({ _id: req.params.id, userId });

    if (!vehicle) {
      throw new AppError("Vehicle not found", 404, "VEHICLE_NOT_FOUND");
    }

    res.json({
      success: true,
      message: "Vehicle retrieved successfully",
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
});

// Create vehicle
router.post(
  "/",
  authenticate,
  [
    body("licensePlate").notEmpty().withMessage("License plate is required"),
    body("make").notEmpty().withMessage("Make is required"),
    body("model").notEmpty().withMessage("Model is required"),
    body("year")
      .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
      .withMessage("Valid year is required"),
    body("color").notEmpty().withMessage("Color is required"),
    body("vehicleType")
      .isIn(["sedan", "suv", "van", "motorcycle", "truck", "compact"])
      .withMessage("Valid vehicle type is required"),
    body("registrationExpiry")
      .isISO8601()
      .withMessage("Valid registration expiry date is required"),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const userId = req.user?.userId;
      const {
        licensePlate,
        make,
        model,
        year,
        color,
        vehicleType,
        isElectric,
        evChargerRequired,
        registrationExpiry,
        isDefault,
      } = req.body;

      // Check if license plate already exists for this user
      const existing = await Vehicle.findOne({
        userId,
        licensePlate: licensePlate.toUpperCase(),
      });
      if (existing) {
        throw new AppError(
          "Vehicle with this license plate already exists",
          400,
          "VEHICLE_EXISTS",
        );
      }

      // If setting as default, unset other defaults
      if (isDefault) {
        await Vehicle.updateMany({ userId }, { isDefault: false });
      }

      const vehicle = await Vehicle.create({
        userId,
        licensePlate: licensePlate.toUpperCase(),
        make,
        model,
        year,
        color,
        vehicleType,
        isElectric: isElectric || false,
        evChargerRequired: evChargerRequired || false,
        registrationExpiry: new Date(registrationExpiry),
        isDefault: isDefault || false,
      });

      res.status(201).json({
        success: true,
        message: "Vehicle created successfully",
        data: vehicle,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Update vehicle
router.put("/:id", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user?.userId;
    const {
      licensePlate,
      make,
      model,
      year,
      color,
      vehicleType,
      isElectric,
      evChargerRequired,
      registrationExpiry,
      isDefault,
      isActive,
    } = req.body;

    const vehicle = await Vehicle.findOne({ _id: req.params.id, userId });
    if (!vehicle) {
      throw new AppError("Vehicle not found", 404, "VEHICLE_NOT_FOUND");
    }

    // If setting as default, unset other defaults
    if (isDefault && !vehicle.isDefault) {
      await Vehicle.updateMany(
        { userId, _id: { $ne: vehicle._id } },
        { isDefault: false },
      );
    }

    // Update fields
    if (licensePlate) vehicle.licensePlate = licensePlate.toUpperCase();
    if (make) vehicle.make = make;
    if (model) vehicle.model = model;
    if (year) vehicle.year = year;
    if (color) vehicle.color = color;
    if (vehicleType) vehicle.vehicleType = vehicleType;
    if (typeof isElectric === "boolean") vehicle.isElectric = isElectric;
    if (typeof evChargerRequired === "boolean")
      vehicle.evChargerRequired = evChargerRequired;
    if (registrationExpiry)
      vehicle.registrationExpiry = new Date(registrationExpiry);
    if (typeof isDefault === "boolean") vehicle.isDefault = isDefault;
    if (typeof isActive === "boolean") vehicle.isActive = isActive;

    await vehicle.save();

    res.json({
      success: true,
      message: "Vehicle updated successfully",
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
});

// Delete (deactivate) vehicle
router.delete("/:id", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user?.userId;

    const vehicle = await Vehicle.findOne({ _id: req.params.id, userId });
    if (!vehicle) {
      throw new AppError("Vehicle not found", 404, "VEHICLE_NOT_FOUND");
    }

    vehicle.isActive = false;
    await vehicle.save();

    res.json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
