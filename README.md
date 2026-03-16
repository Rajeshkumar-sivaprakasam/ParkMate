# 🚗 Kilo Car - Enterprise Parking Management System

A production-ready, full-stack parking management web application for corporate use.

## 📋 Overview

Kilo Car is a comprehensive parking management system built with modern technologies:

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB (Mongoose ODM)

## ✨ Features

### Core Features

- ✅ User authentication (JWT + bcrypt)
- ✅ Role-based access control (User, Admin, Superadmin)
- ✅ Parking lot search and availability
- ✅ Booking management (create, cancel, view)
- ✅ Vehicle management (multiple vehicles per user)
- ✅ Dynamic refund policy engine

### Advanced Features

- 🔄 Recurring booking engine
- 📅 Calendar integration (ICS)
- 🛡️ QR code generation for gate entry
- 🔋 EV slot management
- 👥 Visitor pass system
- 📊 Admin dashboard with analytics
- 📈 Real-time occupancy tracking

## 🏗️ Project Structure

```
/parking-app
├── backend/               # Express + MongoDB + TypeScript
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/  # Route controllers
│   │   ├── middleware/   # Auth, error handling
│   │   ├── models/      # Mongoose models
│   │   └── routes/      # API routes
│   └── package.json
│
├── frontend/              # React + TypeScript + Tailwind
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── stores/      # State management
│   │   └── utils/       # Utility functions
│   └── package.json
│
├── shared/                # Shared types/interfaces
│   └── src/
│
├── package.json          # Root package.json (monorepo)
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB 6+
- npm or yarn

### Installation

1. Clone the repository:

```bash
cd kilo-car
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

```bash
cp backend/.env.example backend/.env
# Edit .env with your configuration
```

4. Start the development servers:

```bash
npm run dev
```

The application will be available at:

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 📖 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update user profile (protected)

### Parking Endpoints

- `GET /api/parking/lots` - Get all parking lots
- `GET /api/parking/lots/:id` - Get parking lot details
- `GET /api/parking/lots/:id/availability` - Check availability

### Booking Endpoints

- `GET /api/bookings` - Get user's bookings (protected)
- `POST /api/bookings` - Create booking (protected)
- `POST /api/bookings/:id/cancel` - Cancel booking (protected)
- `POST /api/bookings/:id/check-in` - Check in (protected)
- `POST /api/bookings/:id/check-out` - Check out (protected)

### Vehicle Endpoints

- `GET /api/vehicles` - Get user's vehicles (protected)
- `POST /api/vehicles` - Add vehicle (protected)
- `PUT /api/vehicles/:id` - Update vehicle (protected)
- `DELETE /api/vehicles/:id` - Delete vehicle (protected)

## 🔐 Security Features

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Role-based access control
- Rate limiting
- CORS configuration
- Helmet security headers
- Input validation with express-validator

## 🧪 Testing

```bash
# Run backend tests
npm run test --workspace=backend

# Run frontend tests
npm run test --workspace=frontend
```

## 📦 Deployment

### Docker

```bash
docker-compose up -d
```

### Manual

1. Build the application:

```bash
npm run build
```

2. Start production servers:

```bash
npm run start
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
