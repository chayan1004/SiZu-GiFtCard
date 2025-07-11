import { useState } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CustomerUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isEmailVerified?: boolean;
}

interface CustomerAuthState {
  user: CustomerUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useCustomerAuth() {
  const [authState, setAuthState] = useState<CustomerAuthState>({
    user: null,
    isLoading: false,
    isAuthenticated: false
  });
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const checkAuthStatus = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    try {
      const res = await fetch('/api/auth/customer', {
        credentials: 'include'
      });
      
      if (res.ok) {
        const response = await res.json();
        setAuthState({
          user: response,
          isAuthenticated: true,
          isLoading: false
        });
        return true;
      }
    } catch (error) {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
    return false;
  };

  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    try {
      const res = await apiRequest('POST', '/api/auth/login', { email, password });
      const response = await res.json();

      if (response.user) {
        setAuthState({
          user: response.user,
          isAuthenticated: true,
          isLoading: false
        });
        
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in."
        });
        
        setLocation("/dashboard/user");
        return response.user;
      }
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive"
      });
      throw error;
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    try {
      const res = await apiRequest('POST', '/api/auth/register', { email, password, firstName, lastName });
      const response = await res.json();

      if (response.userId) {
        toast({
          title: "Registration successful!",
          description: "Please check your email for your verification code."
        });
        
        setLocation("/verify-otp");
        return response;
      }
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create account",
        variant: "destructive"
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out."
      });
      
      setLocation("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await apiRequest('POST', '/api/auth/forgot-password', { email });
      
      toast({
        title: "Password reset email sent",
        description: "If that email exists, we've sent a password reset link."
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Request failed",
        description: error.message || "Failed to send password reset email",
        variant: "destructive"
      });
      throw error;
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      await apiRequest('POST', '/api/auth/reset-password', { token, password });
      
      toast({
        title: "Password reset successful",
        description: "You can now login with your new password."
      });
      
      setLocation("/login");
      return true;
    } catch (error: any) {
      toast({
        title: "Reset failed",
        description: error.message || "Failed to reset password",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    ...authState,
    checkAuthStatus,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword
  };
}