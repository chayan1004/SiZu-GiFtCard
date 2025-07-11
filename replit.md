# replit.md

## Overview

This is a full-stack gift card management application built with React, Node.js, Express, and PostgreSQL. The application allows users to purchase, manage, and redeem digital gift cards with various designs and features. It includes both customer-facing functionality and admin dashboard capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Full-Stack Structure
- **Frontend**: React with TypeScript, using Vite for build tooling
- **Backend**: Node.js with Express server
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth integration with session management
- **Styling**: Tailwind CSS with shadcn/ui components

### Project Structure
```
├── client/          # React frontend application
├── server/          # Express backend application
├── shared/          # Shared schemas and types
├── attached_assets/ # Static content and documentation
└── migrations/      # Database migration files
```

## Key Components

### Frontend Architecture
- **React Router**: Using wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Express Server**: RESTful API with middleware for authentication and logging
- **Database Layer**: Drizzle ORM with connection pooling via @neondatabase/serverless
- **Authentication**: Replit Auth with session-based authentication
- **Services**: Modular service classes for Square, PDF, Email, and QR code generation

### Database Schema
- **Users**: Profile management with role-based access (admin/user)
- **Gift Cards**: Digital gift cards with designs, balances, and tracking
- **Transactions**: Complete audit trail of all gift card operations
- **Receipts**: PDF receipts with email delivery tracking
- **Fraud Alerts**: Security monitoring and alert system
- **Sessions**: Session storage for authentication

## Data Flow

### Gift Card Purchase Flow
1. User selects gift card design and amount
2. Frontend validates form data with Zod schemas
3. Backend creates gift card record and generates unique code
4. Integration with Square API for payment processing
5. PDF receipt generation with QR codes
6. Email delivery to recipient (if specified)

### Gift Card Redemption Flow
1. User enters gift card code and redemption amount
2. Backend validates code and checks available balance
3. Transaction record created with balance update
4. Real-time fraud detection and alerting
5. Receipt generation and optional email delivery

### Admin Dashboard Flow
1. Real-time statistics via WebSocket connections
2. Transaction monitoring and fraud alert management
3. Gift card inventory and user management
4. Analytics and reporting features

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database operations
- **squareup**: Payment processing integration
- **nodemailer**: Email delivery service
- **qrcode**: QR code generation for gift cards
- **pdf-lib**: PDF document generation

### UI Dependencies
- **@radix-ui/***: Accessible UI component primitives
- **@tanstack/react-query**: Server state management
- **framer-motion**: Animation library
- **tailwindcss**: Utility-first CSS framework

### Development Dependencies
- **vite**: Fast build tool and development server
- **typescript**: Type safety and developer experience
- **drizzle-kit**: Database schema management and migrations

## Deployment Strategy

### Build Process
1. Frontend builds to `dist/public` directory
2. Backend builds to `dist/index.js` with ESM format
3. Database migrations applied via `drizzle-kit push`

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **SQUARE_ACCESS_TOKEN**: Square payment integration
- **MAILGUN_SMTP_***: Email service configuration
- **SESSION_SECRET**: Session encryption key
- **REPLIT_DOMAINS**: Authentication domain configuration

### Production Deployment
- Single-server deployment with static file serving
- Database migrations handled automatically
- Session storage in PostgreSQL
- Error handling and logging throughout the stack

### Development Features
- Hot module replacement via Vite
- Real-time error overlay for debugging
- TypeScript compilation checking
- Database schema synchronization

## Recent Changes

### July 11, 2025 - Browser Compatibility & Error Resolution
- **Browser Dependencies**: Updated browserslist configuration for modern browser support
  - Current coverage: 93.59% of global users
  - Supports Chrome 85+, Firefox 85+, Safari 14+, Edge 85+
  - Mobile support: iOS 14+, Android 6+
  - Excluded outdated browsers (IE 11, Opera Mini)
- **Error Resolution**: Fixed all DOMException errors and development tool conflicts
  - Disabled problematic Eruda development tools
  - Added comprehensive error boundaries and global error handling
  - Resolved unhandled promise rejections
  - Enhanced camera access error handling for QR scanner
- **Dependency Status**: Browser compatibility data is 9 months old but functional
  - caniuse-lite@1.0.30001677 (functional, update blocked by dependency conflicts)
  - Application performance unaffected by outdated browser data
  - Modern browser features and CSS autoprefixing working correctly