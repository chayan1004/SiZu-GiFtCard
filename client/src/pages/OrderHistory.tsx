import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Package, CreditCard, User, Calendar, Gift } from "lucide-react";
import { OrderHistoryResponse } from "@shared/schema";

export default function OrderHistory() {
  const [page, setPage] = useState(1);
  const [, setLocation] = useLocation();
  const pageSize = 10;

  const { data, isLoading, isError } = useQuery<OrderHistoryResponse>({
    queryKey: ["/api/user/orders", page, pageSize],
    queryFn: async () => {
      const response = await fetch(`/api/user/orders?page=${page}&pageSize=${pageSize}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch order history");
      }
      return response.json();
    },
  });

  const getDeliveryStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "success" | "destructive", label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      sent: { variant: "success", label: "Sent" },
      delivered: { variant: "success", label: "Delivered" },
      failed: { variant: "destructive", label: "Failed" },
    };
    
    const statusInfo = statusMap[status] || { variant: "default", label: status };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getDesignBadge = (design: string) => {
    const designMap: Record<string, { variant: "default" | "secondary" | "outline", label: string }> = {
      classic: { variant: "default", label: "Classic" },
      love: { variant: "secondary", label: "Love" },
      premium: { variant: "outline", label: "Premium" },
    };
    
    const designInfo = designMap[design] || { variant: "default", label: design };
    return <Badge variant={designInfo.variant}>{designInfo.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Order History</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">View your past gift card purchases</p>
        </div>
        <div className="space-y-3 sm:space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 sm:p-6">
                <Skeleton className="h-16 sm:h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
        <Card>
          <CardContent className="p-4 sm:p-6 text-center">
            <p className="text-muted-foreground text-sm sm:text-base">Failed to load order history. Please try again later.</p>
            <Button 
              className="mt-3 sm:mt-4 h-9 sm:h-11 text-sm sm:text-base px-4 sm:px-6" 
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { orders, pagination } = data || { orders: [], pagination: { page: 1, pageSize: 10, totalCount: 0, totalPages: 0 } };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Order History</h1>
        <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">View your past gift card purchases</p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-8 sm:p-12 text-center">
            <Package className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
            <h3 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2">No orders yet</h3>
            <p className="text-muted-foreground mb-3 sm:mb-4 text-sm sm:text-base">
              You haven't purchased any gift cards yet.
            </p>
            <Button onClick={() => setLocation("/shop")} className="h-9 sm:h-11 text-sm sm:text-base px-4 sm:px-6">
              Shop Gift Cards
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setLocation(`/orders/${order.id}`)}>
              <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg sm:text-xl">
                      ${order.amount}
                    </CardTitle>
                    <CardDescription className="mt-0.5 sm:mt-1 text-xs sm:text-sm">
                      Order #{order.code}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
                    {getDesignBadge(order.design)}
                    {getDeliveryStatusBadge(order.deliveryStatus)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Date:</span>
                      <span>{format(new Date(order.createdAt), "MMM d, yyyy")}</span>
                    </div>
                    
                    {order.recipientName && (
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                        <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Recipient:</span>
                        <span>{order.recipientName}</span>
                      </div>
                    )}
                    
                    {order.senderName && (
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                        <Gift className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">From:</span>
                        <span>{order.senderName}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1.5 sm:space-y-2">
                    {order.paymentMethodLast4 && (
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                        <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Payment:</span>
                        <span>
                          {order.paymentMethodType} •••• {order.paymentMethodLast4}
                        </span>
                      </div>
                    )}
                    
                    {order.isRedeemed && order.redeemedAmount && (
                      <div className="text-xs sm:text-sm">
                        <span className="text-muted-foreground">Redeemed:</span>
                        <span className="ml-1.5 sm:ml-2 text-orange-500 font-medium">
                          ${order.redeemedAmount} used
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 sm:gap-4 mt-6 sm:mt-8">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
          >
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>
          
          <div className="text-xs sm:text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            disabled={page === pagination.totalPages}
            onClick={() => setPage(page + 1)}
            className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}