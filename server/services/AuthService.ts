
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { storage } from '../storage';

export class AuthService {
  private static saltRounds = 12;

  // Register new customer
  static async registerCustomer(email: string, password: string, firstName?: string, lastName?: string) {
    // Check if email already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, this.saltRounds);
    
    // Generate verification token
    const verificationToken = nanoid(32);

    // Create customer user
    const user = await storage.createCustomer({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'customer',
      isEmailVerified: false,
      verificationToken,
    });

    return { user, verificationToken };
  }

  // Login customer
  static async loginCustomer(email: string, password: string) {
    const user = await storage.getUserByEmail(email);
    if (!user || user.role !== 'customer') {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new Error('Please verify your email before logging in');
    }

    return user;
  }

  // Verify email
  static async verifyEmail(token: string) {
    const user = await storage.getUserByVerificationToken(token);
    if (!user) {
      throw new Error('Invalid verification token');
    }

    await storage.updateUser(user.id, {
      isEmailVerified: true,
      verificationToken: null,
    });

    return user;
  }

  // Request password reset
  static async requestPasswordReset(email: string) {
    const user = await storage.getUserByEmail(email);
    if (!user || user.role !== 'customer') {
      return; // Don't reveal if email exists
    }

    const resetToken = nanoid(32);
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await storage.updateUser(user.id, {
      resetToken,
      resetExpires,
    });

    return resetToken;
  }

  // Reset password
  static async resetPassword(token: string, newPassword: string) {
    const user = await storage.getUserByResetToken(token);
    if (!user || !user.resetExpires || user.resetExpires < new Date()) {
      throw new Error('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, this.saltRounds);

    await storage.updateUser(user.id, {
      password: hashedPassword,
      resetToken: null,
      resetExpires: null,
    });

    return user;
  }
}
