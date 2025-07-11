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

  const { data: customerUser, isLoading: customerLoading, error: customerError } = useQuery({
    queryKey: ['/api/auth/customer'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/auth/customer', { credentials: 'include' });
        return res.ok ? res.json() : null;
      } catch (error) {
        console.error('Customer auth check failed:', error);
        return null;
      }
    },
    retry: false,
  });

  // Combine both auth states
  const isLoading = adminLoading || customerLoading;
  const isAuthenticated = !!adminUser || !!customerUser;
  const user = adminUser || customerUser;
  const userType = adminUser ? 'admin' : (customerUser ? 'customer' : null);

  return {
    user,
    isAuthenticated,
    isLoading,
    userType,
    isAdmin: !!adminUser,
    isCustomer: !!customerUser
  };
}