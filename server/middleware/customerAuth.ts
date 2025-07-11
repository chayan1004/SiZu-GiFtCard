
import type { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

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

export const requireAnyAuth = async (req: any, res: Response, next: NextFunction) => {
  try {
    // Check customer session first
    if (req.session.userId) {
      const user = await storage.getUser(req.session.userId);
      if (user && user.role === 'customer') {
        req.user = user;
        return next();
      }
    }

    // Check Replit auth (for admin)
    if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user && user.role === 'admin') {
        req.user = user;
        return next();
      }
    }

    return res.status(401).json({ message: "Authentication required" });
  } catch (error) {
    res.status(500).json({ message: "Authentication check failed" });
  }
};
