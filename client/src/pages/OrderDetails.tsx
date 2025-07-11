import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  Package, 
  CreditCard, 
  User, 
  Calendar, 
  Gift, 
  Mail,
  MessageSquare,
  Activity,
  DollarSign,
  TrendingUp
} from "lucide-react";
import { useLocation } from "wouter";

export default function OrderDetails() {
  const { orderId } = useParams();
  const [, setLocation] = useLocation();

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["/api/user/orders", orderId],
    queryFn: async () => {
      const response = await fetch(`/api/user/orders/${orderId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch order details");
      }
      return response.json();
    },
    enabled: !!orderId,
  });

  const getDeliveryStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "success" | "destructive", label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      sent: { variant: "success", label: "Sent" },
      delivered: { variant: "success", label: "Delivered" },
      failed: { variant: "destructive", label: "Failed" },
    };
    
    const statusInfo = statusMap[status] || { variant: "default", label: status };
    return <Badge variant={statusInfo.variant} className="text-sm">{statusInfo.label}</Badge>;
  };

  const getDesignBadge = (design: string) => {
    const designMap: Record<string, { variant: "default" | "secondary" | "outline", label: string }> = {
      classic: { variant: "default", label: "Classic" },
      love: { variant: "secondary", label: "Love" },
      premium: { variant: "outline", label: "Premium" },
    };
    
    const designInfo = designMap[design] || { variant: "default", label: design };
    return <Badge variant={designInfo.variant} className="text-sm">{designInfo.label}</Badge>;
  };

  const getTransactionTypeBadge = (type: string) => {
    const typeMap: Record<string, { variant: "default" | "secondary" | "destructive", label: string }> = {
      purchase: { variant: "default", label: "Purchase" },
      redemption: { variant: "secondary", label: "Redemption" },
      refund: { variant: "destructive", label: "Refund" },
    };
    
    const typeInfo = typeMap[type] || { variant: "default", label: type };
    return <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <Skeleton className="h-10 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32 mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Order not found</h3>
            <p className="text-muted-foreground mb-4">
              We couldn't find the order you're looking for.
            </p>
            <Button onClick={() => setLocation("/orders")}>
              Back to Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const balancePercentage = (parseFloat(order.currentBalance) / parseFloat(order.amount)) * 100;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/orders")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>
        <h1 className="text-3xl font-bold">Order Details</h1>
      </div>

      <div className="grid gap-6">
        {/* Main Order Info */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">
                  ${order.amount} Gift Card
                </CardTitle>
                <CardDescription className="mt-2">
                  Order #{order.code}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {getDesignBadge(order.design)}
                {getDeliveryStatusBadge(order.deliveryStatus)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Balance Status */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Balance Status</span>
                <span className="font-medium">
                  ${order.currentBalance} of ${order.amount} remaining
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${balancePercentage}%` }}
                />
              </div>
              {order.isRedeemed && order.redeemedAmount && (
                <p className="text-sm text-orange-500">
                  ${order.redeemedAmount} has been redeemed
                </p>
              )}
            </div>

            {/* Order Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Purchase Date</p>
                    <p className="font-medium">
                      {format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>

                {order.recipientName && (
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Recipient</p>
                      <p className="font-medium">{order.recipientName}</p>
                    </div>
                  </div>
                )}

                {order.recipientEmail && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Recipient Email</p>
                      <p className="font-medium">{order.recipientEmail}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {order.senderName && (
                  <div className="flex items-start gap-3">
                    <Gift className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">From</p>
                      <p className="font-medium">{order.senderName}</p>
                    </div>
                  </div>
                )}

                {order.paymentMethodLast4 && (
                  <div className="flex items-start gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Method</p>
                      <p className="font-medium">
                        {order.paymentMethodType} •••• {order.paymentMethodLast4}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Custom Message */}
            {order.customMessage && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Gift Message</p>
                </div>
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <p className="text-sm italic">{order.customMessage}</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Tracking */}
        {order.revenue && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Revenue Analytics
              </CardTitle>
              <CardDescription>
                Financial insights for this gift card
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gift Card Revenue */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Gift Card Revenue</h4>
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Total Redeemed</span>
                          <span className="font-semibold text-green-600">
                            ${order.revenue.giftCardRevenue.totalRedeemed.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Redemption Count</span>
                          <span className="font-medium">
                            {order.revenue.giftCardRevenue.redemptionCount}
                          </span>
                        </div>
                        <div className="mt-2 pt-2 border-t">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Utilization Rate</span>
                            <span className="font-medium">
                              {((order.revenue.giftCardRevenue.totalRedeemed / parseFloat(order.amount)) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recipient Spending */}
                {order.recipientEmail && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Recipient Activity</h4>
                    <Card className="bg-muted/50">
                      <CardContent className="p-4">
                        {order.revenue.recipientSpending.totalSpent > 0 ? (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Total Spent</span>
                              <span className="font-semibold text-blue-600">
                                ${order.revenue.recipientSpending.totalSpent.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Purchases Made</span>
                              <span className="font-medium">
                                {order.revenue.recipientSpending.purchaseCount}
                              </span>
                            </div>
                            <div className="mt-2 pt-2 border-t">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Average Purchase</span>
                                <span className="font-medium">
                                  ${(order.revenue.recipientSpending.totalSpent / order.revenue.recipientSpending.purchaseCount).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-2">
                            Recipient has not made any purchases yet
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transaction History */}
        {order.transactions && order.transactions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Transaction History
              </CardTitle>
              <CardDescription>
                All transactions for this gift card
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.transactions.map((transaction: any) => (
                  <div 
                    key={transaction.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          {getTransactionTypeBadge(transaction.type)}
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(transaction.createdAt), "MMM d, yyyy")}
                          </span>
                        </div>
                        {transaction.notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {transaction.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.type === 'redemption' ? 'text-red-500' : 'text-green-500'
                      }`}>
                        {transaction.type === 'redemption' ? '-' : '+'}${transaction.amount}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Balance: ${transaction.balanceAfter}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setLocation("/balance")}>
                Check Another Balance
              </Button>
              <Button variant="outline" onClick={() => setLocation("/shop")}>
                Purchase New Gift Card
              </Button>
              {parseFloat(order.currentBalance) > 0 && (
                <Button variant="secondary" onClick={() => setLocation("/redeem")}>
                  Redeem This Card
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}