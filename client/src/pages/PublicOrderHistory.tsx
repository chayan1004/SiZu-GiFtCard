import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, History, Mail, Gift, Calendar, CreditCard, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const orderLookupSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  orderCode: z.string().optional(),
});

type OrderLookupFormData = z.infer<typeof orderLookupSchema>;

export default function PublicOrderHistory() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const form = useForm<OrderLookupFormData>({
    resolver: zodResolver(orderLookupSchema),
    defaultValues: {
      email: "",
      orderCode: "",
    },
  });

  // Lookup orders mutation
  const lookupOrdersMutation = useMutation({
    mutationFn: async (data: OrderLookupFormData) => {
      return apiRequest("/api/public/orders", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: (data) => {
      setOrders(data.orders || []);
      if (data.orders.length === 0) {
        toast({
          title: "No Orders Found",
          description: "No gift card orders found for this email address.",
        });
      } else {
        toast({
          title: "Orders Found",
          description: `Found ${data.orders.length} gift card order(s).`,
        });
      }
    },
    onError: (error) => {
      setOrders([]);
      toast({
        title: "Error",
        description: error.message || "Failed to lookup orders",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OrderLookupFormData) => {
    // Prompt user to login to view order history
    toast({
      title: "Login Required",
      description: "Please login or create an account to view your order history.",
    });
    setTimeout(() => {
      window.location.href = "/login";
    }, 1500);
  };

  const getDesignColor = (design: string) => {
    const colors: Record<string, string> = {
      classic: "bg-gray-500",
      love: "bg-pink-500",
      birthday: "bg-purple-500",
      holiday: "bg-green-500",
      thank_you: "bg-blue-500",
      congratulations: "bg-yellow-500",
      premium: "bg-gradient-to-r from-purple-600 to-pink-600",
    };
    return colors[design] || colors.classic;
  };

  const getStatusBadge = (order: any) => {
    if (order.isRedeemed) {
      if (parseFloat(order.currentBalance) === 0) {
        return <Badge variant="secondary">Fully Redeemed</Badge>;
      }
      return <Badge variant="default">Partially Used</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <History className="h-10 w-10 text-orange-600" />
            Order History
          </h1>
          <p className="text-lg text-gray-600">Look up your gift card orders by email</p>
        </div>

        <Card className="shadow-xl mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-6 w-6 text-orange-600" />
              Order Lookup
            </CardTitle>
            <CardDescription>
              Enter your email address to find all your gift card orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="john@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="orderCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order Code (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Gift card code"
                            {...field}
                            className="uppercase"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={lookupOrdersMutation.isPending}
                >
                  {lookupOrdersMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <History className="mr-2 h-4 w-4" />
                      Lookup Orders
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {orders.length > 0 && (
          <div className="space-y-6">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All Orders ({orders.length})</TabsTrigger>
                <TabsTrigger value="active">
                  Active ({orders.filter(o => !o.isRedeemed || parseFloat(o.currentBalance) > 0).length})
                </TabsTrigger>
                <TabsTrigger value="redeemed">
                  Redeemed ({orders.filter(o => o.isRedeemed).length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {orders.map((order) => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    onSelect={() => setSelectedOrder(order)}
                    getDesignColor={getDesignColor}
                    getStatusBadge={getStatusBadge}
                  />
                ))}
              </TabsContent>

              <TabsContent value="active" className="space-y-4">
                {orders
                  .filter(o => !o.isRedeemed || parseFloat(o.currentBalance) > 0)
                  .map((order) => (
                    <OrderCard 
                      key={order.id} 
                      order={order} 
                      onSelect={() => setSelectedOrder(order)}
                      getDesignColor={getDesignColor}
                      getStatusBadge={getStatusBadge}
                    />
                  ))}
              </TabsContent>

              <TabsContent value="redeemed" className="space-y-4">
                {orders
                  .filter(o => o.isRedeemed)
                  .map((order) => (
                    <OrderCard 
                      key={order.id} 
                      order={order} 
                      onSelect={() => setSelectedOrder(order)}
                      getDesignColor={getDesignColor}
                      getStatusBadge={getStatusBadge}
                    />
                  ))}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {selectedOrder && (
          <Card className="mt-8 shadow-xl">
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
              <CardDescription>Complete information about your gift card order</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Order Code</p>
                  <p className="font-mono font-semibold">{selectedOrder.code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Purchase Date</p>
                  <p className="font-semibold">
                    {new Date(selectedOrder.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Original Amount</p>
                  <p className="font-semibold">${selectedOrder.amount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Balance</p>
                  <p className="font-semibold text-green-600">${selectedOrder.currentBalance}</p>
                </div>
              </div>

              {selectedOrder.recipientName && (
                <div>
                  <p className="text-sm text-gray-600">Recipient</p>
                  <p className="font-semibold">{selectedOrder.recipientName}</p>
                  {selectedOrder.recipientEmail && (
                    <p className="text-sm text-gray-500">{selectedOrder.recipientEmail}</p>
                  )}
                </div>
              )}

              {selectedOrder.senderName && (
                <div>
                  <p className="text-sm text-gray-600">From</p>
                  <p className="font-semibold">{selectedOrder.senderName}</p>
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.location.href = `/balance?code=${selectedOrder.code}`}
                >
                  Check Balance
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => setSelectedOrder(null)}
                >
                  Close Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Order Card Component
function OrderCard({ 
  order, 
  onSelect, 
  getDesignColor, 
  getStatusBadge 
}: { 
  order: any; 
  onSelect: () => void;
  getDesignColor: (design: string) => string;
  getStatusBadge: (order: any) => JSX.Element;
}) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onSelect}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={`h-16 w-16 rounded-lg ${getDesignColor(order.design)} flex items-center justify-center`}>
              <Gift className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-lg">{order.code}</p>
                {getStatusBadge(order)}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <CreditCard className="h-4 w-4" />
                  ${order.amount}
                </span>
                {order.deliveryStatus === 'sent' && (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Delivered
                  </span>
                )}
              </div>
              {order.recipientName && (
                <p className="text-sm text-gray-500 mt-1">
                  To: {order.recipientName}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Balance</p>
            <p className="text-xl font-bold">${order.currentBalance}</p>
            {order.isRedeemed && order.redeemedAmount !== "0.00" && (
              <p className="text-xs text-gray-500">
                Used: ${order.redeemedAmount}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}