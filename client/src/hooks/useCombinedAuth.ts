import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

interface CombinedAuthState {
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  userType: 'admin' | 'customer' | null;
}

export function useCombinedAuth() {
  // Only check admin authentication since we're using Replit Auth for admin access
  const { data: adminUser, isLoading: adminLoading, error: adminError } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/auth/user', { credentials: 'include' });
        return res.ok ? res.json() : null;
      } catch (error) {
        console.error('Admin auth check failed:', error);
        return null;
      }
    },
    retry: false,
  });

  // Since we only have admin auth through Replit, we don't need customer auth checks
  const isLoading = adminLoading;
  const isAuthenticated = !!adminUser;
  const user = adminUser;
  const userType = adminUser ? 'admin' : null;

  return {
    user,
    isAuthenticated,
    isLoading,
    userType,
    isAdmin: !!adminUser,
    isCustomer: false // No customer auth in this system
  };
}