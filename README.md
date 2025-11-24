# Emobo Backend - E-Commerce API

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Express](https://img.shields.io/badge/Express-4.x-lightgrey)
![Prisma](https://img.shields.io/badge/Prisma-5.x-blueviolet)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue)

RESTful API backend for Emobo e-commerce platform built with Express.js, Prisma ORM, and PostgreSQL.

</div>

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Development](#development)

---

## ✨ Features

### Authentication & Authorization
- ✅ JWT-based authentication (access + refresh tokens)
- ✅ Role-based access control (Admin, Customer)
- ✅ Secure password hashing with bcrypt
- ✅ Token refresh mechanism
- ✅ Logout with token revocation

### Product Management
- ✅ CRUD operations for products
- ✅ Product search and filtering
- ✅ Stock management
- ✅ Multiple product images support
- ✅ SKU-based product identification

### Order Management
- ✅ Create orders with multiple items
- ✅ Order status tracking (PENDING → PROCESSING → SHIPPED → COMPLETED)
- ✅ Order history for customers
- ✅ Admin order management
- ✅ Tracking number support

### Payment Processing
- ✅ Multiple payment gateway support (Mock, Duitku, Flip)
- ✅ QRIS payment code generation
- ✅ Payment webhook handling
- ✅ Payment status tracking
- ✅ Automatic order status updates

### Customer Features
- ✅ User profile management
- ✅ Order history viewing
- ✅ Order detail tracking

### Admin Features
- ✅ Product management (create, update, delete)
- ✅ Order management and status updates
- ✅ Customer listing
- ✅ Payment monitoring

---

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Runtime** | Node.js 18+ |
| **Language** | TypeScript |
| **Framework** | Express.js |
| **ORM** | Prisma |
| **Database** | PostgreSQL |
| **Authentication** | JWT (jsonwebtoken) |
| **Validation** | Zod |
| **Password Hashing** | bcrypt |
| **Payment** | Duitku, Flip (optional) |

---

## 🏗 Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│     Express Router          │
├─────────────────────────────┤
│  ┌─────────────────────┐   │
│  │  Auth Middleware    │   │
│  └─────────────────────┘   │
├─────────────────────────────┤
│       Controllers           │
│  ┌──────┬──────┬────────┐  │
│  │ Auth │ Prod │ Order  │  │
│  └──────┴──────┴────────┘  │
├─────────────────────────────┤
│        Services             │
│  ┌──────┬──────┬────────┐  │
│  │ Auth │ Prod │ Payment│  │
│  └──────┴──────┴────────┘  │
├─────────────────────────────┤
│      Prisma Client          │
└──────────┬──────────────────┘
           │
           ▼
    ┌──────────────┐
    │  PostgreSQL  │
    └──────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or pnpm

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create `.env` file:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/emobo_db"
JWT_ACCESS_SECRET="your-access-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
PORT=5000
NODE_ENV=development
```

4. **Set up database**
```bash
# Create database
createdb emobo_db

# Run migrations
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

5. **Start development server**
```bash
npm run dev
```

Server will start at `http://localhost:5000`

---

## 🔐 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `JWT_ACCESS_SECRET` | Secret key for access tokens | Random string (32+ chars) |
| `JWT_REFRESH_SECRET` | Secret key for refresh tokens | Random string (32+ chars) |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` / `production` |
| `DUITKU_MERCHANT_CODE` | Duitku merchant code (optional) | `DS12345` |
| `DUITKU_API_KEY` | Duitku API key (optional) | `your-api-key` |
| `DUITKU_CALLBACK_URL` | Payment webhook URL | `https://api.example.com/payments/callback` |

---

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Endpoints

#### Authentication
```
POST   /auth/register        - Register new user
POST   /auth/login           - Login user
POST   /auth/refresh         - Refresh access token
POST   /auth/logout          - Logout user
```

#### Products
```
GET    /products             - Get all products (with filters)
GET    /products/:id         - Get product by ID
POST   /products             - Create product (Admin only)
PUT    /products/:id         - Update product (Admin only)
DELETE /products/:id         - Delete product (Admin only)
```

#### Orders
```
POST   /orders               - Create new order
GET    /orders               - Get all orders (Admin only)
GET    /orders/:id           - Get order by ID
PATCH  /orders/:id/status    - Update order status (Admin only)
```

#### Payments
```
POST   /payments             - Create payment
POST   /payments/callback    - Payment webhook callback
GET    /payments/:id         - Get payment status
```

#### Customers
```
GET    /customers/profile    - Get customer profile
PUT    /customers/profile    - Update customer profile
GET    /customers/orders     - Get customer orders
```

### Authentication

Most endpoints require JWT authentication. Include access token in cookie or Authorization header:

```bash
# Cookie-based (automatic)
Cookie: accessToken=your-jwt-token

# Header-based
Authorization: Bearer your-jwt-token
```

---

## 🗄 Database Schema

### Core Models

**User**
- Manages user accounts (customers and admins)
- Stores hashed passwords
- Linked to orders and refresh tokens

**Product**
- Product catalog with SKU, pricing, stock
- Supports multiple images
- Linked to order items

**Order**
- Customer orders with status tracking
- Contains shipping address and phone
- Linked to order items and payments

**OrderItem**
- Individual items within an order
- Stores quantity and unit price snapshot

**Payment**
- Payment transactions with provider integration
- QRIS code storage
- Webhook-based status updates

**RefreshToken**
- Manages JWT refresh tokens
- Supports token revocation

See [ERD Documentation](../docs/ERD.md) for detailed schema.

---

## 📁 Project Structure

```
backend/
├── prisma/
│   ├── migrations/          # Database migrations
│   └── schema.prisma        # Database schema
├── src/
│   ├── middleware/          # Auth, error handling
│   ├── modules/
│   │   ├── auth/           # Auth controller, service, routes
│   │   ├── products/       # Product CRUD
│   │   ├── orders/         # Order management
│   │   ├── payments/       # Payment processing
│   │   └── customers/      # Customer features
│   ├── routes/             # API routes
│   ├── utils/              # Helper functions
│   ├── app.ts              # Express app setup
│   └── server.ts           # Server entry point
├── .env                     # Environment variables
├── package.json
└── tsconfig.json
```

---

## 💻 Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server with hot-reload

# Production
npm run build           # Build TypeScript
npm start              # Start production server

# Database
npx prisma studio      # Open database GUI
npx prisma migrate dev # Create new migration
npx prisma generate    # Regenerate Prisma Client

# Utilities
npm run format         # Format code
npm run lint          # Lint code
```

### Adding New Features

1. **Create module structure**
```bash
src/modules/feature/
├── feature.controller.ts
├── feature.service.ts
└── feature.route.ts
```

2. **Define controller** - Handle HTTP requests
3. **Define service** - Business logic
4. **Define routes** - API endpoints
5. **Register routes** in `app.ts`
6. **Update Prisma schema** if needed
7. **Create migration** - `npx prisma migrate dev`

### Database Migrations

```bash
# Create migration
npx prisma migrate dev --name feature_name

# Apply migrations
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset
```

---

## 🧪 Testing

### Manual API Testing

Use Prisma Studio to manage test data:
```bash
npx prisma studio
```

Test endpoints with curl:
```bash
# Health check
curl http://localhost:5000/api/v1/health

# Register user
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

---

## 🐛 Troubleshooting

### Common Issues

**Prisma Client not generated**
```bash
npx prisma generate
```

**Database connection error**
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Ensure database exists

**Migration errors**
```bash
npx prisma migrate reset    # Reset and reapply all migrations
```

**Port already in use**
```bash
npx kill-port 5000          # Kill process on port 5000
```

---

## 📖 Additional Documentation

- [ERD](../docs/ERD.md) - Database entity relationships
- [Class Diagram](../docs/CLASS_DIAGRAM.md) - System architecture
- [Sequence Diagrams](../docs/SEQUENCE_DIAGRAM.md) - Request flows
- [How to Run](../docs/HOW_TO_RUN.md) - Complete setup guide

---

## 🔒 Security

- Passwords hashed with bcrypt (salt rounds: 10)
- JWT tokens with expiration
- Role-based access control
- SQL injection prevention via Prisma
- Input validation with Zod
- CORS configuration
- Refresh token rotation

---

## 🚀 Deployment

### Production Checklist

- [ ] Set strong JWT secrets
- [ ] Use production database
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up environment variables
- [ ] Run migrations
- [ ] Configure payment webhooks
- [ ] Set up monitoring
- [ ] Configure rate limiting
- [ ] Set up backups

### Recommended Platforms

- **Railway** - Easy deployment with database
- **Heroku** - Classic PaaS
- **DigitalOcean** - VPS deployment
- **AWS/GCP** - Enterprise solutions

---

## 📄 License

This project is part of a thesis/skripsi project.

---

## 👥 Contributors

Built as part of academic project at [Your University]

---

**For detailed setup instructions, see [HOW_TO_RUN.md](../docs/HOW_TO_RUN.md)**
