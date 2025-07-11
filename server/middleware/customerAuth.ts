import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

// Extend Express Request type to include customer
declare global {
  namespace Express {
    interface Request {
      customer?: {
        id: string;
        email: string;
        role: string;
        firstName?: string;
        lastName?: string;
        isEmailVerified?: boolean;
      };
    }
  }
}

// Middleware to check if customer is authenticated
export const requireCustomerAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await storage.getUser(userId);
    
    if (!user || (user.role !== 'customer' && user.role !== 'admin')) {
      return res.status(401).json({ message: "Invalid authentication" });
    }

    // Attach customer data to request
    req.customer = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      isEmailVerified: user.isEmailVerified
    };

    next();
  } catch (error) {
    console.error("Customer auth middleware error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
};

// Middleware to allow either admin or customer authentication
export const requireAnyAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check for admin auth first (from Replit auth)
    if (req.user) {
      return next();
    }

    // Check for customer auth
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(401).json({ message: "Invalid authentication" });
    }

    // Attach customer data to request
    req.customer = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      isEmailVerified: user.isEmailVerified
    };

    next();
  } catch (error) {
    console.error("Any auth middleware error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
};

// Helper to get the authenticated user (admin or customer)
export const getAuthenticatedUser = (req: Request) => {
  if (req.user) {
    return {
      id: req.user.id,
      email: req.user.email || '',
      role: 'admin',
      firstName: req.user.username || '',
      lastName: '',
      isAdmin: true
    };
  }
  
  if (req.customer) {
    return {
      ...req.customer,
      isAdmin: req.customer.role === 'admin'
    };
  }
  
  return null;
};