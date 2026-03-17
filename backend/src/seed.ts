import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { config } from "./config/index.js";
import {
  User,
  Vehicle,
  ParkingLot,
  ParkingZone,
  Booking,
  RefundPolicy,
  Organization,
  AuditLog,
} from "./models/index.js";

const seedData = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(config.mongodb.uri);
    console.log("Connected to MongoDB\n");

    // Clear existing data
    console.log("Clearing existing data...");
    await Promise.all([
      AuditLog.deleteMany({}),
      Booking.deleteMany({}),
      Vehicle.deleteMany({}),
      ParkingZone.deleteMany({}),
      ParkingLot.deleteMany({}),
      RefundPolicy.deleteMany({}),
      Organization.deleteMany({}),
      User.deleteMany({}),
    ]);

    // Explicitly drop parkinglots to clear stale indexes
    try {
      await mongoose.connection.db.dropCollection("parkinglots");
    } catch (e) {
      // Ignore if collection doesn't exist
    }

    console.log("Existing data cleared\n");

    // Create Admin User
    console.log("Creating Users...");
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const userPassword = await bcrypt.hash("user123", 10);

    const adminUser = await User.create({
      email: "admin@kilocar.com",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      phone: "+60 12 345 6789",
      role: "admin",
      company: "ParkMate Parking Sdn Bhd",
      department: "Operations",
      employeeId: "EMP001",
      isEmailVerified: true,
      isActive: true,
      twoFactorEnabled: false,
      preferences: {
        notifications: { email: true, sms: false, push: true },
        favoriteLots: [],
        theme: "light",
        language: "en",
      },
    });

    const regularUser = await User.create({
      email: "user@example.com",
      password: userPassword,
      firstName: "John",
      lastName: "Doe",
      phone: "+60 12 987 6543",
      role: "user",
      company: "Tech Company Sdn Bhd",
      department: "IT",
      employeeId: "EMP002",
      isEmailVerified: true,
      isActive: true,
      twoFactorEnabled: false,
      preferences: {
        notifications: { email: true, sms: false, push: true },
        favoriteLots: [],
        theme: "light",
        language: "en",
      },
    });

    const visitorUser = await User.create({
      email: "visitor@example.com",
      password: userPassword,
      firstName: "Jane",
      lastName: "Smith",
      phone: "+60 11 222 3333",
      role: "user",
      isEmailVerified: true,
      isActive: true,
      preferences: {
        notifications: { email: true, sms: false, push: false },
        favoriteLots: [],
        theme: "light",
        language: "en",
      },
    });

    console.log(
      `Created 3 users: admin@kilocar.com, user@example.com, visitor@example.com\n`,
    );

    // Create Organizations
    console.log("Creating Organizations...");
    const organizations = await Organization.create([
      {
        name: "ParkMate Parking Sdn Bhd",
        code: "KILOCAR",
        description: "Main parking management company",
        contactEmail: "admin@kilocar.com",
        contactPhone: "+60 3 1234 5678",
        address: {
          street: "123 Parking Street",
          city: "Kuala Lumpur",
          state: "Wilayah Persekutuan",
          postalCode: "50000",
          country: "Malaysia",
        },
        settings: {
          allowPublicBooking: true,
          requireApproval: false,
          maxAdvanceBookingDays: 30,
          allowVisitorBooking: true,
        },
        subscription: {
          plan: "enterprise",
          status: "active",
          maxUsers: 100,
          maxParkingLots: 20,
        },
        isActive: true,
        createdBy: adminUser._id,
      },
      {
        name: "Tech Mall Parking",
        code: "TECHMALL",
        description: "Shopping mall parking",
        contactEmail: "parking@techmall.com",
        contactPhone: "+60 3 9876 5432",
        address: {
          street: "456 Shopping Avenue",
          city: "Kuala Lumpur",
          state: "Wilayah Persekutuan",
          postalCode: "50100",
          country: "Malaysia",
        },
        settings: {
          allowPublicBooking: true,
          requireApproval: true,
          maxAdvanceBookingDays: 7,
          allowVisitorBooking: true,
        },
        subscription: {
          plan: "premium",
          status: "active",
          maxUsers: 50,
          maxParkingLots: 5,
        },
        isActive: true,
        createdBy: adminUser._id,
      },
    ]);
    console.log(`Created ${organizations.length} organizations\n`);

    // Create Parking Lots
    console.log("Creating Parking Lots...");
    const parkingLots = await ParkingLot.create([
      {
        name: "Kuala Lumpur Central Parking",
        address: "Jalan Sultan Ismail, Kuala Lumpur",
        location: { type: "Point", coordinates: [101.7032, 3.1427] },
        description: "Premium parking in the heart of KL",
        images: [
          "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800",
        ],
        totalSpots: 500,
        availableSpots: 127,
        hourlyRate: 5.0,
        dailyRate: 40.0,
        monthlyRate: 800.0,
        currency: "MYR",
        amenities: [
          "CCTV",
          "Security",
          "EV Charging",
          "Accessible",
          "Car Wash",
        ],
        operatingHours: {
          monday: { open: "00:00", close: "23:59", isClosed: false },
          tuesday: { open: "00:00", close: "23:59", isClosed: false },
          wednesday: { open: "00:00", close: "23:59", isClosed: false },
          thursday: { open: "00:00", close: "23:59", isClosed: false },
          friday: { open: "00:00", close: "23:59", isClosed: false },
          saturday: { open: "00:00", close: "23:59", isClosed: false },
          sunday: { open: "00:00", close: "23:59", isClosed: false },
        },
        requireApproval: false,
        isActive: true,
      },
      {
        name: "Bukit Bintang Mall Parking",
        address: "Jalan Bukit Bintang, Kuala Lumpur",
        coordinates: { lat: 3.1466, lng: 101.7113 },
        location: { type: "Point", coordinates: [101.7113, 3.1466] },
        description: "Convenient parking at Bukit Bintang",
        images: [
          "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=800",
        ],
        totalSpots: 800,
        availableSpots: 45,
        hourlyRate: 4.0,
        dailyRate: 35.0,
        monthlyRate: 600.0,
        currency: "MYR",
        amenities: ["CCTV", "Security", "Car Wash", "Valet"],
        operatingHours: {
          monday: { open: "06:00", close: "00:00", isClosed: false },
          tuesday: { open: "06:00", close: "00:00", isClosed: false },
          wednesday: { open: "06:00", close: "00:00", isClosed: false },
          thursday: { open: "06:00", close: "00:00", isClosed: false },
          friday: { open: "06:00", close: "02:00", isClosed: false },
          saturday: { open: "06:00", close: "02:00", isClosed: false },
          sunday: { open: "06:00", close: "00:00", isClosed: false },
        },
        requireApproval: true,
        isActive: true,
      },
      {
        name: "Cyberjaya Tech Park",
        address: "63000 Cyberjaya, Selangor",
        coordinates: { lat: 2.9213, lng: 101.6559 },
        location: { type: "Point", coordinates: [101.6559, 2.9213] },
        description: "Tech hub parking with EV charging",
        images: [
          "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800",
        ],
        totalSpots: 300,
        availableSpots: 180,
        hourlyRate: 3.0,
        dailyRate: 25.0,
        monthlyRate: 450.0,
        currency: "MYR",
        amenities: [
          "CCTV",
          "Security",
          "EV Charging",
          "Shade",
          "EV Fast Charge",
        ],
        operatingHours: {
          monday: { open: "00:00", close: "23:59", isClosed: false },
          tuesday: { open: "00:00", close: "23:59", isClosed: false },
          wednesday: { open: "00:00", close: "23:59", isClosed: false },
          thursday: { open: "00:00", close: "23:59", isClosed: false },
          friday: { open: "00:00", close: "23:59", isClosed: false },
          saturday: { open: "08:00", close: "18:00", isClosed: false },
          sunday: { open: "08:00", close: "18:00", isClosed: false },
        },
        requireApproval: false,
        isActive: true,
      },
      {
        name: "Mid Valley Megamall",
        address: "Jalan Mid Valley, Kuala Lumpur",
        coordinates: { lat: 3.1185, lng: 101.6766 },
        location: { type: "Point", coordinates: [101.6766, 3.1185] },
        description: "Shopping mall parking",
        images: [
          "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=800",
        ],
        totalSpots: 1200,
        availableSpots: 200,
        hourlyRate: 4.5,
        dailyRate: 35.0,
        monthlyRate: 700.0,
        currency: "MYR",
        amenities: ["CCTV", "Security", "EV Charging", "Accessible"],
        operatingHours: {
          monday: { open: "07:00", close: "00:00", isClosed: false },
          tuesday: { open: "07:00", close: "00:00", isClosed: false },
          wednesday: { open: "07:00", close: "00:00", isClosed: false },
          thursday: { open: "07:00", close: "00:00", isClosed: false },
          friday: { open: "07:00", close: "02:00", isClosed: false },
          saturday: { open: "07:00", close: "02:00", isClosed: false },
          sunday: { open: "07:00", close: "00:00", isClosed: false },
        },
        requireApproval: true,
        isActive: true,
      },
      {
        name: "Petronas Tower Parking",
        address: "Petronas Twin Towers, Kuala Lumpur",
        coordinates: { lat: 3.1589, lng: 101.7115 },
        location: { type: "Point", coordinates: [101.7115, 3.1589] },
        description: "Premium parking near iconic towers",
        images: [
          "https://images.unsplash.com/photo-1569003077984-249014c54a4e?w=800",
        ],
        totalSpots: 150,
        availableSpots: 25,
        hourlyRate: 8.0,
        dailyRate: 60.0,
        monthlyRate: 1200.0,
        currency: "MYR",
        amenities: ["CCTV", "Security", "EV Charging", "Valet", "Car Wash"],
        operatingHours: {
          monday: { open: "06:00", close: "23:00", isClosed: false },
          tuesday: { open: "06:00", close: "23:00", isClosed: false },
          wednesday: { open: "06:00", close: "23:00", isClosed: false },
          thursday: { open: "06:00", close: "23:00", isClosed: false },
          friday: { open: "06:00", close: "23:00", isClosed: false },
          saturday: { open: "06:00", close: "23:00", isClosed: false },
          sunday: { open: "06:00", close: "23:00", isClosed: false },
        },
        requireApproval: false,
        isActive: true,
      },
    ]);
    console.log(`Created ${parkingLots.length} parking lots\n`);

    // Create Parking Zones for some lots
    console.log("Creating Parking Zones...");
    const zones = await ParkingZone.create([
      {
        lotId: parkingLots[0]._id,
        name: "Standard Zone A",
        type: "standard",
        totalSpots: 200,
        availableSpots: 80,
        hourlyRate: 5.0,
        description: "Standard parking zone",
        amenities: ["CCTV", "Security"],
        isActive: true,
      },
      {
        lotId: parkingLots[0]._id,
        name: "EV Charging Zone",
        type: "ev",
        totalSpots: 50,
        availableSpots: 20,
        hourlyRate: 7.0,
        description: "Electric vehicle charging spots",
        amenities: ["EV Charging", "CCTV", "Security"],
        isActive: true,
      },
      {
        lotId: parkingLots[2]._id,
        name: "Tech Zone",
        type: "standard",
        totalSpots: 150,
        availableSpots: 100,
        hourlyRate: 3.0,
        description: "Standard parking for tech park",
        amenities: ["CCTV", "Security", "Shade"],
        isActive: true,
      },
      {
        lotId: parkingLots[2]._id,
        name: "EV Fast Charge",
        type: "ev",
        totalSpots: 30,
        availableSpots: 15,
        hourlyRate: 5.0,
        description: "Fast charging for EVs",
        amenities: ["EV Fast Charge", "CCTV", "Security"],
        isActive: true,
      },
    ]);
    console.log(`Created ${zones.length} parking zones\n`);

    // Create Vehicles
    console.log("Creating Vehicles...");
    const vehicles = await Vehicle.create([
      {
        userId: regularUser._id,
        licensePlate: "ABC 1234",
        make: "Toyota",
        model: "Camry",
        year: 2023,
        color: "Silver",
        vehicleType: "sedan",
        isElectric: false,
        registrationExpiry: new Date("2025-12-31"),
        isDefault: true,
        isActive: true,
      },
      {
        userId: regularUser._id,
        licensePlate: "XYZ 5678",
        make: "Tesla",
        model: "Model 3",
        year: 2024,
        color: "White",
        vehicleType: "sedan",
        isElectric: true,
        evChargerRequired: true,
        registrationExpiry: new Date("2025-06-30"),
        isDefault: false,
        isActive: true,
      },
      {
        userId: visitorUser._id,
        licensePlate: "DEF 9012",
        make: "Honda",
        model: "Civic",
        year: 2022,
        color: "Blue",
        vehicleType: "sedan",
        isElectric: false,
        registrationExpiry: new Date("2025-03-31"),
        isDefault: true,
        isActive: true,
      },
    ]);
    console.log(`Created ${vehicles.length} vehicles\n`);

    // Create Refund Policies
    console.log("Creating Refund Policies...");
    const refundPolicies = await RefundPolicy.create([
      {
        name: "Standard Refund Policy",
        description: "Default refund policy for all bookings",
        isDefault: true,
        tiers: [
          {
            name: "Full Refund",
            hoursBeforeBooking: 24,
            refundPercentage: 100,
            isNonRefundable: false,
          },
          {
            name: "50% Refund",
            hoursBeforeBooking: 12,
            refundPercentage: 50,
            isNonRefundable: false,
          },
          {
            name: "No Refund",
            hoursBeforeBooking: 0,
            refundPercentage: 0,
            isNonRefundable: true,
          },
        ],
        applicableUserRoles: ["user", "admin"],
        minAdvanceHours: 0,
        maxAdvanceDays: 30,
        isActive: true,
        createdBy: adminUser._id,
      },
      {
        name: "Premium Refund Policy",
        description: "More generous refund policy for premium users",
        isDefault: false,
        tiers: [
          {
            name: "Full Refund",
            hoursBeforeBooking: 48,
            refundPercentage: 100,
            isNonRefundable: false,
          },
          {
            name: "75% Refund",
            hoursBeforeBooking: 24,
            refundPercentage: 75,
            isNonRefundable: false,
          },
          {
            name: "50% Refund",
            hoursBeforeBooking: 12,
            refundPercentage: 50,
            isNonRefundable: false,
          },
          {
            name: "No Refund",
            hoursBeforeBooking: 0,
            refundPercentage: 0,
            isNonRefundable: true,
          },
        ],
        applicableUserRoles: ["admin"],
        minAdvanceHours: 0,
        maxAdvanceDays: 60,
        isActive: true,
        createdBy: adminUser._id,
      },
    ]);
    console.log(`Created ${refundPolicies.length} refund policies\n`);

    // Create Bookings
    console.log("Creating Bookings...");
    const today = new Date();
    const bookings = await Booking.create([
      // Confirmed bookings
      {
        userId: regularUser._id,
        vehicleId: vehicles[0]._id,
        lotId: parkingLots[0]._id,
        bookingType: "hourly",
        status: "confirmed",
        approvalStatus: "auto_approved",
        date: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        startTime: "09:00",
        endTime: "17:00",
        duration: 8,
        totalAmount: 40.0,
        currency: "MYR",
        paymentStatus: "completed",
        paymentMethod: "card",
        isRecurring: false,
        nonRefundable: false,
      },
      {
        userId: regularUser._id,
        vehicleId: vehicles[1]._id,
        lotId: parkingLots[2]._id,
        bookingType: "hourly",
        status: "confirmed",
        approvalStatus: "auto_approved",
        date: new Date(today.getTime() + 48 * 60 * 60 * 1000),
        startTime: "10:00",
        endTime: "18:00",
        duration: 8,
        totalAmount: 24.0,
        currency: "MYR",
        paymentStatus: "completed",
        paymentMethod: "wallet",
        isRecurring: true,
        recurringPattern: {
          frequency: "weekly",
          daysOfWeek: [1, 2, 3, 4, 5],
          endDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
          skipDates: [],
        },
        nonRefundable: false,
      },
      // Pending approval booking
      {
        userId: visitorUser._id,
        vehicleId: vehicles[2]._id,
        lotId: parkingLots[1]._id,
        bookingType: "hourly",
        status: "pending",
        approvalStatus: "pending_approval",
        date: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        startTime: "14:00",
        endTime: "20:00",
        duration: 6,
        totalAmount: 24.0,
        currency: "MYR",
        paymentStatus: "completed",
        paymentMethod: "card",
        isRecurring: false,
        nonRefundable: false,
      },
      {
        userId: visitorUser._id,
        vehicleId: vehicles[2]._id,
        lotId: parkingLots[3]._id,
        bookingType: "hourly",
        status: "pending",
        approvalStatus: "pending_approval",
        date: new Date(today.getTime() + 12 * 60 * 60 * 1000),
        startTime: "11:00",
        endTime: "18:00",
        duration: 7,
        totalAmount: 31.5,
        currency: "MYR",
        paymentStatus: "completed",
        paymentMethod: "card",
        isRecurring: false,
        nonRefundable: false,
      },
      // Checked in booking
      {
        userId: regularUser._id,
        vehicleId: vehicles[0]._id,
        lotId: parkingLots[4]._id,
        bookingType: "hourly",
        status: "checked_in",
        approvalStatus: "auto_approved",
        date: today,
        startTime: "08:00",
        endTime: "12:00",
        duration: 4,
        totalAmount: 32.0,
        currency: "MYR",
        paymentStatus: "completed",
        paymentMethod: "card",
        checkedInAt: new Date(today.getTime() - 30 * 60 * 1000),
        actualCheckInTime: "08:00",
        isRecurring: false,
        nonRefundable: false,
      },
      // Completed booking
      {
        userId: regularUser._id,
        vehicleId: vehicles[0]._id,
        lotId: parkingLots[0]._id,
        bookingType: "hourly",
        status: "checked_out",
        approvalStatus: "auto_approved",
        date: new Date(today.getTime() - 24 * 60 * 60 * 1000),
        startTime: "10:00",
        endTime: "14:00",
        duration: 4,
        totalAmount: 20.0,
        currency: "MYR",
        paymentStatus: "completed",
        paymentMethod: "card",
        checkedInAt: new Date(today.getTime() - 24 * 60 * 60 * 1000),
        checkedOutAt: new Date(
          today.getTime() - 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000,
        ),
        actualCheckInTime: "10:00",
        actualCheckOutTime: "14:00",
        isRecurring: false,
        nonRefundable: false,
      },
      // Cancelled booking with refund
      {
        userId: regularUser._id,
        vehicleId: vehicles[1]._id,
        lotId: parkingLots[2]._id,
        bookingType: "hourly",
        status: "cancelled",
        approvalStatus: "auto_approved",
        date: new Date(today.getTime() + 72 * 60 * 60 * 1000),
        startTime: "09:00",
        endTime: "17:00",
        duration: 8,
        totalAmount: 24.0,
        currency: "MYR",
        paymentStatus: "refunded",
        paymentMethod: "card",
        cancelledAt: new Date(today.getTime() - 2 * 60 * 60 * 1000),
        cancellationReason: "User requested cancellation",
        refundStatus: "completed",
        refundAmount: 24.0,
        refundProcessedAt: new Date(today.getTime() - 1 * 60 * 60 * 1000),
        isRecurring: false,
        nonRefundable: false,
      },
    ]);
    console.log(`Created ${bookings.length} bookings\n`);

    // Create some audit logs
    console.log("Creating Audit Logs...");
    const auditLogs = await AuditLog.create([
      {
        userId: regularUser._id,
        action: "book",
        entityType: "Booking",
        entityId: bookings[0]._id,
        newValues: { status: "confirmed" },
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0",
      },
      {
        userId: regularUser._id,
        action: "cancel",
        entityType: "Booking",
        entityId: bookings[6]._id,
        newValues: { status: "cancelled", refundAmount: 24.0 },
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0",
      },
      {
        userId: adminUser._id,
        action: "admin_action",
        entityType: "RefundPolicy",
        entityId: refundPolicies[0]._id,
        metadata: { action: "create" },
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
      },
    ]);
    console.log(`Created ${auditLogs.length} audit logs\n`);

    console.log("✅ Seed data created successfully!\n");
    console.log("======================================");
    console.log("Demo Accounts:");
    console.log("--------------------------------------");
    console.log("Admin: admin@kilocar.com / admin123");
    console.log("User:  user@example.com / user123");
    console.log("--------------------------------------");
    console.log("\nDemo Features:");
    console.log("- 5 Parking Lots (2 require approval)");
    console.log("- 3 Vehicles");
    console.log("- 7 Bookings (2 pending approval)");
    console.log("- 2 Refund Policies");
    console.log("======================================");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
};

seedData();
