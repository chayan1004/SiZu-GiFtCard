import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface User {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  isEmailVerified?: boolean;
  isAdmin?: boolean;
}

export function useAuth() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Check for any authentication (admin or customer)
  const { data: authState, isLoading, error } = useQuery({
    queryKey: ["/api/auth/status"],
    queryFn: async () => {
      try {
        // First check for admin auth
        const adminResponse = await fetch("/api/auth/user");
        if (adminResponse.ok) {
          const adminUser = await adminResponse.json();
          return {
            user: { ...adminUser, isAdmin: true },
            type: "admin",
            isAuthenticated: true
          };
        }
      } catch {}

      try {
        // Then check for customer auth
        const customerResponse = await fetch("/api/auth/customer");
        if (customerResponse.ok) {
          const customerUser = await customerResponse.json();
          return {
            user: { ...customerUser, isAdmin: false },
            type: "customer",
            isAuthenticated: true
          };
        }
      } catch {}

      return {
        user: null,
        type: null,
        isAuthenticated: false
      };
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  // Customer login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      return await apiRequest('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/status"], {
        user: data.user,
        type: "customer",
        isAuthenticated: true
      });
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in."
      });
      setLocation(data.user.role === 'admin' ? "/dashboard/admin" : "/dashboard/user");
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive"
      });
    }
  });

  // Customer logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/auth/logout', {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/status"], {
        user: null,
        type: null,
        isAuthenticated: false
      });
      queryClient.invalidateQueries();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out."
      });
      setLocation("/");
    }
  });

  return {
    user: authState?.user || null,
    authType: authState?.type || null,
    isLoading,
    error,
    isAuthenticated: authState?.isAuthenticated || false,
    isAdmin: authState?.user?.isAdmin || false,
    isCustomer: authState?.type === "customer",
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    loginLoading: loginMutation.isPending,
    logoutLoading: logoutMutation.isPending
  };
}
