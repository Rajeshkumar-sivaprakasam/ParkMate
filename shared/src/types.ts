// ============================================
// SHARED TYPES AND INTERFACES
// ParkMate Parking Management System
// ============================================

// ============================================
// USER & AUTH TYPES
// ============================================

export type UserRole = "user" | "admin" | "superadmin";

export interface IUser {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  company?: string;
  department?: string;
  employeeId?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  twoFactorEnabled: boolean;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  defaultParkingZone?: string;
  favoriteLots: string[];
  theme: "light" | "dark" | "system";
  language: string;
}

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface JWTPayload extends AuthPayload {
  iat: number;
  exp: number;
}

// ============================================
// VEHICLE TYPES
// ============================================

export interface IVehicle {
  _id: string;
  userId: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  color: string;
  vehicleType: VehicleType;
  isElectric: boolean;
  evChargerRequired?: boolean;
  registrationExpiry: Date;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type VehicleType =
  | "sedan"
  | "suv"
  | "van"
  | "motorcycle"
  | "truck"
  | "compact";

// ============================================
// PARKING LOT & ZONE TYPES
// ============================================

export interface IParkingLot {
  _id: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  description?: string;
  images: string[];
  totalSpots: number;
  availableSpots: number;
  operatingHours: OperatingHours;
  hourlyRate: number;
  dailyRate: number;
  monthlyRate: number;
  currency: string;
  amenities: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OperatingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  open: string;
  close: string;
  isClosed: boolean;
}

export interface IParkingZone {
  _id: string;
  lotId: string;
  name: string;
  type: ZoneType;
  totalSpots: number;
  availableSpots: number;
  hourlyRate: number;
  description?: string;
  amenities: string[];
  restrictions: ZoneRestriction[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ZoneType =
  | "standard"
  | "ev"
  | "disabled"
  | "visitor"
  | "compact"
  | "carpool"
  | "motorcycle"
  | "reserved";

export interface ZoneRestriction {
  type: "vehicle_type" | "height" | "weight" | "time" | "user_group";
  value: string;
  message: string;
}

export interface IParkingSpot {
  _id: string;
  lotId: string;
  zoneId: string;
  spotNumber: string;
  floor: number;
  isAvailable: boolean;
  isEVCapable: boolean;
  hasEVCharger: boolean;
  isDisabledAccessible: boolean;
  isReserved: boolean;
  reservedFor?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// BOOKING TYPES
// ============================================

export interface IBooking {
  _id: string;
  userId: string;
  vehicleId: string;
  lotId: string;
  zoneId?: string;
  spotId?: string;
  bookingType: BookingType;
  status: BookingStatus;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  totalAmount: number;
  currency: string;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentId?: string;
  transactionId?: string;
  qrCode?: string;
  passcode?: string;
  qrCodeGeneratedAt?: Date;
  checkedInAt?: Date;
  checkedOutAt?: Date;
  actualCheckInTime?: string;
  actualCheckOutTime?: string;
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  parentBookingId?: string;
  isVisitorBooking: boolean;
  visitorName?: string;
  visitorPhone?: string;
  hostUserId?: string;
  cancelledAt?: Date;
  cancellationReason?: string;
  refundStatus?: RefundStatus;
  refundAmount?: number;
  refundId?: string;
  refundProcessedAt?: Date;
  nonRefundable: boolean;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type BookingType = "hourly" | "daily" | "monthly" | "visitor" | "event";
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "cancelled"
  | "no_show"
  | "expired";

export type PaymentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "refunded"
  | "partially_refunded";
export type PaymentMethod = "card" | "wallet" | "bank_transfer" | "corporate";
export type RefundStatus =
  | "none"
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export interface RecurringPattern {
  frequency: "daily" | "weekly" | "monthly";
  daysOfWeek: number[];
  endDate?: Date;
  maxOccurrences?: number;
  skipDates: Date[];
}

// ============================================
// REFUND POLICY TYPES
// ============================================

export interface IRefundPolicy {
  _id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  tiers: RefundTier[];
  applicableZones: string[];
  applicableUserRoles: UserRole[];
  minAdvanceHours: number;
  maxAdvanceDays: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefundTier {
  _id: string;
  name: string;
  hoursBeforeBooking: number;
  refundPercentage: number;
  isNonRefundable: boolean;
}

// ============================================
// VISITOR PASS TYPES
// ============================================

export interface IVisitorPass {
  _id: string;
  bookingId: string;
  visitorId: string;
  hostUserId: string;
  lotId: string;
  validFrom: Date;
  validUntil: Date;
  qrCode: string;
  status: VisitorPassStatus;
  checkedInAt?: Date;
  checkedOutAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type VisitorPassStatus = "active" | "used" | "expired" | "cancelled";

// ============================================
// AUDIT LOG TYPES
// ============================================

export interface IAuditLog {
  _id: string;
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export type AuditAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "login"
  | "logout"
  | "book"
  | "cancel"
  | "refund"
  | "check_in"
  | "check_out"
  | "admin_action";

// ============================================
// ANALYTICS TYPES
// ============================================

export interface IAnalytics {
  lotId: string;
  date: Date;
  totalBookings: number;
  totalRevenue: number;
  occupancyRate: number;
  peakHours: number[];
  cancellationRate: number;
  noShowRate: number;
  avgDuration: number;
  evBookings: number;
  visitorBookings: number;
}

export interface DashboardStats {
  totalLots: number;
  totalSpots: number;
  availableSpots: number;
  todayBookings: number;
  todayRevenue: number;
  activeUsers: number;
  occupancyRate: number;
  pendingRefunds: number;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

// ============================================
// REQUEST/DTO TYPES
// ============================================

export interface RegisterDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  company?: string;
  department?: string;
  employeeId?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface CreateBookingDTO {
  vehicleId: string;
  lotId: string;
  zoneId?: string;
  date: string;
  startTime: string;
  endTime: string;
  isRecurring?: boolean;
  recurringPattern?: RecurringPattern;
  isVisitorBooking?: boolean;
  visitorName?: string;
  visitorPhone?: string;
  hostUserId?: string;
}

export interface CancelBookingDTO {
  bookingId: string;
  reason?: string;
}

export interface UpdateBookingDTO {
  date?: string;
  startTime?: string;
  endTime?: string;
  vehicleId?: string;
}

export interface CreateVehicleDTO {
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  color: string;
  vehicleType: VehicleType;
  isElectric: boolean;
  evChargerRequired?: boolean;
  registrationExpiry: string;
  isDefault?: boolean;
}

export interface UpdateVehicleDTO extends Partial<CreateVehicleDTO> {
  isActive?: boolean;
}

export interface CreateParkingLotDTO {
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  description?: string;
  images?: string[];
  totalSpots: number;
  hourlyRate: number;
  dailyRate: number;
  monthlyRate: number;
  amenities?: string[];
  operatingHours?: OperatingHours;
}

export interface CreateParkingZoneDTO {
  lotId: string;
  name: string;
  type: ZoneType;
  totalSpots: number;
  hourlyRate: number;
  description?: string;
  amenities?: string[];
  restrictions?: ZoneRestriction[];
}

export interface RefundPolicyDTO {
  name: string;
  description?: string;
  isDefault?: boolean;
  tiers: Omit<RefundTier, "_id">[];
  applicableZones?: string[];
  applicableUserRoles?: UserRole[];
  minAdvanceHours?: number;
  maxAdvanceDays?: number;
}

// ============================================
// WEBHOOK TYPES
// ============================================

export interface RinggitPayWebhookPayload {
  event:
    | "payment.success"
    | "payment.failed"
    | "refund.success"
    | "refund.failed";
  transactionId: string;
  amount: number;
  currency: string;
  status: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface RinggitPayRefundRequest {
  transactionId: string;
  amount: number;
  reason?: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface INotification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}

export type NotificationType =
  | "booking_confirmed"
  | "booking_cancelled"
  | "booking_reminder"
  | "check_in"
  | "check_out"
  | "refund_processed"
  | "visitor_arrival"
  | "system";

// ============================================
// CARPOOL TYPES
// ============================================

export interface ICarpoolGroup {
  _id: string;
  name: string;
  description?: string;
  origin: {
    address: string;
    coordinates: { lat: number; lng: number };
  };
  destination: {
    address: string;
    coordinates: { lat: number; lng: number };
  };
  departureTime: string;
  daysOfWeek: number[];
  maxMembers: number;
  members: CarpoolMember[];
  createdBy: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CarpoolMember {
  userId: string;
  role: "driver" | "passenger";
  joinedAt: Date;
}
