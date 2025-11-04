# Harvest Hub 🌱

> A modern farm-to-consumer marketplace connecting local farmers directly with customers. Buy fresh produce, manage subscriptions, and support local agriculture.

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-green)](https://neon.tech/)

## 📖 Overview

Harvest Hub is a full-stack e-commerce platform that bridges the gap between local farmers and consumers. The platform enables farmers to sell their produce directly to customers, manage inventory, create subscription packages, and track orders. Customers can browse products, place orders, subscribe to recurring deliveries, and manage their accounts seamlessly.

### Key Highlights

- **Dual User Experience**: Separate dashboards for farmers and customers
- **Subscription System**: Weekly, bi-weekly, and monthly subscription plans with pre-made or custom packages
- **Secure Authentication**: Email/password and Google OAuth
- **Payment Integration**: Secure checkout with saved cards and addresses
- **Guest Checkout**: Purchase without account creation
- **Order Management**: Complete order tracking for both customers and farmers

---

## ✨ Features

### For Customers 👥

- **Browse & Shop**: Browse products from local farms with search and category filters
- **Shopping Cart**: Add products, adjust quantities, and manage cart items
- **Checkout**: Guest or authenticated checkout with saved addresses and payment methods
- **Subscriptions**: 
  - Choose from weekly, bi-weekly, or monthly plans
  - Select pre-made packages or create custom product selections
  - Manage delivery preferences and dates
- **Order Management**: View order history, track deliveries, and manage subscriptions
- **Profile Management**: Save delivery addresses, payment methods, and personal information
- **Farms**: Browse farms and view their products

### For Farmers 👨‍🌾

- **Dashboard**: View orders and subscriptions
- **Product Management**: Add, edit, and manage products with pricing and inventory
- **Package Creation**: Create subscription packages for different plan types
- **Order Management**: View and process customer orders and subscriptions
- **Farm Profile**: Manage farm information, contact details, and descriptions
- **Settings**: Update farm and personal information

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Lucide React
- **State Management**: React Context API
- **Forms**: React Hook Form with Zod validation

### Backend
- **Runtime**: Next.js API Routes (Node.js)
- **Database**: PostgreSQL (Neon)
- **ORM/Query**: pg (PostgreSQL client)
- **Authentication**: JWT, Argon2/Bcrypt for password hashing
- **Email**: Nodemailer with Brevo (Sendinblue) SMTP

### External Services
- **OAuth**: Google OAuth 2.0
- **Email**: Brevo (Sendinblue)

### Development Tools
- **Testing**: Jest, Supertest
- **Linting**: ESLint
- **Type Checking**: TypeScript

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Neon recommended)
- Google OAuth credentials (for Google sign-in)
- Brevo account (for email sending)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cs2001-2024-25-group-37-main
   ```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env.local` and fill in your values:
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
   
   # Authentication
   JWT_SECRET=your-jwt-secret-key
   NEXTAUTH_SECRET=your-nextauth-secret
   NEXTAUTH_URL=http://localhost:3000
   
   # Google OAuth
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   
   # Email (Brevo)
   BREVO_SMTP_USERNAME=your-brevo-username
   BREVO_SMTP_PASSWORD=your-brevo-password
   SENDER_EMAIL=noreply@yourdomain.com
   
   # Base URL
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

4. **Set up the database**
   ```bash
   # Seed the database with initial data (farms, products, etc.)
   npm run seed
   
   # Link farms to farmer accounts (optional)
   npm run link-farms
   ```

5. **Run the development server**
```bash
npm run dev
```

6. **Open your browser**
   ```
   http://localhost:3000
   ```

---

## 📁 Project Structure

