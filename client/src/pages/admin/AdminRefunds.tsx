import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { DollarSign, RefreshCw, CheckCircle, XCircle, Clock, AlertCircle, TrendingDown, CreditCard } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import SideNavigation from "@/components/SideNavigation";
import { format } from "date-fns";

interface Refund {
  id: string;
  paymentId: string;
  orderId?: string;
  status: string;
  amountMoney: {
    amount: number;
    currency: string;
  };
  appFeeMoney?: {
    amount: number;
    currency: string;
  };
  reason?: string;
  createdAt: string;
  updatedAt: string;
  processingFeeMoney?: {
    amount: number;
    currency: string;
  };
}

interface Payment {
  id: string;
  orderId?: string;
  amountMoney: {
    amount: number;
    currency: string;
  };
  refundedMoney?: {
    amount: number;
    currency: string;
  };
  status: string;
  createdAt: string;
}

export default function AdminRefunds() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");

  // Check if user is admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      window.location.href = "/api/login";
    }
  }, [isAuthenticated, isLoading, user]);

  // Fetch refunds
  const { data: refunds = [], isLoading: refundsLoading } = useQuery<Refund[]>({
    queryKey: ['/api/refunds'],
    enabled: isAuthenticated && user?.role === 'admin',
    retry: false
  });

  // Fetch recent payments for refund creation
  const { data: payments = [], isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ['/api/payments/recent'],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Create refund mutation
  const createRefundMutation = useMutation({
    mutationFn: async ({ paymentId, amount, reason }: { paymentId: string; amount: number; reason: string }) => {
      await apiRequest('/api/refunds/create', {
        method: 'POST',
        body: JSON.stringify({
          paymentId,
          amountMoney: {
            amount: Math.round(amount * 100), // Convert to cents
            currency: 'USD'
          },
          reason
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Refund Created",
        description: "The refund has been processed successfully."
      });
      setIsCreateDialogOpen(false);
      setSelectedPayment(null);
      setRefundAmount("");
      setRefundReason("");
      queryClient.invalidateQueries({ queryKey: ['/api/refunds'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payments/recent'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create refund. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Create unlinked refund mutation (for cash/other payments)
  const createUnlinkedRefundMutation = useMutation({
    mutationFn: async ({ amount, reason }: { amount: number; reason: string }) => {
      await apiRequest('/api/refunds/unlinked', {
        method: 'POST',
        body: JSON.stringify({
          amountMoney: {
            amount: Math.round(amount * 100), // Convert to cents
            currency: 'USD'
          },
          reason
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Unlinked Refund Created",
        description: "The cash refund has been recorded successfully."
      });
      setIsCreateDialogOpen(false);
      setRefundAmount("");
      setRefundReason("");
      queryClient.invalidateQueries({ queryKey: ['/api/refunds'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create unlinked refund. Please try again.",
        variant: "destructive"
      });
    }
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

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { variant: "default" | "secondary" | "destructive" | "outline", label: string } } = {
      'PENDING': { variant: 'secondary', label: 'Pending' },
      'APPROVED': { variant: 'default', label: 'Approved' },
      'COMPLETED': { variant: 'default', label: 'Completed' },
      'REJECTED': { variant: 'destructive', label: 'Rejected' },
      'FAILED': { variant: 'destructive', label: 'Failed' }
    };

    const config = statusMap[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount / 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  const totalRefunds = refunds.reduce((sum, r) => sum + r.amountMoney.amount, 0);
  const pendingRefunds = refunds.filter(r => r.status === 'PENDING').length;
  const completedRefunds = refunds.filter(r => r.status === 'COMPLETED').length;

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <div className="w-64 flex-shrink-0">
        <SideNavigation user={user} onLogout={handleLogout} isAdmin={true} />
      </div>
      
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 flex justify-between items-center"
          >
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Refunds Management</h1>
              <p className="text-gray-400">Process and track payment refunds</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Create Refund
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">Create New Refund</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Process a refund for a payment or record a cash refund
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label className="text-gray-300">Select Payment</Label>
                    <Select onValueChange={(value) => {
                      const payment = payments.find(p => p.id === value);
                      setSelectedPayment(payment || null);
                      if (payment) {
                        const availableAmount = (payment.amountMoney.amount - (payment.refundedMoney?.amount || 0)) / 100;
                        setRefundAmount(availableAmount.toFixed(2));
                      }
                    }}>
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                        <SelectValue placeholder="Select a payment to refund" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unlinked">Cash/Other Payment (Unlinked)</SelectItem>
                        {payments.map((payment) => (
                          <SelectItem key={payment.id} value={payment.id}>
                            Payment {payment.id.slice(-8)} - {formatCurrency(payment.amountMoney.amount, 'USD')}
                            {payment.refundedMoney && payment.refundedMoney.amount > 0 && (
                              ` (${formatCurrency(payment.refundedMoney.amount, 'USD')} refunded)`
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-300">Refund Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white"
                      placeholder="0.00"
                    />
                    {selectedPayment && (
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum refundable: {formatCurrency(
                          selectedPayment.amountMoney.amount - (selectedPayment.refundedMoney?.amount || 0),
                          'USD'
                        )}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-gray-300">Reason</Label>
                    <Textarea
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white"
                      placeholder="Enter refund reason..."
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={() => {
                      const amount = parseFloat(refundAmount);
                      if (amount > 0 && refundReason) {
                        if (selectedPayment && selectedPayment.id !== 'unlinked') {
                          createRefundMutation.mutate({
                            paymentId: selectedPayment.id,
                            amount,
                            reason: refundReason
                          });
                        } else {
                          createUnlinkedRefundMutation.mutate({
                            amount,
                            reason: refundReason
                          });
                        }
                      }
                    }}
                    disabled={!refundAmount || !refundReason || createRefundMutation.isPending}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {createRefundMutation.isPending ? "Processing..." : "Create Refund"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>

          {/* Stats Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Refunded</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(totalRefunds, 'USD')}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Pending</p>
                    <p className="text-2xl font-bold text-yellow-400">{pendingRefunds}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Completed</p>
                    <p className="text-2xl font-bold text-green-400">{completedRefunds}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Avg Refund</p>
                    <p className="text-2xl font-bold text-white">
                      {refunds.length > 0 ? formatCurrency(totalRefunds / refunds.length, 'USD') : '$0.00'}
                    </p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Refunds List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Refund History</CardTitle>
                <CardDescription className="text-gray-400">
                  All processed and pending refunds
                </CardDescription>
              </CardHeader>
              <CardContent>
                {refundsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                  </div>
                ) : refunds.length === 0 ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No refunds found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {refunds.map((refund) => (
                      <div key={refund.id} className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <h3 className="text-white font-medium">Refund #{refund.id.slice(-8)}</h3>
                              {getStatusBadge(refund.status)}
                              {refund.paymentId && (
                                <Badge variant="outline" className="text-gray-300 border-gray-600">
                                  <CreditCard className="w-3 h-3 mr-1" />
                                  Payment {refund.paymentId.slice(-8)}
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-400">Amount</p>
                                <p className="text-white font-medium">
                                  {formatCurrency(refund.amountMoney.amount, refund.amountMoney.currency)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-400">Reason</p>
                                <p className="text-white">{refund.reason || 'No reason provided'}</p>
                              </div>
                              <div>
                                <p className="text-gray-400">Processing Fee</p>
                                <p className="text-white">
                                  {refund.processingFeeMoney 
                                    ? formatCurrency(refund.processingFeeMoney.amount, refund.processingFeeMoney.currency)
                                    : '$0.00'
                                  }
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-400">Created</p>
                                <p className="text-white">{format(new Date(refund.createdAt), 'MMM d, yyyy h:mm a')}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}