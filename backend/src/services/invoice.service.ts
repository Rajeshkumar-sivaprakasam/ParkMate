import { Booking } from "../models/index.js";
import logger from "../utils/logger.js";

// Invoice types
export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  billingInfo: {
    name: string;
    email: string;
    address?: string;
    company?: string;
  };
  bookingInfo: {
    bookingId: string;
    lotName: string;
    lotAddress: string;
    date: string;
    startTime: string;
    endTime: string;
    duration: number;
    vehicleInfo: string;
  };
  paymentInfo: {
    subtotal: number;
    tax: number;
    total: number;
    currency: string;
    paymentMethod: string;
    paymentStatus: string;
    transactionId?: string;
  };
  refundInfo?: {
    amount: number;
    percentage: number;
    status: string;
  };
}

class InvoiceService {
  private readonly taxRate = 0.06; // 6% SST

  /**
   * Generate invoice number
   */
  private generateInvoiceNumber(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `INV-${timestamp}-${random}`;
  }

  /**
   * Generate invoice data for a booking
   */
  async generateInvoiceData(bookingId: string): Promise<InvoiceData | null> {
    try {
      const booking = await Booking.findById(bookingId)
        .populate("lotId")
        .populate("vehicleId")
        .populate("userId");

      if (!booking) {
        logger.warn(`Booking not found for invoice: ${bookingId}`);
        return null;
      }

      const lot = booking.lotId as unknown as { name: string; address: string };
      const vehicle = booking.vehicleId as unknown as {
        licensePlate: string;
        make: string;
        model: string;
      };
      const user = booking.userId as unknown as {
        firstName: string;
        lastName: string;
        email: string;
        company?: string;
      };

      const subtotal = booking.totalAmount;
      const tax = subtotal * this.taxRate;
      const total = subtotal + tax;

      const invoiceData: InvoiceData = {
        invoiceNumber: this.generateInvoiceNumber(),
        invoiceDate: booking.createdAt,
        dueDate: new Date(
          booking.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000,
        ),
        billingInfo: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          company: user.company,
        },
        bookingInfo: {
          bookingId: booking._id.toString(),
          lotName: lot?.name || "Unknown",
          lotAddress: lot?.address || "Unknown",
          date: new Date(booking.date).toLocaleDateString(),
          startTime: booking.startTime,
          endTime: booking.endTime,
          duration: booking.duration,
          vehicleInfo: vehicle
            ? `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`
            : "Unknown",
        },
        paymentInfo: {
          subtotal,
          tax: Math.round(tax * 100) / 100,
          total: Math.round(total * 100) / 100,
          currency: booking.currency,
          paymentMethod: booking.paymentMethod || "card",
          paymentStatus: booking.paymentStatus,
          transactionId: booking.transactionId,
        },
      };

      if (booking.refundAmount && booking.refundAmount > 0) {
        invoiceData.refundInfo = {
          amount: booking.refundAmount,
          percentage:
            booking.totalAmount > 0
              ? Math.round((booking.refundAmount / booking.totalAmount) * 100)
              : 0,
          status: booking.refundStatus || "none",
        };
      }

      return invoiceData;
    } catch (error) {
      logger.error(
        `Failed to generate invoice for booking ${bookingId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Generate HTML invoice for a booking
   */
  async generateInvoiceHTML(bookingId: string): Promise<string | null> {
    const invoice = await this.generateInvoiceData(bookingId);
    if (!invoice) return null;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .company-info h1 { color: #2563eb; margin: 0; }
    .invoice-info { text-align: right; }
    .invoice-number { font-size: 24px; font-weight: bold; color: #1f2937; }
    .invoice-date { color: #6b7280; }
    .billing-section { margin-bottom: 30px; }
    .section-title { font-size: 14px; font-weight: bold; color: #6b7280; text-transform: uppercase; margin-bottom: 10px; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .table th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; }
    .table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    .table td.amount { text-align: right; font-weight: 600; }
    .totals { margin-left: auto; width: 300px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .totals-row.total { font-size: 18px; font-weight: bold; border-top: 2px solid #1f2937; padding-top: 12px; margin-top: 8px; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
    .status.paid { background: #d1fae5; color: #065f46; }
    .status.pending { background: #fef3c7; color: #92400e; }
    .status.refunded { background: #fee2e2; color: #991b1b; }
    .footer { margin-top: 60px; text-align: center; color: #9ca3af; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <h1>🅿️ Kilo Car</h1>
      <p>Parking Management System</p>
    </div>
    <div class="invoice-info">
      <div class="invoice-number">${invoice.invoiceNumber}</div>
      <div class="invoice-date">Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}</div>
      <div class="invoice-date">Due: ${new Date(invoice.dueDate).toLocaleDateString()}</div>
    </div>
  </div>

  <div class="billing-section">
    <div class="section-title">Bill To</div>
    <p><strong>${invoice.billingInfo.name}</strong></p>
    <p>${invoice.billingInfo.email}</p>
    ${invoice.billingInfo.company ? `<p>${invoice.billingInfo.company}</p>` : ""}
  </div>

  <table class="table">
    <thead>
      <tr>
        <th>Description</th>
        <th>Details</th>
        <th class="amount">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <strong>Parking Booking</strong><br>
          ${invoice.bookingInfo.lotName}
        </td>
        <td>
          Date: ${invoice.bookingInfo.date}<br>
          Time: ${invoice.bookingInfo.startTime} - ${invoice.bookingInfo.endTime}<br>
          Duration: ${invoice.bookingInfo.duration} hours<br>
          Vehicle: ${invoice.bookingInfo.vehicleInfo}
        </td>
        <td class="amount">${invoice.paymentInfo.currency} ${invoice.paymentInfo.subtotal.toFixed(2)}</td>
      </tr>
      <tr>
        <td colspan="2"><strong>Subtotal</strong></td>
        <td class="amount">${invoice.paymentInfo.currency} ${invoice.paymentInfo.subtotal.toFixed(2)}</td>
      </tr>
      <tr>
        <td colspan="2">Tax (SST 6%)</td>
        <td class="amount">${invoice.paymentInfo.currency} ${invoice.paymentInfo.tax.toFixed(2)}</td>
      </tr>
      ${
        invoice.refundInfo
          ? `
      <tr>
        <td colspan="2">Refund (${invoice.refundInfo.percentage}%)</td>
        <td class="amount" style="color: #dc2626;">-${invoice.paymentInfo.currency} ${invoice.refundInfo.amount.toFixed(2)}</td>
      </tr>
      `
          : ""
      }
      <tr class="totals-row total">
        <td><strong>Total</strong></td>
        <td class="amount"><strong>${invoice.paymentInfo.currency} ${invoice.paymentInfo.total.toFixed(2)}</strong></td>
      </tr>
    </tbody>
  </table>

  <div style="margin-bottom: 30px;">
    <span class="status ${invoice.paymentInfo.paymentStatus === "completed" ? "paid" : invoice.paymentInfo.paymentStatus === "refunded" ? "refunded" : "pending"}">
      ${invoice.paymentInfo.paymentStatus.toUpperCase()}
    </span>
    ${invoice.paymentInfo.transactionId ? `<span style="margin-left: 10px; color: #6b7280;">Transaction ID: ${invoice.paymentInfo.transactionId}</span>` : ""}
  </div>

  <div class="footer">
    <p>Thank you for using Kilo Car Parking!</p>
    <p>This is a computer-generated invoice. No signature required.</p>
  </div>
</body>
</html>
    `;
  }
}

export const invoiceService = new InvoiceService();
