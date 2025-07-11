import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import Balance from "@/pages/Balance";
import Redeem from "@/pages/Redeem";
import Dashboard from "@/pages/Dashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import UserDashboard from "@/pages/UserDashboard";
import AdminGiftCards from "@/pages/AdminGiftCards";
import AdminUsers from "@/pages/AdminUsers";
import AdminTransactions from "@/pages/AdminTransactions";
import AdminAnalytics from "@/pages/AdminAnalytics";
import AdminSecurity from "@/pages/AdminSecurity";
import AdminRevenue from "@/pages/AdminRevenue";
import AdminFeeManagement from "@/pages/AdminFeeManagement";
import Profile from "@/pages/Profile";
import OrderHistory from "@/pages/OrderHistory";
import OrderDetails from "@/pages/OrderDetails";
import Revenue from "@/pages/Revenue";
import FeeManagement from "@/pages/FeeManagement";
import ReceiptView from "@/pages/ReceiptView";
import CustomerLogin from "@/pages/CustomerLogin";
import CustomerRegister from "@/pages/CustomerRegister";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import VerifyOTP from "@/pages/VerifyOTP";
import { Component, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
            <p className="text-gray-300 mb-4">{this.state.error?.message || 'An unexpected error occurred'}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function Router() {
  const { isAuthenticated, isLoading, error } = useAuth();

  // Handle authentication errors gracefully
  if (error && !isLoading) {
    console.warn("Authentication error:", error);
  }

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/login" component={CustomerLogin} />
          <Route path="/register" component={CustomerRegister} />
          <Route path="/verify-otp" component={VerifyOTP} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password/:token" component={ResetPassword} />
          <Route path="/admin-login" component={Login} />
          <Route path="/dashboard" component={CustomerLogin} />
          <Route path="/user-dashboard" component={CustomerLogin} />
          <Route path="/shop" component={Shop} />
          <Route path="/balance" component={Balance} />
          <Route path="/redeem" component={Redeem} />
          <Route path="/receipt-view/:token" component={ReceiptView} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/shop" component={Shop} />
          <Route path="/balance" component={Balance} />
          <Route path="/redeem" component={Redeem} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/dashboard/admin" component={AdminDashboard} />
          <Route path="/dashboard/user" component={UserDashboard} />
          <Route path="/admin/gift-cards" component={AdminGiftCards} />
          <Route path="/admin/users" component={AdminUsers} />
          <Route path="/admin/transactions" component={AdminTransactions} />
          <Route path="/admin/analytics" component={AdminAnalytics} />
          <Route path="/admin/security" component={AdminSecurity} />
          <Route path="/admin/revenue" component={AdminRevenue} />
          <Route path="/admin/fees" component={AdminFeeManagement} />
          <Route path="/profile" component={Profile} />
          <Route path="/orders" component={OrderHistory} />
          <Route path="/orders/:orderId" component={OrderDetails} />
          <Route path="/revenue" component={Revenue} />
          <Route path="/fees" component={FeeManagement} />
          <Route path="/receipt-view/:token" component={ReceiptView} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          <Toaster />
          <Router />
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
