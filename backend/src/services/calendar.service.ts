import { createEvents, EventAttributes, DateArray } from "ics";
import { Booking } from "../models/index.js";
import logger from "../utils/logger.js";

class CalendarService {
  /**
   * Generate ICS file content for a single booking
   */
  async generateBookingICS(bookingId: string): Promise<string | null> {
    try {
      const booking = await Booking.findById(bookingId)
        .populate("lotId")
        .populate("vehicleId");

      if (!booking) {
        logger.warn(`Booking not found for calendar: ${bookingId}`);
        return null;
      }

      const lot = booking.lotId as unknown as { name: string; address: string };
      const vehicle = booking.vehicleId as unknown as {
        licensePlate: string;
        make: string;
        model: string;
      };

      const bookingDate = new Date(booking.date);
      const [startHour, startMin] = booking.startTime.split(":").map(Number);
      const [endHour, endMin] = booking.endTime.split(":").map(Number);

      const startDate: DateArray = [
        bookingDate.getFullYear(),
        bookingDate.getMonth() + 1,
        bookingDate.getDate(),
        startHour,
        startMin,
      ];

      const endDate: DateArray = [
        bookingDate.getFullYear(),
        bookingDate.getMonth() + 1,
        bookingDate.getDate(),
        endHour,
        endMin,
      ];

      const event: EventAttributes = {
        start: startDate,
        end: endDate,
        title: `Parking: ${lot?.name || "Parking Lot"}`,
        description: `
Parking Booking Details:
- Booking ID: ${booking._id}
- Location: ${lot?.name}
- Address: ${lot?.address}
- Vehicle: ${vehicle?.make} ${vehicle?.model} (${vehicle?.licensePlate})
- Duration: ${booking.duration} hours

Status: ${booking.status}
Passcode: ${booking.passcode || "N/A"}
        `.trim(),
        location: lot?.address || "",
        status: booking.status === "cancelled" ? "CANCELLED" : "CONFIRMED",
        busyStatus: "BUSY",
        uid: booking._id.toString(),
        productId: "kilocar/calendar",
        method: "REQUEST",
      };

      return new Promise((resolve) => {
        createEvents([event], (error, value) => {
          if (error) {
            logger.error(
              `Failed to generate ICS for booking ${bookingId}:`,
              error,
            );
            resolve(null);
          } else {
            resolve(value || null);
          }
        });
      });
    } catch (error) {
      logger.error(`Failed to generate ICS for booking ${bookingId}:`, error);
      return null;
    }
  }

  /**
   * Generate ICS file content for multiple bookings
   */
  async generateMultipleBookingsICS(
    bookingIds: string[],
  ): Promise<string | null> {
    try {
      const bookings = await Booking.find({ _id: { $in: bookingIds } })
        .populate("lotId")
        .populate("vehicleId");

      if (bookings.length === 0) {
        logger.warn("No bookings found for calendar export");
        return null;
      }

      const events: EventAttributes[] = await Promise.all(
        bookings.map(async (booking) => {
          const lot = booking.lotId as unknown as {
            name: string;
            address: string;
          };
          const vehicle = booking.vehicleId as unknown as {
            licensePlate: string;
            make: string;
            model: string;
          };

          const bookingDate = new Date(booking.date);
          const [startHour, startMin] = booking.startTime
            .split(":")
            .map(Number);
          const [endHour, endMin] = booking.endTime.split(":").map(Number);

          const startDate: DateArray = [
            bookingDate.getFullYear(),
            bookingDate.getMonth() + 1,
            bookingDate.getDate(),
            startHour,
            startMin,
          ];

          const endDate: DateArray = [
            bookingDate.getFullYear(),
            bookingDate.getMonth() + 1,
            bookingDate.getDate(),
            endHour,
            endMin,
          ];

          return {
            start: startDate,
            end: endDate,
            title: `Parking: ${lot?.name || "Parking Lot"}`,
            description: `
Parking Booking Details:
- Booking ID: ${booking._id}
- Location: ${lot?.name}
- Vehicle: ${vehicle?.make} ${vehicle?.model} (${vehicle?.licensePlate})
- Duration: ${booking.duration} hours

Status: ${booking.status}
            `.trim(),
            location: lot?.address || "",
            status: booking.status === "cancelled" ? "CANCELLED" : "CONFIRMED",
            busyStatus: "BUSY",
            uid: booking._id.toString(),
          } as EventAttributes;
        }),
      );

      return new Promise((resolve) => {
        createEvents(events, (error, value) => {
          if (error) {
            logger.error(
              "Failed to generate ICS for multiple bookings:",
              error,
            );
            resolve(null);
          } else {
            resolve(value || null);
          }
        });
      });
    } catch (error) {
      logger.error("Failed to generate ICS for multiple bookings:", error);
      return null;
    }
  }

  /**
   * Generate ICS for user's upcoming bookings
   */
  async generateUserBookingsICS(userId: string): Promise<string | null> {
    try {
      const bookings = await Booking.find({
        userId,
        date: { $gte: new Date() },
        status: { $nin: ["cancelled", "expired"] },
      })
        .populate("lotId")
        .populate("vehicleId")
        .sort({ date: 1 });

      if (bookings.length === 0) {
        logger.warn("No upcoming bookings found for user");
        return null;
      }

      const events: EventAttributes[] = bookings.map((booking) => {
        const lot = booking.lotId as unknown as {
          name: string;
          address: string;
        };
        const vehicle = booking.vehicleId as unknown as {
          licensePlate: string;
          make: string;
          model: string;
        };

        const bookingDate = new Date(booking.date);
        const [startHour, startMin] = booking.startTime.split(":").map(Number);
        const [endHour, endMin] = booking.endTime.split(":").map(Number);

        const startDate: DateArray = [
          bookingDate.getFullYear(),
          bookingDate.getMonth() + 1,
          bookingDate.getDate(),
          startHour,
          startMin,
        ];

        const endDate: DateArray = [
          bookingDate.getFullYear(),
          bookingDate.getMonth() + 1,
          bookingDate.getDate(),
          endHour,
          endMin,
        ];

        return {
          start: startDate,
          end: endDate,
          title: `Parking: ${lot?.name || "Parking Lot"}`,
          description: `
Parking Booking Details:
- Booking ID: ${booking._id}
- Location: ${lot?.name}
- Address: ${lot?.address}
- Vehicle: ${vehicle?.make} ${vehicle?.model} (${vehicle?.licensePlate})
- Duration: ${booking.duration} hours

Status: ${booking.status}
Passcode: ${booking.passcode || "N/A"}
          `.trim(),
          location: lot?.address || "",
          status: "CONFIRMED" as const,
          busyStatus: "BUSY" as const,
          uid: booking._id.toString(),
        };
      });

      return new Promise((resolve) => {
        createEvents(events, (error, value) => {
          if (error) {
            logger.error("Failed to generate ICS for user bookings:", error);
            resolve(null);
          } else {
            resolve(value || null);
          }
        });
      });
    } catch (error) {
      logger.error("Failed to generate ICS for user bookings:", error);
      return null;
    }
  }
}

export const calendarService = new CalendarService();
