import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useCombinedAuth } from "@/hooks/useCombinedAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import SimpleShop from "@/pages/SimpleShop";
import EnhancedShop from "@/pages/EnhancedShop";
import Balance from "@/pages/Balance";
import Redeem from "@/pages/Redeem";
import Recharge from "@/pages/Recharge";
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
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminDisputes from "@/pages/admin/AdminDisputes";
import AdminRefunds from "@/pages/admin/AdminRefunds";
import AdminPaymentLinks from "@/pages/admin/AdminPaymentLinks";
import AdminWebhooks from "@/pages/admin/AdminWebhooks";
import AdminEmailTemplates from "@/pages/admin/AdminEmailTemplates";
import AdminGiftCardDesigns from "@/pages/admin/AdminGiftCardDesigns";
import AdminSystemSettings from "@/pages/admin/AdminSystemSettings";
import AdminAuditLogs from "@/pages/admin/AdminAuditLogs";
import AdminDatabaseTools from "@/pages/admin/AdminDatabaseTools";
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
import UserWallet from "@/pages/user/UserWallet";
import UserTransactions from "@/pages/user/UserTransactions";
import UserReports from "@/pages/user/UserReports";
import UserNotifications from "@/pages/user/UserNotifications";
import UserSupport from "@/pages/user/UserSupport";
import UserSettings from "@/pages/user/UserSettings";
import PublicShop from "@/pages/PublicShop";
import PublicRecharge from "@/pages/PublicRecharge";
import PublicRedeem from "@/pages/PublicRedeem";
import PublicBalance from "@/pages/PublicBalance";
import PublicOrderHistory from "@/pages/PublicOrderHistory";
import OAuthSuccess from "@/pages/OAuthSuccess";
import OAuthError from "@/pages/OAuthError";
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
  const { isAuthenticated, isLoading, userType } = useCombinedAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/login" component={() => { window.location.href = '/api/login'; return null; }} />
          <Route path="/register" component={CustomerRegister} />
          <Route path="/verify-otp" component={VerifyOTP} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password/:token" component={ResetPassword} />
          <Route path="/admin-login" component={Login} />
          <Route path="/dashboard" component={() => { window.location.href = '/api/login'; return null; }} />
          <Route path="/user-dashboard" component={() => { window.location.href = '/api/login'; return null; }} />
          <Route path="/shop" component={SimpleShop} />
          <Route path="/balance" component={PublicBalance} />
          <Route path="/redeem" component={PublicRedeem} />
          <Route path="/recharge" component={PublicRecharge} />
          <Route path="/order-history" component={PublicOrderHistory} />
          <Route path="/receipt-view/:token" component={ReceiptView} />
          <Route path="/oauth/success" component={OAuthSuccess} />
          <Route path="/oauth/error" component={OAuthError} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/shop" component={SimpleShop} />
          <Route path="/balance" component={Balance} />
          <Route path="/redeem" component={Redeem} />
          <Route path="/recharge" component={Recharge} />
          <Route path="/order-history" component={OrderHistory} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/dashboard/admin" component={AdminDashboard} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/dashboard/user" component={UserDashboard} />
          <Route path="/admin/gift-cards" component={AdminGiftCards} />
          <Route path="/admin/users" component={AdminUsers} />
          <Route path="/admin/transactions" component={AdminTransactions} />
          <Route path="/admin/analytics" component={AdminAnalytics} />
          <Route path="/admin/security" component={AdminSecurity} />
          <Route path="/admin/revenue" component={AdminRevenue} />
          <Route path="/admin/fees" component={AdminFeeManagement} />
          <Route path="/admin/settings" component={AdminSettings} />
          <Route path="/admin/disputes" component={AdminDisputes} />
          <Route path="/admin/refunds" component={AdminRefunds} />
          <Route path="/admin/payment-links" component={AdminPaymentLinks} />
          <Route path="/admin/webhooks" component={AdminWebhooks} />
          <Route path="/admin/email-templates" component={AdminEmailTemplates} />
          <Route path="/admin/gift-card-designs" component={AdminGiftCardDesigns} />
          <Route path="/admin/system-settings" component={AdminSystemSettings} />
          <Route path="/admin/audit-logs" component={AdminAuditLogs} />
          <Route path="/admin/database-tools" component={AdminDatabaseTools} />
          <Route path="/profile" component={Profile} />
          <Route path="/orders" component={OrderHistory} />
          <Route path="/orders/:orderId" component={OrderDetails} />
          <Route path="/dashboard/user/wallet" component={UserWallet} />
          <Route path="/dashboard/user/transactions" component={UserTransactions} />
          <Route path="/dashboard/user/reports" component={UserReports} />
          <Route path="/dashboard/user/notifications" component={UserNotifications} />
          <Route path="/dashboard/user/support" component={UserSupport} />
          <Route path="/dashboard/user/settings" component={UserSettings} />
          <Route path="/dashboard/user/designer" component={EnhancedShop} />
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
