
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from '@/components/ui/toaster';

// Import pages
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Shop from '@/pages/Shop';
import Balance from '@/pages/Balance';
import Redeem from '@/pages/Redeem';
import Revenue from '@/pages/Revenue';
import AdminDashboard from '@/pages/AdminDashboard';
import CustomerLogin from '@/pages/CustomerLogin';
import CustomerRegister from '@/pages/CustomerRegister';
import VerifyOTP from '@/pages/VerifyOTP';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import UserDashboard from '@/pages/UserDashboard';
import OrderHistory from '@/pages/OrderHistory';
import OrderDetails from '@/pages/OrderDetails';
import Profile from '@/pages/Profile';
import ReceiptView from '@/pages/ReceiptView';
import NotFound from '@/pages/not-found';

// Public pages
import PublicShop from '@/pages/PublicShop';
import EnhancedShop from '@/pages/EnhancedShop';
import SimpleShop from '@/pages/SimpleShop';
import PublicBalance from '@/pages/PublicBalance';
import PublicRedeem from '@/pages/PublicRedeem';
import PublicRecharge from '@/pages/PublicRecharge';
import PublicOrderHistory from '@/pages/PublicOrderHistory';

// Admin pages
import AdminGiftCards from '@/pages/AdminGiftCards';
import AdminTransactions from '@/pages/AdminTransactions';
import AdminAnalytics from '@/pages/AdminAnalytics';
import AdminUsers from '@/pages/AdminUsers';
import AdminSecurity from '@/pages/AdminSecurity';
import AdminRevenue from '@/pages/AdminRevenue';
import AdminFeeManagement from '@/pages/AdminFeeManagement';

// User pages
import UserTransactions from '@/pages/user/UserTransactions';
import UserWallet from '@/pages/user/UserWallet';
import UserSettings from '@/pages/user/UserSettings';
import UserNotifications from '@/pages/user/UserNotifications';
import UserSupport from '@/pages/user/UserSupport';
import UserReports from '@/pages/user/UserReports';

import './index.css';

// Create QueryClient with proper configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          
          {/* Customer auth routes */}
          <Route path="/customer/login" element={<CustomerLogin />} />
          <Route path="/customer/register" element={<CustomerRegister />} />
          <Route path="/customer/verify" element={<VerifyOTP />} />
          <Route path="/customer/forgot-password" element={<ForgotPassword />} />
          <Route path="/customer/reset-password" element={<ResetPassword />} />
          
          {/* Public shop routes */}
          <Route path="/shop" element={<PublicShop />} />
          <Route path="/shop/enhanced" element={<EnhancedShop />} />
          <Route path="/shop/simple" element={<SimpleShop />} />
          <Route path="/balance" element={<PublicBalance />} />
          <Route path="/redeem" element={<PublicRedeem />} />
          <Route path="/recharge" element={<PublicRecharge />} />
          <Route path="/orders" element={<PublicOrderHistory />} />
          
          {/* Receipt routes */}
          <Route path="/receipt-view/:token" element={<ReceiptView />} />
          
          {/* Admin routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/gift-cards" element={<AdminGiftCards />} />
          <Route path="/admin/transactions" element={<AdminTransactions />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/security" element={<AdminSecurity />} />
          <Route path="/admin/revenue" element={<AdminRevenue />} />
          <Route path="/admin/fees" element={<AdminFeeManagement />} />
          
          {/* User dashboard routes */}
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/user/dashboard" element={<UserDashboard />} />
          <Route path="/user/transactions" element={<UserTransactions />} />
          <Route path="/user/wallet" element={<UserWallet />} />
          <Route path="/user/settings" element={<UserSettings />} />
          <Route path="/user/notifications" element={<UserNotifications />} />
          <Route path="/user/support" element={<UserSupport />} />
          <Route path="/user/reports" element={<UserReports />} />
          <Route path="/user/orders" element={<OrderHistory />} />
          <Route path="/user/orders/:orderId" element={<OrderDetails />} />
          <Route path="/user/profile" element={<Profile />} />
          
          {/* Legacy routes for backward compatibility */}
          <Route path="/legacy/dashboard" element={<Dashboard />} />
          <Route path="/legacy/shop" element={<Shop />} />
          <Route path="/legacy/balance" element={<Balance />} />
          <Route path="/legacy/redeem" element={<Redeem />} />
          <Route path="/legacy/revenue" element={<Revenue />} />
          <Route path="/legacy/orders" element={<OrderHistory />} />
          <Route path="/legacy/orders/:orderId" element={<OrderDetails />} />
          
          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        
        <Toaster />
        <ReactQueryDevtools initialIsOpen={false} />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
