import { useState, useEffect } from "react";
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

  useEffect(() => {
    // Check customer authentication
    const checkCustomerAuth = async () => {
      try {
        const res = await fetch('/api/auth/customer', {
          credentials: 'include'
        });

        if (res.ok) {
          const user = await res.json();
          setCustomerAuth({
            user,
            isAuthenticated: true,
            isLoading: false,
            userType: 'customer'
          });
        } else {
          setCustomerAuth({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            userType: null
          });
        }
      } catch (error) {
        setCustomerAuth({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          userType: null
        });
      }
    };

    checkCustomerAuth();
  }, []);

  // Combine both auth states
  const isLoading = adminAuth.isLoading || customerAuth.isLoading;
  const isAuthenticated = adminAuth.isAuthenticated || customerAuth.isAuthenticated;
  const user = adminAuth.user || customerAuth.user;
  const userType = adminAuth.isAuthenticated ? 'admin' : (customerAuth.isAuthenticated ? 'customer' : null);

  return {
    user,
    isAuthenticated,
    isLoading,
    userType,
    isAdmin: adminAuth.isAuthenticated,
    isCustomer: customerAuth.isAuthenticated
  };
}