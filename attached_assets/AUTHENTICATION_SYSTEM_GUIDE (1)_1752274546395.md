
# SiZu GiftCard Platform - Authentication System & Routes Guide

## Table of Contents
1. [Authentication System Overview](#authentication-system-overview)
2. [Route Categories](#route-categories)
3. [Authentication Flow Details](#authentication-flow-details)
4. [Current Issues & Solutions](#current-issues--solutions)
5. [Configuration Guide](#configuration-guide)
6. [System Architecture](#system-architecture)

## Authentication System Overview

Your SiZu GiftCard Platform implements a **dual authentication system** designed for your specific use case:

- **You (Admin)**: Single admin user with Replit authentication
- **Customers**: Public users with traditional email/password registration

### 1. Admin Authentication (Replit Auth)
- **Method**: Replit's built-in authentication system
- **User**: Single admin user (you)
- **Login**: Via Replit OAuth (`/api/login`)
- **Management**: `server/replitAuth.ts`
- **Role**: `admin` in database
- **Access**: Full platform control

### 2. Customer Authentication (Custom System)
- **Method**: Traditional email/password system
- **Users**: Your customers
- **Registration**: `/api/auth/register`
- **Login**: `/api/auth/login`
- **Management**: `server/services/AuthService.ts`
- **Role**: `customer` in database
- **Access**: Limited to their own data

## Route Categories

### 🔐 Admin-Only Routes (Require Replit Auth + Admin Role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/user` | Get current admin user info |
| POST | `/api/giftcards` | Create gift cards |
| GET | `/api/giftcards` | View all gift cards |
| GET | `/api/admin/giftcards` | Alternative admin gift cards endpoint |
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/transactions` | All transactions |
| GET | `/api/admin/fraud-alerts` | Fraud monitoring |
| POST | `/api/admin/fraud-alerts/:id/resolve` | Resolve fraud alerts |
| GET | `/api/admin/fees` | Fee configurations |
| POST | `/api/admin/fees` | Create fee configs |
| PUT | `/api/admin/fees/:id` | Update fee configs |
| DELETE | `/api/admin/fees/:id` | Delete fee configs |

### 👤 Customer-Only Routes (Require Customer Session Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Customer registration |
| POST | `/api/auth/login` | Customer login |
| POST | `/api/auth/logout` | Customer logout |
| GET | `/api/auth/customer` | Check customer session |
| GET | `/api/auth/verify/:token` | Email verification |
| POST | `/api/auth/forgot-password` | Password reset request |
| POST | `/api/auth/reset-password` | Password reset |
| GET | `/api/giftcards/mine` | User's gift cards |
| GET | `/api/user/orders` | User's order history |
| GET | `/api/user/orders/:orderId` | Specific order details |
| GET | `/api/cards` | User's saved payment cards |
| GET | `/api/user/saved-cards` | Alternative saved cards endpoint |
| POST | `/api/cards` | Add new payment card |
| DELETE | `/api/cards/:id` | Delete payment card |
| PUT | `/api/cards/:id/default` | Set default payment card |

### 🌐 Public Routes (No Authentication Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/giftcards/balance` | Check gift card balance |
| POST | `/api/giftcards/check-balance` | Alternative balance check |
| POST | `/api/giftcards/redeem` | Redeem gift card |
| GET | `/api/receipts/:token` | View receipt |
| GET | `/api/receipts/:token/pdf` | Download receipt PDF |
| GET | `/api/fees/active` | Active fee configurations |
| POST | `/api/fees/calculate` | Calculate fees |
| GET | `/api/health` | Health check |

## Authentication Flow Details

### Admin Authentication Implementation
```typescript
// From routes.ts - Admin middleware
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const userId = req.user.claims.sub;  // Replit user ID
    const user = await storage.getUser(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: "Authorization check failed" });
  }
};
```

### Customer Authentication Implementation
```typescript
// From middleware/customerAuth.ts
export const requireCustomerAuth = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'customer') {
      return res.status(401).json({ message: "Customer authentication required" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ message: "Authentication check failed" });
  }
};
```

### Frontend Route Protection
```typescript
// From client/src/App.tsx
return (
  <Switch>
    {isLoading || !isAuthenticated ? (
      <>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/shop" component={Shop} />
        <Route path="/balance" component={Balance} />
        <Route path="/redeem" component={Redeem} />
        <Route path="/receipt-view/:token" component={ReceiptView} />
      </>
    ) : (
      <>
        <Route path="/" component={Home} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/dashboard/admin" component={AdminDashboard} />
        <Route path="/dashboard/user" component={UserDashboard} />
        <Route path="/admin/gift-cards" component={AdminGiftCards} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/transactions" component={AdminTransactions} />
        <Route path="/admin/analytics" component={AdminAnalytics} />
        <Route path="/admin/security" component={AdminSecurity} />
        <Route path="/admin/revenue" component={AdminRevenue} />
        <Route path="/admin/fees" component={AdminFeeManagement} />
        <Route path="/profile" component={Profile} />
      </>
    )}
  </Switch>
);
```

## Current Issues & Solutions

### 🚨 Critical JavaScript Errors

#### 1. React Hook Issues
```
Cannot read properties of null (reading 'useState')
```
**Solution**: Check for null React components and ensure proper component mounting.

#### 2. Missing Component Export
```
The requested module '/src/components/SideNavigation.tsx' does not provide an export named 'SideNavigation'
```
**Solution**: Fix the export statement in SideNavigation.tsx:
```typescript
// Ensure proper export
export default function SideNavigation() { ... }
// OR
export { SideNavigation };
```

#### 3. Type Errors
```
calculateTotalPrice(...).toFixed is not a function
amount.toFixed is not a function
```
**Solution**: Add proper type checking:
```typescript
const total = calculateTotalPrice(items);
const formatted = typeof total === 'number' ? total.toFixed(2) : '0.00';
```

#### 4. Undefined Variable
```
DollarSign is not defined
```
**Solution**: Import the DollarSign icon:
```typescript
import { DollarSign } from 'lucide-react';
```

### 🔧 Recommended Fixes

1. **Add null checks for React hooks**
2. **Fix component imports/exports**
3. **Add type guards for number operations**
4. **Import missing dependencies**
5. **Handle unhandled promise rejections**

## Configuration Guide

### Environment Variables Required

#### Admin (Replit Auth)
```env
REPLIT_DOMAINS=your-repl-domain.com
SESSION_SECRET=your-session-secret
```

#### Customer (Custom Auth)
```env
DATABASE_URL=your-postgresql-url
SESSION_SECRET=your-session-secret
```

#### Optional Services
```env
SQUARE_ACCESS_TOKEN=your-square-token
MAILGUN_SMTP_SERVER=smtp.mailgun.org
MAILGUN_SMTP_PORT=587
MAILGUN_SMTP_USERNAME=your-username
MAILGUN_SMTP_PASSWORD=your-password
```

### Database Schema

#### Users Table
```sql
users (
  id: string (primary key)
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'customer'
  createdAt: timestamp
  updatedAt: timestamp
)
```

#### Sessions Table
```sql
sessions (
  id: string (primary key)
  userId: string (foreign key)
  expiresAt: timestamp
  data: json
)
```

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS
- **Build Tool**: Vite

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: 
  - Replit Auth (Admin)
  - Session-based (Customers)
- **Security**: Rate limiting, CORS, helmet
- **Services**: Square, Mailgun, PDF generation, QR codes

### Key Files Structure
```
server/
├── services/
│   ├── AuthService.ts          # Customer authentication
│   ├── EmailService.ts         # Email notifications
│   ├── PDFService.ts          # Receipt generation
│   ├── QRService.ts           # QR code generation
│   └── SquareService.ts       # Payment processing
├── middleware/
│   ├── customerAuth.ts        # Customer auth middleware
│   └── security.ts            # Security middleware
├── replitAuth.ts              # Admin (Replit) authentication
├── routes.ts                  # API route definitions
└── storage.ts                 # Database operations

client/src/
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── Navbar.tsx            # Navigation bar
│   └── SideNavigation.tsx    # Side navigation
├── pages/                     # Route components
├── hooks/
│   └── useAuth.ts            # Authentication hook
└── App.tsx                   # Main application component
```

### Security Features
- **Rate Limiting**: Different limits for different endpoints
- **CORS**: Configured for your domain
- **Security Headers**: CSP, XSS protection, HSTS
- **Input Validation**: SQL injection and XSS prevention
- **Session Management**: Secure session handling
- **Role-Based Access**: Admin vs Customer permissions

### Production Checklist
- ✅ Environment variables configured
- ✅ Database schema deployed
- ✅ SSL/TLS certificates
- ✅ Rate limiting active
- ✅ Security headers configured
- ✅ Error handling implemented
- ✅ Logging configured
- ✅ Health monitoring
- ❌ JavaScript runtime errors (needs fixing)

---

## Quick Start for New Developers

1. **Admin Access**: Use Replit login button - automatically gets admin role
2. **Customer Testing**: Register via `/api/auth/register` - gets customer role
3. **Public Testing**: Use balance check and redeem features without login
4. **Development**: Fix the JavaScript errors listed above for full functionality

This dual authentication system gives you complete administrative control while providing a secure, user-friendly experience for your customers.
