import nodemailer, { Transporter } from "nodemailer";
import { config } from "../config/index.js";
import logger from "../utils/logger.js";

// Email template types
export type EmailTemplateType =
  | "booking_confirmation"
  | "booking_cancelled"
  | "refund_processed"
  | "refund_failed"
  | "check_in_reminder"
  | "admin_booking_cancelled"
  | "admin_booking_created"
  | "password_reset"
  | "email_verification";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: Transporter;
  private fromEmail: string;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
    this.fromEmail = config.smtp.from;
    logger.info(`Email service initialized with host: ${config.smtp.host}`);
  }

  private async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: `"ParkMate Parking" <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      logger.info(`Email sent successfully to: ${options.to}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  // ============================================
  // EMAIL TEMPLATES
  // ============================================

  private getTemplate(
    type: EmailTemplateType,
    data: Record<string, unknown>,
  ): { subject: string; html: string; text: string } {
    const templates: Record<
      EmailTemplateType,
      {
        subject: string;
        getHtml: (data: Record<string, unknown>) => string;
        getText: (data: Record<string, unknown>) => string;
      }
    > = {
      booking_confirmation: {
        subject: "Booking Confirmed - {{bookingId}}",
        getHtml: (d) => `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Booking Confirmed</title>
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">✅ Booking Confirmed!</h1>
              <p style="color: #bfdbfe; margin: 10px 0 0;">Your parking space has been reserved</p>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="margin-top: 0;">Dear <strong>${d.userName || "Customer"}</strong>,</p>
              <p>Your booking has been confirmed. Here are your booking details:</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Booking ID</td>
                    <td style="padding: 8px 0; font-weight: 600;">${d.bookingId || "N/A"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Parking Lot</td>
                    <td style="padding: 8px 0; font-weight: 600;">${d.parkingLotName || "N/A"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Address</td>
                    <td style="padding: 8px 0;">${d.parkingLotAddress || "N/A"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Date</td>
                    <td style="padding: 8px 0; font-weight: 600;">${d.bookingDate || "N/A"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Time</td>
                    <td style="padding: 8px 0; font-weight: 600;">${d.startTime || ""} - ${d.endTime || ""}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Vehicle</td>
                    <td style="padding: 8px 0; font-weight: 600;">${d.vehicleInfo || "N/A"}</td>
                  </tr>
                  <tr style="border-top: 2px solid #e5e7eb;">
                    <td style="padding: 12px 0 8px; color: #6b7280; font-size: 16px;">Total Amount</td>
                    <td style="padding: 12px 0 8px; font-weight: 700; font-size: 18px; color: #059669;">${d.currency || "RM"} ${d.totalAmount || "0.00"}</td>
                  </tr>
                </table>
              </div>

              ${
                d.qrCode
                  ? `<div style="text-align: center; margin: 20px 0;">
                <p style="color: #6b7280; margin-bottom: 10px;">Scan QR Code at Entry</p>
                <img src="${d.qrCode}" alt="QR Code" style="width: 150px; height: 150px; border: 2px solid #e5e7eb; border-radius: 8px;">
              </div>`
                  : ""
              }

              ${
                d.passcode
                  ? `<div style="background: #fef3c7; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <strong style="color: #92400e;">Entry Passcode:</strong>
                <span style="font-size: 24px; font-weight: bold; color: #b45309; margin-left: 10px;">${d.passcode}</span>
              </div>`
                  : ""
              }

              <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <strong style="color: #1e40af;">📍 Directions:</strong>
                <p style="margin: 10px 0 0; color: #1e3a8a;">${d.directions || "Please arrive at least 10 minutes before your booking time."}</p>
              </div>

              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Need to modify or cancel? Visit your <a href="${d.myBookingsUrl || "#"}" style="color: #2563eb;">My Bookings</a> page.
              </p>
            </div>
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p>© ${new Date().getFullYear()} ParkMate Parking. All rights reserved.</p>
              <p>This is an automated message, please do not reply directly.</p>
            </div>
          </body>
          </html>
        `,
        getText: (d) => `
Booking Confirmed - ${d.bookingId}

Dear ${d.userName || "Customer"},

Your parking space has been reserved!

Booking Details:
- Booking ID: ${d.bookingId}
- Parking Lot: ${d.parkingLotName}
- Address: ${d.parkingLotAddress}
- Date: ${d.bookingDate}
- Time: ${d.startTime} - ${d.endTime}
- Vehicle: ${d.vehicleInfo}
- Total Amount: ${d.currency} ${d.totalAmount}

${d.passcode ? `Entry Passcode: ${d.passcode}` : ""}

Please arrive at least 10 minutes before your booking time.

Thank you for choosing ParkMate Parking!

© ${new Date().getFullYear()} ParkMate Parking
        `,
      },

      booking_cancelled: {
        subject: "Booking Cancelled - {{bookingId}}",
        getHtml: (d) => `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Booking Cancelled</title>
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">❌ Booking Cancelled</h1>
              <p style="color: #fecaca; margin: 10px 0 0;">Your booking has been successfully cancelled</p>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="margin-top: 0;">Dear <strong>${d.userName || "Customer"}</strong>,</p>
              <p>Your booking has been cancelled. Here are the details:</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Booking ID</td>
                    <td style="padding: 8px 0; font-weight: 600;">${d.bookingId || "N/A"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Parking Lot</td>
                    <td style="padding: 8px 0; font-weight: 600;">${d.parkingLotName || "N/A"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Date</td>
                    <td style="padding: 8px 0; font-weight: 600;">${d.bookingDate || "N/A"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Time</td>
                    <td style="padding: 8px 0; font-weight: 600;">${d.startTime || ""} - ${d.endTime || ""}</td>
                  </tr>
                  ${
                    d.refundAmount > 0
                      ? `
                  <tr style="border-top: 2px solid #e5e7eb;">
                    <td style="padding: 12px 0 8px; color: #6b7280; font-size: 16px;">Refund Amount</td>
                    <td style="padding: 12px 0 8px; font-weight: 700; font-size: 18px; color: #059669;">${d.currency || "RM"} ${d.refundAmount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Refund Percentage</td>
                    <td style="padding: 8px 0; font-weight: 600;">${d.refundPercentage}%</td>
                  </tr>
                  `
                      : ""
                  }
                  ${
                    d.cancellationReason
                      ? `
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Reason</td>
                    <td style="padding: 8px 0;">${d.cancellationReason}</td>
                  </tr>
                  `
                      : ""
                  }
                </table>
              </div>

              ${
                d.refundAmount > 0
                  ? `
              <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <strong style="color: #047857;">💳 Refund Information:</strong>
                <p style="margin: 10px 0 0; color: #065f46;">
                  Your refund of <strong>${d.currency} ${d.refundAmount.toFixed(2)}</strong> will be processed to your original payment method within 5-7 business days.
                </p>
              </div>
              `
                  : `
              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <strong style="color: #92400e;">ℹ️ Refund Information:</strong>
                <p style="margin: 10px 0 0; color: #92400e;">
                  This booking was not eligible for a refund based on the cancellation policy.
                </p>
              </div>
              `
              }

              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Thank you for using ParkMate Parking. We hope to serve you again soon!
              </p>
            </div>
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p>© ${new Date().getFullYear()} ParkMate Parking. All rights reserved.</p>
            </div>
          </body>
          </html>
        `,
        getText: (d) => `
Booking Cancelled - ${d.bookingId}

Dear ${d.userName || "Customer"},

Your booking has been cancelled.

Booking Details:
- Booking ID: ${d.bookingId}
- Parking Lot: ${d.parkingLotName}
- Date: ${d.bookingDate}
- Time: ${d.startTime} - ${d.endTime}

${d.refundAmount > 0 ? `Refund Amount: ${d.currency} ${d.refundAmount.toFixed(2)} (${d.refundPercentage}%)\nRefund will be processed within 5-7 business days.` : "This booking was not eligible for a refund."}

${d.cancellationReason ? `Reason: ${d.cancellationReason}` : ""}

Thank you for using ParkMate Parking!

© ${new Date().getFullYear()} ParkMate Parking
        `,
      },

      refund_processed: {
        subject: "Refund Processed - {{bookingId}}",
        getHtml: (d) => `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Refund Processed</title>
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">✅ Refund Processed</h1>
              <p style="color: #a7f3d0; margin: 10px 0 0;">Your refund has been successfully processed</p>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="margin-top: 0;">Dear <strong>${d.userName || "Customer"}</strong>,</p>
              <p>Great news! Your refund has been processed successfully.</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <p style="color: #6b7280; margin: 0;">Refund Amount</p>
                <p style="font-size: 36px; font-weight: 700; color: #059669; margin: 10px 0;">${d.currency || "RM"} ${d.refundAmount || "0.00"}</p>
              </div>

              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Booking ID</td>
                    <td style="padding: 8px 0; font-weight: 600;">${d.bookingId || "N/A"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Refund ID</td>
                    <td style="padding: 8px 0; font-weight: 600;">${d.refundId || "N/A"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Processed Date</td>
                    <td style="padding: 8px 0; font-weight: 600;">${d.processedDate || new Date().toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Payment Method</td>
                    <td style="padding: 8px 0;">Original payment method</td>
                  </tr>
                </table>
              </div>

              <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #065f46;">
                  The refund should appear in your account within 5-7 business days, depending on your bank or payment provider.
                </p>
              </div>

              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                If you have any questions, please contact our support team.
              </p>
            </div>
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p>© ${new Date().getFullYear()} ParkMate Parking. All rights reserved.</p>
            </div>
          </body>
          </html>
        `,
        getText: (d) => `
Refund Processed - ${d.bookingId}

Dear ${d.userName || "Customer"},

Your refund has been processed successfully!

Refund Amount: ${d.currency} ${d.refundAmount || "0.00"}

Details:
- Booking ID: ${d.bookingId}
- Refund ID: ${d.refundId || "N/A"}
- Processed Date: ${d.processedDate || new Date().toLocaleDateString()}

The refund should appear in your account within 5-7 business days.

Thank you!

© ${new Date().getFullYear()} ParkMate Parking
        `,
      },

      refund_failed: {
        subject: "Refund Failed - {{bookingId}}",
        getHtml: (d) => `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Refund Failed</title>
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Refund Failed</h1>
              <p style="color: #fecaca; margin: 10px 0 0;">There was an issue processing your refund</p>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="margin-top: 0;">Dear <strong>${d.userName || "Customer"}</strong>,</p>
              <p>We encountered an issue while processing your refund. Please contact our support team for assistance.</p>
              
              <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Booking ID</td>
                    <td style="padding: 8px 0; font-weight: 600;">${d.bookingId || "N/A"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Refund Amount</td>
                    <td style="padding: 8px 0; font-weight: 600;">${d.currency || "RM"} ${d.refundAmount || "0.00"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Error Message</td>
                    <td style="padding: 8px 0; color: #dc2626;">${d.errorMessage || "Unknown error"}</td>
                  </tr>
                </table>
              </div>

              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e;">
                  Please contact our support team at <strong>support@kilocar.example.com</strong> or call our hotline for immediate assistance.
                </p>
              </div>
            </div>
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p>© ${new Date().getFullYear()} ParkMate Parking. All rights reserved.</p>
            </div>
          </body>
          </html>
        `,
        getText: (d) => `
Refund Failed - ${d.bookingId}

Dear ${d.userName || "Customer"},

There was an issue processing your refund.

Booking ID: ${d.bookingId}
Refund Amount: ${d.currency} ${d.refundAmount || "0.00"}
Error: ${d.errorMessage || "Unknown error"}

Please contact our support team for assistance.

© ${new Date().getFullYear()} ParkMate Parking
        `,
      },

      check_in_reminder: {
        subject: "Check-in Reminder - {{bookingId}}",
        getHtml: (d) => `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Check-in Reminder</title>
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Check-in Reminder</h1>
              <p style="color: #fef3c7; margin: 10px 0 0;">Your booking starts soon!</p>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="margin-top: 0;">Dear <strong>${d.userName || "Customer"}</strong>,</p>
              <p>This is a friendly reminder that your parking booking starts soon!</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Booking ID</td>
                    <td style="padding: 8px 0; font-weight: 600;">${d.bookingId || "N/A"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Parking Lot</td>
                    <td style="padding: 8px 0; font-weight: 600;">${d.parkingLotName || "N/A"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Date</td>
                    <td style="padding: 8px 0; font-weight: 600;">${d.bookingDate || "N/A"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Check-in Time</td>
                    <td style="padding: 8px 0; font-weight: 600; color: #059669;">${d.startTime || ""}</td>
                  </tr>
                </table>
              </div>

              <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #1e40af;">
                  Please arrive at least 5-10 minutes before your scheduled time for a smooth check-in experience.
                </p>
              </div>

              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                See you soon at ${d.parkingLotName || "the parking lot"}!
              </p>
            </div>
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p>© ${new Date().getFullYear()} ParkMate Parking. All rights reserved.</p>
            </div>
          </body>
          </html>
        `,
        getText: (d) => `
Check-in Reminder - ${d.bookingId}

Dear ${d.userName || "Customer"},

Your booking starts soon!

Booking Details:
- Booking ID: ${d.bookingId}
- Parking Lot: ${d.parkingLotName}
- Date: ${d.bookingDate}
- Check-in Time: ${d.startTime}

Please arrive 5-10 minutes before your scheduled time.

See you soon!

© ${new Date().getFullYear()} ParkMate Parking
        `,
      },

      admin_booking_cancelled: {
        subject: "[ADMIN] Booking Cancelled - {{bookingId}}",
        getHtml: (d) => `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Admin - Booking Cancelled</title>
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🔔 Admin Alert</h1>
              <p style="color: #ddd6fe; margin: 10px 0 0;">A booking has been cancelled</p>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="margin-top: 0;">Dear <strong>Admin</strong>,</p>
              <p>A user has cancelled their booking. Please review the details below:</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Booking ID</td>
                    <td style="padding: 8px 0; font-weight: 600;">${d.bookingId || "N/A"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">User</td>
                    <td style="padding: 8px 0; font-weight: 600;">${d.userName || "N/A"} (${d.userEmail || "N/A"})</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Parking Lot</td>
                    <td style="padding: 8px 0; font-weight: 600;">${d.parkingLotName || "N/A"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Date</td>
                    <td style="padding: 8px 0; font-weight: 600;">${d.bookingDate || "N/A"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Time</td>
                    <td style="padding: 8px 0; font-weight: 600;">${d.startTime || ""} - ${d.endTime || ""}</td>
                  </tr>
                  ${
                    d.refundAmount > 0
                      ? `
                  <tr style="border-top: 2px solid #e5e7eb;">
                    <td style="padding: 12px 0 8px; color: #6b7280;">Refund Amount</td>
                    <td style="padding: 12px 0 8px; font-weight: 700; color: #dc2626;">${d.currency || "RM"} ${d.refundAmount.toFixed(2)}</td>
                  </tr>
                  `
                      : ""
                  }
                  ${
                    d.cancellationReason
                      ? `
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Cancellation Reason</td>
                    <td style="padding: 8px 0;">${d.cancellationReason}</td>
                  </tr>
                  `
                      : ""
                  }
                </table>
              </div>

              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                <a href="${d.adminDashboardUrl || "#"}" style="color: #2563eb;">View in Admin Dashboard</a>
              </p>
            </div>
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p>ParkMate Parking Admin System</p>
              <p>© ${new Date().getFullYear()} ParkMate Parking</p>
            </div>
          </body>
          </html>
        `,
        getText: (d) => `
[ADMIN] Booking Cancelled - ${d.bookingId}

A booking has been cancelled by a user.

Booking Details:
- Booking ID: ${d.bookingId}
- User: ${d.userName} (${d.userEmail})
- Parking Lot: ${d.parkingLotName}
- Date: ${d.bookingDate}
- Time: ${d.startTime} - ${d.endTime}
${d.refundAmount > 0 ? `- Refund Amount: ${d.currency} ${d.refundAmount.toFixed(2)}` : ""}
${d.cancellationReason ? `- Reason: ${d.cancellationReason}` : ""}

View in Admin Dashboard: ${d.adminDashboardUrl || "#"}

© ${new Date().getFullYear()} ParkMate Parking
        `,
      },

      admin_booking_created: {
        subject: "[ADMIN] New Booking - {{bookingId}}",
        getHtml: (d) => `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Admin - New Booking</title>
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🔔 New Booking</h1>
              <p style="color: #a7f3d0; margin: 10px 0 0;">A new parking booking has been created</p>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="margin-top: 0;">Dear <strong>Admin</strong>,</p>
              <p>A new booking has been created. Please review the details below:</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Booking ID</td>
                    <td style="padding: 8px 0; font-weight: 600;">${d.bookingId || "N/A"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">User</td>
                    <td style="padding: 8px 0; font-weight: 600;">${d.userName || "N/A"} (${d.userEmail || "N/A"})</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Parking Lot</td>
                    <td style="padding: 8px 0; font-weight: 600;">${d.parkingLotName || "N/A"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Date</td>
                    <td style="padding: 8px 0; font-weight: 600;">${d.bookingDate || "N/A"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Time</td>
                    <td style="padding: 8px 0; font-weight: 600;">${d.startTime || ""} - ${d.endTime || ""}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Vehicle</td>
                    <td style="padding: 8px 0; font-weight: 600;">${d.vehicleInfo || "N/A"}</td>
                  </tr>
                  <tr style="border-top: 2px solid #e5e7eb;">
                    <td style="padding: 12px 0 8px; color: #6b7280; font-size: 16px;">Amount</td>
                    <td style="padding: 12px 0 8px; font-weight: 700; font-size: 18px; color: #059669;">${d.currency || "RM"} ${d.totalAmount || "0.00"}</td>
                  </tr>
                </table>
              </div>

              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                <a href="${d.adminDashboardUrl || "#"}" style="color: #2563eb;">View in Admin Dashboard</a>
              </p>
            </div>
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p>ParkMate Parking Admin System</p>
              <p>© ${new Date().getFullYear()} ParkMate Parking</p>
            </div>
          </body>
          </html>
        `,
        getText: (d) => `
[ADMIN] New Booking - ${d.bookingId}

A new booking has been created.

Booking Details:
- Booking ID: ${d.bookingId}
- User: ${d.userName} (${d.userEmail})
- Parking Lot: ${d.parkingLotName}
- Date: ${d.bookingDate}
- Time: ${d.startTime} - ${d.endTime}
- Vehicle: ${d.vehicleInfo}
- Amount: ${d.currency} ${d.totalAmount}

View in Admin Dashboard: ${d.adminDashboardUrl || "#"}

© ${new Date().getFullYear()} ParkMate Parking
        `,
      },

      password_reset: {
        subject: "Reset Your Password",
        getHtml: (d) => `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Password Reset</title>
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Password Reset</h1>
              <p style="color: #bfdbfe; margin: 10px 0 0;">Reset your ParkMate password</p>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="margin-top: 0;">Dear <strong>${d.userName || "Customer"}</strong>,</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${d.resetLink || "#"}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                  Reset Password
                </a>
              </div>

              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>⚠️ Security Notice:</strong><br>
                  • This link will expire in 1 hour<br>
                  • If you didn't request a password reset, please ignore this email
                </p>
              </div>

              <p style="color: #6b7280; font-size: 14px;">
                Or copy this link to your browser:<br>
                <span style="color: #2563eb; word-break: break-all;">${d.resetLink || ""}</span>
              </p>
            </div>
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p>© ${new Date().getFullYear()} ParkMate Parking. All rights reserved.</p>
            </div>
          </body>
          </html>
        `,
        getText: (d) => `
Password Reset

Dear ${d.userName || "Customer"},

We received a request to reset your password.

Click the link below to create a new password:
${d.resetLink || ""}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email.

© ${new Date().getFullYear()} ParkMate Parking
        `,
      },

      email_verification: {
        subject: "Verify Your Email",
        getHtml: (d) => `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Email Verification</title>
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">📧 Email Verification</h1>
              <p style="color: #bfdbfe; margin: 10px 0 0;">Verify your ParkMate account</p>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="margin-top: 0;">Dear <strong>${d.userName || "Customer"}</strong>,</p>
              <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${d.verificationLink || "#"}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                  Verify Email
                </a>
              </div>

              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>⚠️ Note:</strong><br>
                  • This verification link will expire in 24 hours<br>
                  • If you didn't create an account, please ignore this email
                </p>
              </div>
            </div>
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p>© ${new Date().getFullYear()} ParkMate Parking. All rights reserved.</p>
            </div>
          </body>
          </html>
        `,
        getText: (d) => `
Email Verification

Dear ${d.userName || "Customer"},

Thank you for signing up! Please verify your email address.

Click the link below to verify:
${d.verificationLink || ""}

This verification link will expire in 24 hours.

If you didn't create an account, please ignore this email.

© ${new Date().getFullYear()} ParkMate Parking
        `,
      },
    };

    const template = templates[type];
    const subject = template.subject.replace(/{{(\w+)}}/g, (_, key) =>
      String(data[key] || ""),
    );

    return {
      subject,
      html: template.getHtml(data),
      text: template.getText(data),
    };
  }

  // ============================================
  // PUBLIC EMAIL METHODS
  // ============================================

  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmation(
    email: string,
    data: {
      userName: string;
      bookingId: string;
      parkingLotName: string;
      parkingLotAddress: string;
      bookingDate: string;
      startTime: string;
      endTime: string;
      vehicleInfo: string;
      totalAmount: number;
      currency: string;
      qrCode?: string;
      passcode?: string;
      directions?: string;
    },
  ): Promise<boolean> {
    const template = this.getTemplate("booking_confirmation", data);
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Send booking cancellation email
   */
  async sendBookingCancellation(
    email: string,
    data: {
      userName: string;
      bookingId: string;
      parkingLotName: string;
      bookingDate: string;
      startTime: string;
      endTime: string;
      refundAmount: number;
      refundPercentage: number;
      currency: string;
      cancellationReason?: string;
    },
  ): Promise<boolean> {
    const template = this.getTemplate("booking_cancelled", data);
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Send refund processed email
   */
  async sendRefundProcessed(
    email: string,
    data: {
      userName: string;
      bookingId: string;
      refundId?: string;
      refundAmount: number;
      currency: string;
      processedDate?: string;
    },
  ): Promise<boolean> {
    const template = this.getTemplate("refund_processed", data);
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Send refund failed email
   */
  async sendRefundFailed(
    email: string,
    data: {
      userName: string;
      bookingId: string;
      refundAmount: number;
      currency: string;
      errorMessage?: string;
    },
  ): Promise<boolean> {
    const template = this.getTemplate("refund_failed", data);
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Send check-in reminder email
   */
  async sendCheckInReminder(
    email: string,
    data: {
      userName: string;
      bookingId: string;
      parkingLotName: string;
      bookingDate: string;
      startTime: string;
    },
  ): Promise<boolean> {
    const template = this.getTemplate("check_in_reminder", data);
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Send admin notification for booking cancellation
   */
  async sendAdminBookingCancelled(
    adminEmail: string,
    data: {
      bookingId: string;
      userName: string;
      userEmail: string;
      parkingLotName: string;
      bookingDate: string;
      startTime: string;
      endTime: string;
      refundAmount: number;
      currency: string;
      cancellationReason?: string;
    },
  ): Promise<boolean> {
    const template = this.getTemplate("admin_booking_cancelled", {
      ...data,
      adminDashboardUrl: `${config.frontendUrl}/admin`,
    });
    return this.sendEmail({
      to: adminEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Send admin notification for new booking
   */
  async sendAdminBookingCreated(
    adminEmail: string,
    data: {
      bookingId: string;
      userName: string;
      userEmail: string;
      parkingLotName: string;
      bookingDate: string;
      startTime: string;
      endTime: string;
      vehicleInfo: string;
      totalAmount: number;
      currency: string;
    },
  ): Promise<boolean> {
    const template = this.getTemplate("admin_booking_created", {
      ...data,
      adminDashboardUrl: `${config.frontendUrl}/admin`,
    });
    return this.sendEmail({
      to: adminEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(
    email: string,
    data: {
      userName: string;
      resetLink: string;
    },
  ): Promise<boolean> {
    const template = this.getTemplate("password_reset", data);
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(
    email: string,
    data: {
      userName: string;
      verificationLink: string;
    },
  ): Promise<boolean> {
    const template = this.getTemplate("email_verification", data);
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Send custom email (for bulk operations, etc.)
   */
  async sendCustomEmail(
    email: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<boolean> {
    return this.sendEmail({ to: email, subject, html, text });
  }
}

// Export singleton instance
export const emailService = new EmailService();

/**
 * Helper function to send cancellation email
 */
export async function sendCancellationEmail(
  user: { email: string; name?: string },
  booking: any,
  refundDetails: { refundAmount: number; refundPercentage: number },
): Promise<boolean> {
  const userName = user.name || user.email.split("@")[0];
  const lotName = booking.lotId?.name || "Parking Lot";
  const lotAddress = booking.lotId?.address || "";

  return emailService.sendBookingCancellation(user.email, {
    userName,
    bookingId: booking._id?.toString(),
    parkingLotName: lotName,
    bookingDate: new Date(booking.date).toLocaleDateString("en-MY"),
    startTime: booking.startTime,
    endTime: booking.endTime,
    refundAmount: refundDetails.refundAmount,
    refundPercentage: refundDetails.refundPercentage,
    currency: booking.currency || "MYR",
    cancellationReason: booking.cancellationReason,
  });
}