```
harvest-hub/
├── app/                          # Next.js App Router
│   ├── (nav-foot)/              # Route group with navigation & footer
│   │   ├── cart/                # Shopping cart page
│   │   ├── checkout/            # Checkout page
│   │   ├── contact/             # Contact page
│   │   ├── dashboard/           # User dashboards
│   │   │   ├── farmer/          # Farmer dashboard
│   │   │   │   ├── orders/      # Order management
│   │   │   │   ├── products/    # Product management
│   │   │   │   ├── packages/    # Package management
│   │   │   │   └── settings/    # Farmer settings
│   │   │   ├── orders/          # Customer orders
│   │   │   ├── profile/         # User profile & settings
│   │   │   └── subscriptions/   # User subscriptions
│   │   ├── subscriptions/       # Subscription pages
│   │   ├── subscription-delivery-details/  # Subscription checkout
│   │   └── user-registration/   # User registration
│   ├── api/                     # API routes
│   │   ├── auth/                # Authentication
│   │   ├── farmer/              # Farmer endpoints
│   │   ├── user/                # User endpoints
│   │   ├── subscription/        # Subscription endpoints
│   │   ├── orders/              # Order endpoints
│   │   └── ...
│   ├── components/              # React components
│   ├── context/                 # React Context providers
│   ├── hooks/                   # Custom React hooks
│   ├── types/                   # TypeScript types
│   ├── farms/                   # Farm pages
│   ├── products/                # Product pages
│   └── ...
├── lib/                         # Utility libraries
│   ├── db.ts                    # Database connection
│   ├── email.ts                 # Email utilities
│   └── ...
├── public/                      # Static assets
├── tests/                       # Test files
├── seedDatabase.ts              # Database seeding script
├── linkFarmsToFarmers.ts        # Link farms to farmers script
└── package.json
```

---

## 🔑 Key Features Explained

### Authentication System

- **User Registration**: Email/password or Google OAuth
- **Account Types**: Separate user types (customer/farmer) with different permissions
- **Session Management**: JWT-based authentication with secure token storage
- **Guest Access**: Browse and checkout without account creation

### Subscription System

- **Plan Types**: Weekly, bi-weekly, or monthly delivery options
- **Package Types**:
  - **Pre-made**: Farmers create curated packages
  - **Custom**: Customers select individual products
- **Delivery Management**: Customers choose delivery days and provide instructions
- **Billing**: Flexible billing cycles (weekly/monthly charges)

### Payment & Checkout

- **Guest Checkout**: Allows purchases without account creation
- **Saved Addresses**: Manage multiple delivery addresses with Amazon-style selection
- **Saved Cards**: Securely store payment methods for faster checkout
- **Address Management**: Add, edit, delete, and set default addresses
- **Card Management**: Save, delete, and manage payment methods

### Order Management

- **Order Tracking**: View order status and history
- **Order Details**: Detailed order information with delivery addresses
- **Farmer View**: Farmers see orders for their products/packages
- **Customer View**: Customers see all their orders and subscriptions
- **Subscription Management**: View and manage active subscriptions

---

## 🧪 Testing

Run tests with Jest:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests serially
npm run test:serial

# Run specific test suite
npm run test:subscription
```

Test files are located in the `tests/` directory.

---

## 🚢 Deployment

### Environment Variables

Ensure all required environment variables are set in your deployment platform:

- **Vercel**: Add variables in Project Settings → Environment Variables
- **Netlify**: Add variables in Site Settings → Environment Variables
- **Other Platforms**: Configure according to platform documentation

### Build Commands

```bash
# Production build
npm run build

# Start production server
npm start
```

### Database Setup

For production, use a managed PostgreSQL database (Neon, Vercel Postgres, etc.) and ensure:
- SSL connections are enabled (`sslmode=require`)
- Connection pooling is configured
- Database is seeded with initial data

---

## 🔒 Security

- **Environment Variables**: All sensitive data stored in environment variables
- **Password Hashing**: Argon2/Bcrypt for secure password storage
- **JWT Tokens**: Secure token-based authentication
- **SQL Injection Prevention**: Parameterized queries throughout
- **Input Validation**: Zod schemas for request validation
- **Card Encryption**: Encrypted storage of payment card information

---

## 📝 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production bundle
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run Jest tests
- `npm run seed` - Seed database with initial data
- `npm run link-farms` - Link farms to farmer accounts

---

## 🐛 Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct and includes `sslmode=require`
- Check database credentials and network access
- Ensure connection pooling is configured for Neon

### Authentication Errors

- Verify JWT_SECRET is set
- Check Google OAuth credentials are correct
- Ensure session cookies are enabled

### Build Errors

- Clear `.next` directory: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run lint`

---

## 📄 License

This project is part of a university coursework project. All rights reserved.

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
