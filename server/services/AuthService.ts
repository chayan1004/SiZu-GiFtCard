
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { storage } from '../storage';

export class AuthService {
  private static saltRounds = 12;

  // Generate 6-digit OTP
  private static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Register new customer
  static async registerCustomer(email: string, password: string, firstName?: string, lastName?: string) {
    // Check if email already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, this.saltRounds);
    
    // Generate OTP and expiry (10 minutes)
    const otp = this.generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create customer user
    const user = await storage.createCustomer({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'customer',
      isEmailVerified: false,
      verificationOtp: otp,
      otpExpiry,
    });

    return { user, otp };
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

  // Verify OTP
  static async verifyOTP(email: string, otp: string) {
    const user = await storage.getUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.isEmailVerified) {
      throw new Error('Email already verified');
    }

    if (!user.verificationOtp || !user.otpExpiry) {
      throw new Error('No OTP found. Please request a new one.');
    }

    if (user.otpExpiry < new Date()) {
      throw new Error('OTP has expired. Please request a new one.');
    }

    if (user.verificationOtp !== otp) {
      throw new Error('Invalid OTP');
    }

    await storage.updateUser(user.id, {
      isEmailVerified: true,
      verificationOtp: null,
      otpExpiry: null,
    });

    return user;
  }

  // Resend OTP
  static async resendOTP(email: string) {
    const user = await storage.getUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.isEmailVerified) {
      throw new Error('Email already verified');
    }

    // Generate new OTP
    const otp = this.generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await storage.updateUser(user.id, {
      verificationOtp: otp,
      otpExpiry,
    });

    return otp;
  }

  // Request password reset
  static async requestPasswordReset(email: string) {
    const user = await storage.getUserByEmail(email);
    if (!user || user.role !== 'customer') {
      return; // Don't reveal if email exists
    }

    const resetToken = nanoid(32);
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await storage.updateUser(user.id, {
      resetToken,
      resetTokenExpiry,
    });

    return resetToken;
  }

  // Reset password
  static async resetPassword(token: string, newPassword: string) {
    const user = await storage.getUserByResetToken(token);
    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw new Error('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, this.saltRounds);

    await storage.updateUser(user.id, {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    });

    return user;
  }
}
