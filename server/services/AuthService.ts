import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import { storage } from "../storage";
import { EmailService } from "./EmailService";

export class AuthService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  async registerCustomer(email: string, password: string, firstName: string, lastName: string) {
    try {
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        throw new Error("User already exists with this email");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate verification OTP
      const verificationOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Create user
      const userId = nanoid();
      const user = await storage.createUser({
        id: userId,
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role: 'customer',
        isEmailVerified: false,
        verificationOtp,
        otpExpiry
      });

      // Send verification email
      try {
        await this.emailService.sendVerificationEmail(email, verificationOtp, firstName);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        // Continue with registration even if email fails
      }

      return { userId, message: "Registration successful. Please check your email for verification code." };
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }

  async loginCustomer(email: string, password: string) {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user) {
        throw new Error("Invalid email or password");
      }

      if (user.role !== 'customer') {
        throw new Error("Invalid login credentials");
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error("Invalid email or password");
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        throw new Error("Please verify your email before logging in");
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  async verifyEmail(userId: string, otp: string) {
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        throw new Error("User not found");
      }

      if (user.isEmailVerified) {
        throw new Error("Email already verified");
      }

      if (user.verificationOtp !== otp) {
        throw new Error("Invalid verification code");
      }

      if (user.otpExpiry && new Date() > user.otpExpiry) {
        throw new Error("Verification code has expired");
      }

      // Mark email as verified
      await storage.updateUser(userId, {
        isEmailVerified: true,
        verificationOtp: null,
        otpExpiry: null
      });

      return { message: "Email verified successfully" };
    } catch (error) {
      console.error("Email verification error:", error);
      throw error;
    }
  }

  async forgotPassword(email: string) {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user || user.role !== 'customer') {
        // Don't reveal if email exists for security
        return { message: "If that email exists, we've sent a password reset link." };
      }

      // Generate reset token
      const resetToken = nanoid(32);
      const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await storage.updateUser(user.id, {
        resetToken,
        resetExpiry
      });

      // Send reset email
      try {
        await this.emailService.sendPasswordResetEmail(email, resetToken, user.firstName);
      } catch (emailError) {
        console.error("Failed to send reset email:", emailError);
      }

      return { message: "If that email exists, we've sent a password reset link." };
    } catch (error) {
      console.error("Forgot password error:", error);
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const user = await storage.getUserByResetToken(token);
      if (!user) {
        throw new Error("Invalid or expired reset token");
      }

      if (user.resetExpiry && new Date() > user.resetExpiry) {
        throw new Error("Reset token has expired");
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password and clear reset token
      await storage.updateUser(user.id, {
        password: hashedPassword,
        resetToken: null,
        resetExpiry: null
      });

      return { message: "Password reset successfully" };
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  }
}