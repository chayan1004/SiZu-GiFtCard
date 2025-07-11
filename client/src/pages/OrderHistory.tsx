import { useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { useLogin } from "@/hooks/useLogin";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, CreditCard, Download, Eye, Search, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";
import { 
  PageContainer, 
  PageHeader, 
  GradientButton,
  GlassCard,
  LoadingSpinner 
} from "@/components/DesignSystem";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OrderHistory() {
  const { user, isAuthenticated } = useAuth();
  const { handleLogin } = useLogin();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Fetch orders
  const { data: orders, isLoading } = useQuery({
    queryKey: ['/api/user/orders', page, searchTerm, statusFilter],
    enabled: isAuthenticated,
    retry: false,
  });

  const handleLogout = () => {
    toast({
      title: "Logging out...",
      description: "You will be redirected to the login page.",
    });
    setTimeout(() => {
      window.location.href = '/api/logout';
    }, 1000);
  };

  const handleViewOrder = (orderId: string) => {
    window.location.href = `/orders/${orderId}`;
  };

  const handleDownloadReceipt = (orderId: string) => {
    window.open(`/api/receipts/${orderId}/download`, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDeliveryStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-500';
      case 'sent': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (!isAuthenticated) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Navigation 
        user={user} 
        onLogin={handleLogin}
        onLogout={handleLogout}
        showDashboard={user?.role === 'admin'}
      />
      
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <PageHeader
            title="Order History"
            subtitle="View and manage your gift card orders"
          />

          {/* Filters */}
          <div className="mb-8 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order: any) => (
                <GlassCard key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {order.design} Gift Card
                          </h3>
                          <p className="text-gray-300 text-sm">
                            Order #{order.id} • {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={`${getStatusColor(order.status)} text-white`}>
                          {order.status}
                        </Badge>
                        <Badge className={`${getDeliveryStatusColor(order.deliveryStatus)} text-white`}>
                          {order.deliveryStatus}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-sm">Amount</p>
                        <p className="text-white font-semibold">${order.initialAmount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Current Balance</p>
                        <p className="text-white font-semibold">${order.currentBalance.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Recipient</p>
                        <p className="text-white">{order.recipientEmail || 'Self'}</p>
                      </div>
                    </div>

                    {order.customMessage && (
                      <div className="mb-4 p-3 bg-white/5 rounded-lg">
                        <p className="text-gray-400 text-sm mb-1">Message</p>
                        <p className="text-white">{order.customMessage}</p>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2">
                      <GradientButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewOrder(order.id)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </GradientButton>
                      <GradientButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadReceipt(order.id)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Receipt
                      </GradientButton>
                    </div>
                  </CardContent>
                </GlassCard>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Orders Found</h3>
              <p className="text-gray-300 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? "No orders match your search criteria" 
                  : "You haven't made any orders yet"}
              </p>
              <GradientButton onClick={() => window.location.href = '/shop'}>
                Shop Gift Cards
              </GradientButton>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}