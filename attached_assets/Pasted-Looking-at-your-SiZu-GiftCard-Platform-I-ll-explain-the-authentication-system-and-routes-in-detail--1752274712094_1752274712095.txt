Looking at your SiZu GiftCard Platform, I'll explain the authentication system and routes in detail. Your platform has a dual authentication system:

Authentication System Overview
1. Admin Authentication (Replit Auth)
Uses Replit's built-in authentication system
Single admin user (you) who logs in via Replit
Managed through server/replitAuth.ts
2. Customer Authentication (Custom System)
Traditional email/password registration and login
Managed through server/services/AuthService.ts
Session-based authentication
Route Categories
Admin-Only Routes (Require Replit Auth + Admin Role)
GET  /api/auth/user                    - Get current admin user info
POST /api/giftcards                    - Create gift cards
GET  /api/giftcards                    - View all gift cards  
GET  /api/admin/giftcards              - Alternative admin gift cards endpoint
GET  /api/admin/stats                  - Dashboard statistics
GET  /api/admin/transactions           - All transactions
GET  /api/admin/fraud-alerts           - Fraud monitoring
POST /api/admin/fraud-alerts/:id/resolve - Resolve fraud alerts
GET  /api/admin/fees                   - Fee configurations
POST /api/admin/fees                   - Create fee configs
PUT  /api/admin/fees/:id               - Update fee configs
DELETE /api/admin/fees/:id             - Delete fee configs
Customer-Only Routes (Require Customer Session Auth)
POST /api/auth/register                - Customer registration
POST /api/auth/login                   - Customer login
POST /api/auth/logout                  - Customer logout
GET  /api/auth/customer                - Check customer session
GET  /api/auth/verify/:token           - Email verification
POST /api/auth/forgot-password         - Password reset request
POST /api/auth/reset-password          - Password reset
GET  /api/giftcards/mine              - User's gift cards
GET  /api/user/orders                  - User's order history
GET  /api/user/orders/:orderId         - Specific order details
GET  /api/cards                        - User's saved payment cards
GET  /api/user/saved-cards             - Alternative saved cards endpoint
POST /api/cards                        - Add new payment card
DELETE /api/cards/:id                  - Delete payment card
PUT  /api/cards/:id/default            - Set default payment card
Public Routes (No Authentication Required)
POST /api/giftcards/balance            - Check gift card balance
POST /api/giftcards/check-balance      - Alternative balance check
POST /api/giftcards/redeem             - Redeem gift card
GET  /api/receipts/:token              - View receipt
GET  /api/receipts/:token/pdf          - Download receipt PDF
GET  /api/fees/active                  - Active fee configurations
POST /api/fees/calculate               - Calculate fees
GET  /api/health                       - Health check
Authentication Flow Identification
Admin Authentication Check
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
Customer Authentication Check
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
Configuration Summary
For Admin (You):

Access via Replit authentication (/api/login)
Role: admin in database
Full platform access including analytics, user management, fee configuration
For Customers (Public Users):

Register via /api/auth/register with email/password
Login via /api/auth/login
Role: customer in database
Limited to their own gift cards, orders, and payment methods
Public Access:

Gift card balance checking and redemption
Receipt viewing
Fee calculation for transparency
This dual-authentication system gives you complete administrative control while providing a secure, user-friendly experience for your customers. The system automatically identifies user types based on their authentication method and enforces appropriate permissions.