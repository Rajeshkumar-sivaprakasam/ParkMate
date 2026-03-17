# 🚗 ParkMate - Corporate Parking Management System

## Full Walkthrough Guide

Welcome to **ParkMate**, a comprehensive corporate parking management system built with React, Node.js, Express, and MongoDB.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Getting Started](#getting-started)
3. [User Features Walkthrough](#user-features-walkthrough)
4. [Admin Features Walkthrough](#admin-features-wthrough)
5. [API Endpoints](#api-endpoints)
6. [Key Features Explained](#key-features-explained)
7. [Configuration](#configuration)

---

## Project Overview

### Tech Stack

| Layer          | Technology                        |
| -------------- | --------------------------------- |
| Frontend       | React + TypeScript + Tailwind CSS |
| Backend        | Node.js + Express + TypeScript    |
| Database       | MongoDB + Mongoose                |
| Authentication | JWT                               |
| Email          | Nodemailer (SMTP)                 |
| Payment        | RinggitPay Integration            |

### Project Structure

```
kilo-car/
├── backend/                 # Express API server
│   ├── src/
│   │   ├── config/        # Configuration
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Auth, rate limiting
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utilities
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── stores/       # Zustand stores
│   │   └── App.tsx       # Main app
│   └── package.json
└── shared/                # Shared TypeScript types
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install shared types
cd ../shared
npm install
```

### Environment Setup

1. Copy `.env.example` to `.env` in backend folder
2. Configure your MongoDB connection
3. Set up SMTP for emails (or use Gmail)
4. Configure RinggitPay keys (for payment processing)

```env
# Backend .env
MONGODB_URI=mongodb://localhost:27017/kilo-car-parking
JWT_SECRET=your-secret-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FRONTEND_URL=http://localhost:5173
```

### Running the Application

```bash
# Terminal 1 - Backend (port 5000)
cd backend
npm run dev

# Terminal 2 - Frontend (port 5173)
cd frontend
npm run dev
```

---

## User Features Walkthrough

### 1. Registration & Login

1. **Register**: Navigate to `/register`
   - Enter email, password, name, phone
   - Optionally add company name and employee ID
   - Click "Create Account"

2. **Login**: Navigate to `/login`
   - Enter credentials
   - JWT token is stored for session management

### 2. Browse Parking Lots

1. Navigate to Home page (`/`)
2. Search by location or browse featured lots
3. Filter by amenities (EV Charging, CCTV, Security)
4. View lot details:
   - Address and directions
   - Available/total spots
   - Hourly/daily rates
   - Operating hours
   - Amenities

### 3. Book a Parking Space

1. Select a parking lot
2. Choose date and time
3. Select your vehicle (add new if needed)
4. Choose booking type (hourly/daily/monthly)
5. **If lot requires admin approval**: Status = "Pending Approval"
6. Review and confirm
7. Payment processing via RinggitPay
8. **If approved**: Receive QR code and passcode
9. **If pending**: Wait for admin approval

**Booking Flow:**

```
Search Lot → Select Date/Time → Choose Vehicle → Confirm → Payment → QR Code
```

### 4. Manage Bookings

1. Navigate to `/bookings`
2. View all bookings (upcoming, past, cancelled)
3. **Check-in**: Use QR code or passcode at entry
4. **Check-out**: Complete parking session
5. **Cancel**: Request cancellation (refund calculated automatically)

### 5. Refund Calculation

The system automatically calculates refunds based on policy:

| Time Before Booking | Refund |
| ------------------- | ------ |
| > 24 hours          | 100%   |
| 12-24 hours         | 50%    |
| < 12 hours          | 0%     |

### 6. Calendar Sync

Export bookings to your calendar:

- Navigate to booking details
- Click "Add to Calendar"
- Download .ics file
- Import to Google Calendar, Outlook, or Apple Calendar

### 7. Download Invoice

1. Navigate to booking details
2. Click "Download Invoice"
3. View HTML invoice with:
   - Booking details
   - Payment information
   - Tax breakdown

---

## Admin Features Walkthrough

### Access Admin Dashboard

Navigate to `/admin` (requires admin role)

### 1. Dashboard Overview

View real-time statistics:

- Today's bookings
- Today's revenue
- Active users
- Occupancy rate
- Monthly performance
- Top performing lots

### 2. Manage Bookings

- View all bookings across lots
- Filter by status, date, lot
- Cancel bookings
- Process refunds

### 3. Manage Parking Lots

1. Navigate to "Parking Lots" tab
2. **Add New Lot**:
   - Name and address
   - Total spots and hourly rate
   - Operating hours
   - Amenities
3. **Edit Lot**: Update details
4. **Delete Lot**: Soft delete (mark inactive)

### 4. Manage Refund Policies

1. Navigate to "Refund Policies" tab
2. **Create Policy**:
   - Policy name
   - Tiered refund rules:
     - Hours before booking
     - Refund percentage
     - Non-refundable option
   - Applicable zones
   - Set as default
3. **Edit Policy**: Modify tiers
4. **Delete Policy**: Remove (cannot delete default)

### 5. Manage Organizations

1. Navigate to "Organizations" tab
2. **Create Organization**:
   - Organization name and code
   - Contact information
   - Subscription plan
   - Settings (public booking, approval required, etc.)
3. **Manage Subscription**:
   - Plan levels: Free, Basic, Premium, Enterprise
   - User limits
   - Parking lot limits

### 6. Analytics & Reports

- Revenue trends (daily, weekly, monthly)
- Occupancy rates by hour
- Cancellation rates
- Top performing lots
- User booking statistics

---

## API Endpoints

### Authentication

| Method | Endpoint             | Description       |
| ------ | -------------------- | ----------------- |
| POST   | `/api/auth/register` | Register new user |
| POST   | `/api/auth/login`    | User login        |
| POST   | `/api/auth/logout`   | User logout       |
| POST   | `/api/auth/refresh`  | Refresh token     |

### Bookings

| Method | Endpoint                      | Description         |
| ------ | ----------------------------- | ------------------- |
| GET    | `/api/bookings`               | Get user's bookings |
| POST   | `/api/bookings`               | Create booking      |
| GET    | `/api/bookings/:id`           | Get booking details |
| POST   | `/api/bookings/:id/cancel`    | Cancel booking      |
| POST   | `/api/bookings/:id/check-in`  | Check in            |
| POST   | `/api/bookings/:id/check-out` | Check out           |

### Parking

| Method | Endpoint           | Description        |
| ------ | ------------------ | ------------------ |
| GET    | `/api/parking`     | List parking lots  |
| GET    | `/api/parking/:id` | Get lot details    |
| POST   | `/api/parking`     | Create lot (admin) |
| PUT    | `/api/parking/:id` | Update lot (admin) |
| DELETE | `/api/parking/:id` | Delete lot (admin) |

### Vehicles

| Method | Endpoint            | Description        |
| ------ | ------------------- | ------------------ |
| GET    | `/api/vehicles`     | List user vehicles |
| POST   | `/api/vehicles`     | Add vehicle        |
| PUT    | `/api/vehicles/:id` | Update vehicle     |
| DELETE | `/api/vehicles/:id` | Delete vehicle     |

### Refund Policies (Admin)

| Method | Endpoint                               | Description   |
| ------ | -------------------------------------- | ------------- |
| GET    | `/api/refund-policies`                 | List policies |
| POST   | `/api/refund-policies`                 | Create policy |
| PUT    | `/api/refund-policies/:id`             | Update policy |
| DELETE | `/api/refund-policies/:id`             | Delete policy |
| POST   | `/api/refund-policies/:id/set-default` | Set default   |

### Analytics (Admin)

| Method | Endpoint                          | Description      |
| ------ | --------------------------------- | ---------------- |
| GET    | `/api/analytics/dashboard`        | Dashboard stats  |
| GET    | `/api/analytics/revenue`          | Revenue data     |
| GET    | `/api/analytics/occupancy/hourly` | Hourly occupancy |
| GET    | `/api/analytics/top-lots`         | Top lots         |
| GET    | `/api/analytics/trends`           | Booking trends   |

### Additional Features

| Method | Endpoint                        | Description      |
| ------ | ------------------------------- | ---------------- |
| GET    | `/api/invoices/:bookingId`      | Get invoice      |
| GET    | `/api/invoices/:bookingId/html` | Invoice HTML     |
| GET    | `/api/calendar/booking/:id`     | ICS export       |
| GET    | `/api/calendar/my-bookings`     | All bookings ICS |
| POST   | `/api/webhooks/ringgitpay`      | Payment webhook  |

---

## Key Features Explained

### 1. Smart Booking Engine

Supports recurring bookings:

- Daily, weekly, or monthly patterns
- Specific days of week selection
- Max occurrences limit
- Skip specific dates

### 2. Dynamic Refund Policy

Admin can create custom refund policies:

- Multiple tiers with different percentages
- Zone-specific policies
- User role-based policies
- Non-refundable option

### 3. Email Notifications

Automatic emails sent for:

- Booking confirmation
- Cancellation with refund details
- Refund processed/failed
- Check-in reminders
- Admin alerts

### 4. Payment Integration

RinggitPay integration:

- Secure payment processing
- Webhook notifications
- Automatic status updates
- Refund processing

### 5. Multi-Organization Support

- Create multiple organizations
- Subscription plans (Free/Basic/Premium/Enterprise)
- Organization-specific settings
- User allocation per organization

### 6. Security Features

- JWT authentication
- Role-based access control
- Rate limiting
- Webhook signature validation
- Input validation
- Audit logging

---

## Configuration

### Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/kilo-car

# JWT
JWT_SECRET=your-secret
JWT_EXPIRES_IN=7d

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email@example.com
SMTP_PASS=password

# Payment (RinggitPay)
RINGGITPAY_API_URL=https://api.ringgitpay.com
RINGGITPAY_API_KEY=key
RINGGITPAY_WEBHOOK_SECRET=secret

# Frontend
FRONTEND_URL=http://localhost:5173
```

### Making an Admin User

```javascript
// Via MongoDB shell
db.users.updateOne(
  { email: "admin@domain.com" },
  { $set: { role: "admin" } }
)

// Or via API (superadmin only)
POST /api/users/:id/role
{ "role": "admin" }
```

---

## Testing the Application

### Manual Test Flow

1. **Register** as a new user
2. **Add a vehicle** in the Vehicles page
3. **Browse parking lots** on the home page
4. **Create a booking** for >24 hours ahead
5. **Cancel the booking** - should get 100% refund
6. **Create another booking** for <12 hours ahead
7. **Try to cancel** - should be blocked (0% refund)
8. **Export to calendar** - download ICS file

### Admin Tests

1. Login as admin
2. Navigate to `/admin`
3. View dashboard statistics
4. Create a new refund policy
5. Add a new parking lot
6. View analytics data

---

## Support & Documentation

- Frontend runs on: `http://localhost:5173`
- Backend API runs on: `http://localhost:5000`
- Health check: `GET /health`

For more details, refer to the inline code documentation or API Swagger documentation.
