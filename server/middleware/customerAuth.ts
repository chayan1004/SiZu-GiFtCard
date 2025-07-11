import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const requireCustomerAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
    console.error("Customer auth check failed:", error);
    res.status(500).json({ message: "Authentication check failed" });
  }
};

export const requireAnyAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Check for Replit admin authentication
    if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
      const adminUserId = req.user.claims.sub;
      const adminUser = await storage.getUser(adminUserId);
      if (adminUser && adminUser.role === 'admin') {
        req.user = adminUser;
        return next();
      }
    }

    // Check for customer session authentication
    if (req.session.userId) {
      const customerUser = await storage.getUser(req.session.userId);
      if (customerUser && customerUser.role === 'customer') {
        req.user = customerUser;
        return next();
      }
    }

    return res.status(401).json({ message: "Authentication required" });
  } catch (error) {
    console.error("Auth check failed:", error);
    res.status(500).json({ message: "Authentication check failed" });
  }
};

export const getAuthenticatedUser = (req: AuthenticatedRequest): any => {
  return req.user;
};