import { Booking, ParkingLot, User } from "../models/index.js";
import mongoose from "mongoose";

export interface DashboardStats {
  totalLots: number;
  totalSpots: number;
  availableSpots: number;
  todayBookings: number;
  todayRevenue: number;
  activeUsers: number;
  occupancyRate: number;
  pendingRefunds: number;
  monthlyRevenue: number;
  monthlyBookings: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  bookings: number;
}

export interface OccupancyData {
  hour: number;
  occupancyRate: number;
  bookings: number;
}

export interface TopParkingLot {
  lotId: string;
  lotName: string;
  totalBookings: number;
  totalRevenue: number;
  occupancyRate: number;
}

export interface BookingTrends {
  date: string;
  bookings: number;
  cancellations: number;
  revenue: number;
}

class AnalyticsService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Get parking lots stats
    const lots = await ParkingLot.find({ isActive: true });
    const totalSpots = lots.reduce((sum, lot) => sum + lot.totalSpots, 0);
    const availableSpots = lots.reduce(
      (sum, lot) => sum + (lot.availableSpots || 0),
      0,
    );

    // Today's bookings
    const todayBookings = await Booking.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ["confirmed", "checked_in", "checked_out"] },
    });

    // Today's revenue
    const todayRevenueAgg = await Booking.aggregate([
      {
        $match: {
          date: { $gte: today, $lt: tomorrow },
          status: { $nin: ["cancelled", "expired"] },
          paymentStatus: "completed",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
        },
      },
    ]);
    const todayRevenue = todayRevenueAgg[0]?.total || 0;

    // Monthly revenue
    const monthlyRevenueAgg = await Booking.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth, $lte: endOfMonth },
          status: { $nin: ["cancelled", "expired"] },
          paymentStatus: "completed",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
          count: { $sum: 1 },
        },
      },
    ]);
    const monthlyRevenue = monthlyRevenueAgg[0]?.total || 0;
    const monthlyBookings = monthlyRevenueAgg[0]?.count || 0;

    // Active users (users with bookings in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = await User.countDocuments({
      isActive: true,
      role: "user",
    });

    // Pending refunds
    const pendingRefunds = await Booking.countDocuments({
      refundStatus: { $in: ["pending", "processing"] },
    });

    // Calculate occupancy rate
    const occupancyRate =
      totalSpots > 0 ? ((totalSpots - availableSpots) / totalSpots) * 100 : 0;

    return {
      totalLots: lots.length,
      totalSpots,
      availableSpots,
      todayBookings,
      todayRevenue,
      activeUsers,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      pendingRefunds,
      monthlyRevenue,
      monthlyBookings,
    };
  }

  /**
   * Get revenue data for a date range
   */
  async getRevenueData(startDate: Date, endDate: Date): Promise<RevenueData[]> {
    const data = await Booking.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
          status: { $nin: ["cancelled", "expired"] },
          paymentStatus: "completed",
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$date" },
          },
          revenue: { $sum: "$totalAmount" },
          bookings: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return data.map((item) => ({
      date: item._id,
      revenue: item.revenue,
      bookings: item.bookings,
    }));
  }

  /**
   * Get hourly occupancy data
   */
  async getHourlyOccupancy(date: Date): Promise<OccupancyData[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const lots = await ParkingLot.find({ isActive: true });
    const totalSpots = lots.reduce((sum, lot) => sum + lot.totalSpots, 0);

    const hourlyData = await Booking.aggregate([
      {
        $match: {
          date: { $gte: startOfDay, $lte: endOfDay },
          status: { $in: ["confirmed", "checked_in", "checked_out"] },
        },
      },
      {
        $group: {
          _id: { $toInt: { $substr: ["$startTime", 0, 2] } },
          bookings: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const result: OccupancyData[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourData = hourlyData.find((h) => h._id === hour);
      const bookings = hourData?.bookings || 0;
      const occupancyRate = totalSpots > 0 ? (bookings / totalSpots) * 100 : 0;
      result.push({
        hour,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        bookings,
      });
    }

    return result;
  }

  /**
   * Get top performing parking lots
   */
  async getTopParkingLots(limit: number = 10): Promise<TopParkingLot[]> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const data = await Booking.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth },
          status: { $nin: ["cancelled", "expired"] },
        },
      },
      {
        $group: {
          _id: "$lotId",
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
      {
        $sort: { totalRevenue: -1 },
      },
      {
        $limit: limit,
      },
    ]);

    const lots = await ParkingLot.find({
      _id: { $in: data.map((d) => d._id) },
    });

    return data.map((item) => {
      const lot = lots.find((l) => l._id.equals(item._id));
      const occupancyRate = lot
        ? ((lot.totalSpots - (lot.availableSpots || 0)) / lot.totalSpots) * 100
        : 0;
      return {
        lotId: item._id.toString(),
        lotName: lot?.name || "Unknown",
        totalBookings: item.totalBookings,
        totalRevenue: item.totalRevenue,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
      };
    });
  }

  /**
   * Get booking trends
   */
  async getBookingTrends(days: number = 30): Promise<BookingTrends[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const data = await Booking.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$date" },
          },
          bookings: { $sum: 1 },
          cancellations: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
          revenue: {
            $sum: {
              $cond: [{ $eq: ["$status", "cancelled"] }, 0, "$totalAmount"],
            },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return data.map((item) => ({
      date: item._id,
      bookings: item.bookings,
      cancellations: item.cancellations,
      revenue: item.revenue,
    }));
  }

  /**
   * Get user booking statistics
   */
  async getUserBookingStats(userId: string): Promise<{
    totalBookings: number;
    cancelledBookings: number;
    totalSpent: number;
    favoriteLot: string | null;
    avgBookingDuration: number;
  }> {
    const userBookings = await Booking.find({
      userId: new mongoose.Types.ObjectId(userId),
    }).populate("lotId", "name");

    const totalBookings = userBookings.length;
    const cancelledBookings = userBookings.filter(
      (b) => b.status === "cancelled",
    ).length;
    const totalSpent = userBookings
      .filter((b) => b.status !== "cancelled")
      .reduce((sum, b) => sum + b.totalAmount, 0);

    // Find favorite lot
    const lotCounts: Record<string, number> = {};
    userBookings.forEach((b) => {
      if (b.lotId) {
        const lotName = (b.lotId as unknown as { name: string }).name;
        lotCounts[lotName] = (lotCounts[lotName] || 0) + 1;
      }
    });
    const favoriteLot =
      Object.entries(lotCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Calculate average duration
    const durations = userBookings
      .filter((b) => b.duration)
      .map((b) => b.duration);
    const avgBookingDuration =
      durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;

    return {
      totalBookings,
      cancelledBookings,
      totalSpent,
      favoriteLot,
      avgBookingDuration: Math.round(avgBookingDuration * 10) / 10,
    };
  }

  /**
   * Get cancellation rate
   */
  async getCancellationRate(days: number = 30): Promise<number> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [total, cancelled] = await Promise.all([
      Booking.countDocuments({
        date: { $gte: startDate },
      }),
      Booking.countDocuments({
        date: { $gte: startDate },
        status: "cancelled",
      }),
    ]);

    return total > 0 ? Math.round((cancelled / total) * 100 * 100) / 100 : 0;
  }
}

export const analyticsService = new AnalyticsService();
