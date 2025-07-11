import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Link2, Plus, Copy, ExternalLink, Trash2, DollarSign, ShoppingBag, Gift, CheckCircle } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import SideNavigation from "@/components/SideNavigation";
import { format } from "date-fns";

interface PaymentLink {
  id: string;
  version: number;
  url: string;
  checkoutOptions: {
    acceptedPaymentMethods?: {
      applePay?: boolean;
      googlePay?: boolean;
      cashApp?: boolean;
      afterpayClearpay?: boolean;
    };
    askForShippingAddress?: boolean;
    allowTipping?: boolean;
    redirectUrl?: string;
    merchantSupportEmail?: string;
  };
  description?: string;
  orderId?: string;
  paymentNote?: string;
  prePopulatedData?: {
    buyerEmail?: string;
    buyerPhoneNumber?: string;
    buyerAddress?: any;
  };
  createdAt: string;
  updatedAt: string;
  metadata?: {
    recipientName?: string;
    recipientEmail?: string;
    senderName?: string;
    message?: string;
  };
}

export default function AdminPaymentLinks() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [linkType, setLinkType] = useState<'gift-card' | 'quick-pay'>('gift-card');
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    recipientName: '',
    recipientEmail: '',
    senderName: '',
    message: '',
    buyerEmail: '',
    buyerPhone: '',
    acceptApplePay: true,
    acceptGooglePay: true,
    acceptCashApp: true,
    acceptAfterpayClearpay: false,
    askForShippingAddress: false,
    allowTipping: false,
    redirectUrl: '',
    merchantSupportEmail: ''
  });

  // Check if user is admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      window.location.href = "/api/login";
    }
  }, [isAuthenticated, isLoading, user]);

  // Fetch payment links
  const { data: paymentLinks = [], isLoading: linksLoading } = useQuery<PaymentLink[]>({
    queryKey: ['/api/payment-links'],
    enabled: isAuthenticated && user?.role === 'admin',
    retry: false
  });

  // Create payment link mutation
  const createLinkMutation = useMutation({
    mutationFn: async () => {
      const endpoint = linkType === 'gift-card' 
        ? '/api/payment-links/gift-card'
        : '/api/payment-links/quick-pay';

      const body = linkType === 'gift-card' ? {
        amount: parseFloat(formData.amount),
        description: formData.description,
        recipientName: formData.recipientName,
        recipientEmail: formData.recipientEmail,
        senderName: formData.senderName,
        message: formData.message,
        checkoutOptions: {
          acceptedPaymentMethods: {
            applePay: formData.acceptApplePay,
            googlePay: formData.acceptGooglePay,
            cashApp: formData.acceptCashApp,
            afterpayClearpay: formData.acceptAfterpayClearpay
          },
          askForShippingAddress: formData.askForShippingAddress,
          allowTipping: formData.allowTipping,
          redirectUrl: formData.redirectUrl || undefined,
          merchantSupportEmail: formData.merchantSupportEmail || undefined
        },
        prePopulatedData: {
          buyerEmail: formData.buyerEmail || undefined,
          buyerPhoneNumber: formData.buyerPhone || undefined
        }
      } : {
        amount: parseFloat(formData.amount),
        description: formData.description,
        checkoutOptions: {
          acceptedPaymentMethods: {
            applePay: formData.acceptApplePay,
            googlePay: formData.acceptGooglePay,
            cashApp: formData.acceptCashApp,
            afterpayClearpay: formData.acceptAfterpayClearpay
          },
          askForShippingAddress: formData.askForShippingAddress,
          allowTipping: formData.allowTipping,
          redirectUrl: formData.redirectUrl || undefined,
          merchantSupportEmail: formData.merchantSupportEmail || undefined
        },
        prePopulatedData: {
          buyerEmail: formData.buyerEmail || undefined,
          buyerPhoneNumber: formData.buyerPhone || undefined
        }
      };

      return await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Payment Link Created",
        description: "The payment link has been created successfully."
      });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/payment-links'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create payment link. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete payment link mutation
  const deleteLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      await apiRequest(`/api/payment-links/${linkId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "Link Deleted",
        description: "The payment link has been deleted successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payment-links'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete payment link. Please try again.",
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Link copied to clipboard"
    });
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

  const giftCardLinks = paymentLinks.filter(link => link.metadata?.recipientName);
  const quickPayLinks = paymentLinks.filter(link => !link.metadata?.recipientName);

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
              <h1 className="text-3xl font-bold text-white mb-2">Payment Links</h1>
              <p className="text-gray-400">Create and manage Square payment links</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Link
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-white">Create Payment Link</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Generate a secure payment link for customers
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <Tabs value={linkType} onValueChange={(v) => setLinkType(v as any)}>
                    <TabsList className="grid w-full grid-cols-2 bg-gray-700">
                      <TabsTrigger value="gift-card" className="data-[state=active]:bg-purple-600">
                        Gift Card Link
                      </TabsTrigger>
                      <TabsTrigger value="quick-pay" className="data-[state=active]:bg-purple-600">
                        Quick Pay Link
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="gift-card" className="space-y-4">
                      <div>
                        <Label className="text-gray-300">Amount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.amount}
                          onChange={(e) => setFormData({...formData, amount: e.target.value})}
                          className="bg-gray-900 border-gray-700 text-white"
                          placeholder="50.00"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Description</Label>
                        <Input
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          className="bg-gray-900 border-gray-700 text-white"
                          placeholder="Gift Card Purchase"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-300">Recipient Name</Label>
                          <Input
                            value={formData.recipientName}
                            onChange={(e) => setFormData({...formData, recipientName: e.target.value})}
                            className="bg-gray-900 border-gray-700 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-300">Recipient Email</Label>
                          <Input
                            type="email"
                            value={formData.recipientEmail}
                            onChange={(e) => setFormData({...formData, recipientEmail: e.target.value})}
                            className="bg-gray-900 border-gray-700 text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-gray-300">Sender Name</Label>
                        <Input
                          value={formData.senderName}
                          onChange={(e) => setFormData({...formData, senderName: e.target.value})}
                          className="bg-gray-900 border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Gift Message</Label>
                        <Textarea
                          value={formData.message}
                          onChange={(e) => setFormData({...formData, message: e.target.value})}
                          className="bg-gray-900 border-gray-700 text-white"
                          rows={3}
                        />
                      </div>
                    </TabsContent>
                    <TabsContent value="quick-pay" className="space-y-4">
                      <div>
                        <Label className="text-gray-300">Amount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.amount}
                          onChange={(e) => setFormData({...formData, amount: e.target.value})}
                          className="bg-gray-900 border-gray-700 text-white"
                          placeholder="100.00"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Description</Label>
                        <Input
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          className="bg-gray-900 border-gray-700 text-white"
                          placeholder="Quick Payment"
                        />
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="space-y-4 border-t border-gray-700 pt-4">
                    <h3 className="text-white font-medium">Pre-populate Buyer Info</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">Buyer Email</Label>
                        <Input
                          type="email"
                          value={formData.buyerEmail}
                          onChange={(e) => setFormData({...formData, buyerEmail: e.target.value})}
                          className="bg-gray-900 border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Buyer Phone</Label>
                        <Input
                          value={formData.buyerPhone}
                          onChange={(e) => setFormData({...formData, buyerPhone: e.target.value})}
                          className="bg-gray-900 border-gray-700 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 border-t border-gray-700 pt-4">
                    <h3 className="text-white font-medium">Payment Methods</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-300">Apple Pay</Label>
                        <Switch
                          checked={formData.acceptApplePay}
                          onCheckedChange={(checked) => setFormData({...formData, acceptApplePay: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-300">Google Pay</Label>
                        <Switch
                          checked={formData.acceptGooglePay}
                          onCheckedChange={(checked) => setFormData({...formData, acceptGooglePay: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-300">Cash App</Label>
                        <Switch
                          checked={formData.acceptCashApp}
                          onCheckedChange={(checked) => setFormData({...formData, acceptCashApp: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-300">Afterpay/Clearpay</Label>
                        <Switch
                          checked={formData.acceptAfterpayClearpay}
                          onCheckedChange={(checked) => setFormData({...formData, acceptAfterpayClearpay: checked})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 border-t border-gray-700 pt-4">
                    <h3 className="text-white font-medium">Additional Options</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-300">Ask for Shipping Address</Label>
                        <Switch
                          checked={formData.askForShippingAddress}
                          onCheckedChange={(checked) => setFormData({...formData, askForShippingAddress: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-300">Allow Tipping</Label>
                        <Switch
                          checked={formData.allowTipping}
                          onCheckedChange={(checked) => setFormData({...formData, allowTipping: checked})}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-300">Redirect URL (after payment)</Label>
                      <Input
                        value={formData.redirectUrl}
                        onChange={(e) => setFormData({...formData, redirectUrl: e.target.value})}
                        className="bg-gray-900 border-gray-700 text-white"
                        placeholder="https://example.com/thank-you"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Support Email</Label>
                      <Input
                        type="email"
                        value={formData.merchantSupportEmail}
                        onChange={(e) => setFormData({...formData, merchantSupportEmail: e.target.value})}
                        className="bg-gray-900 border-gray-700 text-white"
                        placeholder="support@example.com"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => createLinkMutation.mutate()}
                    disabled={!formData.amount || createLinkMutation.isPending}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {createLinkMutation.isPending ? "Creating..." : "Create Payment Link"}
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
                    <p className="text-sm text-gray-400">Total Links</p>
                    <p className="text-2xl font-bold text-white">{paymentLinks.length}</p>
                  </div>
                  <Link2 className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Gift Card Links</p>
                    <p className="text-2xl font-bold text-green-400">{giftCardLinks.length}</p>
                  </div>
                  <Gift className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Quick Pay Links</p>
                    <p className="text-2xl font-bold text-blue-400">{quickPayLinks.length}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Active Today</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      {paymentLinks.filter(link => {
                        const today = new Date().toDateString();
                        return new Date(link.createdAt).toDateString() === today;
                      }).length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment Links List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Payment Links</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage all active payment links
                </CardDescription>
              </CardHeader>
              <CardContent>
                {linksLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                  </div>
                ) : paymentLinks.length === 0 ? (
                  <div className="text-center py-8">
                    <Link2 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No payment links found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paymentLinks.map((link) => (
                      <div key={link.id} className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <h3 className="text-white font-medium">
                                {link.description || `Payment Link #${link.id.slice(-8)}`}
                              </h3>
                              <Badge variant={link.metadata?.recipientName ? "default" : "secondary"}>
                                {link.metadata?.recipientName ? "Gift Card" : "Quick Pay"}
                              </Badge>
                            </div>
                            {link.metadata && (
                              <div className="text-sm text-gray-400 mb-2">
                                {link.metadata.recipientName && (
                                  <p>To: {link.metadata.recipientName} ({link.metadata.recipientEmail})</p>
                                )}
                                {link.metadata.senderName && (
                                  <p>From: {link.metadata.senderName}</p>
                                )}
                              </div>
                            )}
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400">Created:</span>
                                <span className="text-white">{format(new Date(link.createdAt), 'MMM d, yyyy')}</span>
                              </div>
                              {link.orderId && (
                                <div className="flex items-center gap-2">
                                  <ShoppingBag className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-300">Order {link.orderId.slice(-8)}</span>
                                </div>
                              )}
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <code className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300 flex-1 truncate">
                                {link.url}
                              </code>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-600 text-gray-300 hover:bg-gray-700"
                              onClick={() => copyToClipboard(link.url)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-600 text-gray-300 hover:bg-gray-700"
                              onClick={() => window.open(link.url, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-600 text-red-400 hover:bg-red-900"
                              onClick={() => deleteLinkMutation.mutate(link.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
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