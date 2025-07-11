import { useAuth } from "./useAuth";
import { useCustomerAuth } from "./useCustomerAuth";
import { useEffect, useState } from "react";

interface CombinedAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userType: 'admin' | 'customer' | null;
  user: any;
}

export function useCombinedAuth(): CombinedAuthState {
  const [state, setState] = useState<CombinedAuthState>({
    isAuthenticated: false,
    isLoading: true,
    userType: null,
    user: null
  });

  // Check admin authentication (Replit Auth)
  const { user: adminUser, isLoading: adminLoading, isAuthenticated: isAdminAuth } = useAuth();
  
  // Check customer authentication (Custom Auth)
  const { user: customerUser, isLoading: customerLoading, isAuthenticated: isCustomerAuth } = useCustomerAuth();

  useEffect(() => {
    const loading = adminLoading || customerLoading;
    
    if (!loading) {
      if (isAdminAuth && adminUser) {
        setState({
          isAuthenticated: true,
          isLoading: false,
          userType: 'admin',
          user: adminUser
        });
      } else if (isCustomerAuth && customerUser) {
        setState({
          isAuthenticated: true,
          isLoading: false,
          userType: 'customer',
          user: customerUser
        });
      } else {
        setState({
          isAuthenticated: false,
          isLoading: false,
          userType: null,
          user: null
        });
      }
    } else {
      setState(prev => ({
        ...prev,
        isLoading: true
      }));
    }
  }, [adminLoading, customerLoading, isAdminAuth, isCustomerAuth, adminUser, customerUser]);

  return state;
}