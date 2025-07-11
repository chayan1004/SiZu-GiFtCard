import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion } from "framer-motion";
import { Webhook, Plus, Trash2, CheckCircle, XCircle, AlertCircle, Key, Globe, Activity } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import SideNavigation from "@/components/SideNavigation";
import { format } from "date-fns";

interface WebhookSubscription {
  id: string;
  name: string;
  enabled: boolean;
  eventTypes: string[];
  notificationUrl: string;
  apiVersion?: string;
  signatureKey?: string;
  createdAt: string;
  updatedAt: string;
}

const WEBHOOK_EVENT_TYPES = [
  { category: 'Payments', events: [
    { value: 'payment.created', label: 'Payment Created' },
    { value: 'payment.updated', label: 'Payment Updated' }
  ]},
  { category: 'Refunds', events: [
    { value: 'refund.created', label: 'Refund Created' },
    { value: 'refund.updated', label: 'Refund Updated' }
  ]},
  { category: 'Disputes', events: [
    { value: 'dispute.created', label: 'Dispute Created' },
    { value: 'dispute.evidence_added', label: 'Dispute Evidence Added' },
    { value: 'dispute.state_changed', label: 'Dispute State Changed' }
  ]},
  { category: 'Orders', events: [
    { value: 'order.created', label: 'Order Created' },
    { value: 'order.updated', label: 'Order Updated' },
    { value: 'order.fulfillment.updated', label: 'Order Fulfillment Updated' }
  ]},
  { category: 'Gift Cards', events: [
    { value: 'gift_card.created', label: 'Gift Card Created' },
    { value: 'gift_card.updated', label: 'Gift Card Updated' },
    { value: 'gift_card.customer_linked', label: 'Gift Card Linked to Customer' },
    { value: 'gift_card.customer_unlinked', label: 'Gift Card Unlinked from Customer' },
    { value: 'gift_card.activity.created', label: 'Gift Card Activity Created' },
    { value: 'gift_card.activity.updated', label: 'Gift Card Activity Updated' }
  ]},
  { category: 'Customers', events: [
    { value: 'customer.created', label: 'Customer Created' },
    { value: 'customer.updated', label: 'Customer Updated' },
    { value: 'customer.deleted', label: 'Customer Deleted' }
  ]},
  { category: 'OAuth', events: [
    { value: 'oauth.authorization.revoked', label: 'OAuth Authorization Revoked' }
  ]},
  { category: 'Payouts', events: [
    { value: 'payout.sent', label: 'Payout Sent' },
    { value: 'payout.failed', label: 'Payout Failed' }
  ]},
  { category: 'Online Checkout', events: [
    { value: 'online_checkout.location_settings.updated', label: 'Location Settings Updated' },
    { value: 'online_checkout.merchant_settings.updated', label: 'Merchant Settings Updated' }
  ]}
];

export default function AdminWebhooks() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    notificationUrl: '',
    eventTypes: [] as string[]
  });

  // Check if user is admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      window.location.href = "/api/login";
    }
  }, [isAuthenticated, isLoading, user]);

  // Fetch webhook subscriptions
  const { data: subscriptions = [], isLoading: subscriptionsLoading } = useQuery<WebhookSubscription[]>({
    queryKey: ['/api/webhooks/subscriptions'],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Create webhook subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/webhooks/subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          notificationUrl: formData.notificationUrl,
          eventTypes: formData.eventTypes
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Webhook Created",
        description: "The webhook subscription has been created successfully."
      });
      setIsCreateDialogOpen(false);
      setFormData({ name: '', notificationUrl: '', eventTypes: [] });
      queryClient.invalidateQueries({ queryKey: ['/api/webhooks/subscriptions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create webhook subscription. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete webhook subscription mutation
  const deleteSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      await apiRequest(`/api/webhooks/subscriptions/${subscriptionId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "Webhook Deleted",
        description: "The webhook subscription has been deleted successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/webhooks/subscriptions'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete webhook subscription. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Toggle webhook subscription mutation
  const toggleSubscriptionMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      await apiRequest(`/api/webhooks/subscriptions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled })
      });
    },
    onSuccess: () => {
      toast({
        title: "Webhook Updated",
        description: "The webhook subscription has been updated successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/webhooks/subscriptions'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update webhook subscription. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Test webhook mutation
  const testWebhookMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      await apiRequest(`/api/webhooks/subscriptions/${subscriptionId}/test`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      toast({
        title: "Test Event Sent",
        description: "A test webhook event has been sent to the endpoint."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send test webhook. Please try again.",
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

  const toggleEventType = (eventType: string) => {
    setFormData(prev => ({
      ...prev,
      eventTypes: prev.eventTypes.includes(eventType)
        ? prev.eventTypes.filter(e => e !== eventType)
        : [...prev.eventTypes, eventType]
    }));
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

  const activeSubscriptions = subscriptions.filter(s => s.enabled).length;
  const totalEvents = subscriptions.reduce((sum, s) => sum + s.eventTypes.length, 0);

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
              <h1 className="text-3xl font-bold text-white mb-2">Webhook Subscriptions</h1>
              <p className="text-gray-400">Configure webhook endpoints for Square events</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Webhook
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 border-gray-700 max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-white">Create Webhook Subscription</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Configure a new webhook endpoint to receive Square events
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label className="text-gray-300">Subscription Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="bg-gray-900 border-gray-700 text-white"
                      placeholder="Production Webhook"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Notification URL</Label>
                    <Input
                      value={formData.notificationUrl}
                      onChange={(e) => setFormData({...formData, notificationUrl: e.target.value})}
                      className="bg-gray-900 border-gray-700 text-white"
                      placeholder="https://example.com/webhooks/square"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This URL must be publicly accessible and support HTTPS
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-300 mb-2 block">Event Types</Label>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {WEBHOOK_EVENT_TYPES.map((category) => (
                        <div key={category.category} className="space-y-2">
                          <h4 className="text-white font-medium text-sm">{category.category}</h4>
                          <div className="space-y-1">
                            {category.events.map((event) => (
                              <div key={event.value} className="flex items-center space-x-2">
                                <Checkbox
                                  checked={formData.eventTypes.includes(event.value)}
                                  onCheckedChange={() => toggleEventType(event.value)}
                                  className="border-gray-600"
                                />
                                <label className="text-sm text-gray-300 cursor-pointer" onClick={() => toggleEventType(event.value)}>
                                  {event.label}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={() => createSubscriptionMutation.mutate()}
                    disabled={!formData.name || !formData.notificationUrl || formData.eventTypes.length === 0 || createSubscriptionMutation.isPending}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {createSubscriptionMutation.isPending ? "Creating..." : "Create Webhook Subscription"}
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
                    <p className="text-sm text-gray-400">Total Webhooks</p>
                    <p className="text-2xl font-bold text-white">{subscriptions.length}</p>
                  </div>
                  <Webhook className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Active</p>
                    <p className="text-2xl font-bold text-green-400">{activeSubscriptions}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Event Types</p>
                    <p className="text-2xl font-bold text-blue-400">{totalEvents}</p>
                  </div>
                  <Activity className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">API Version</p>
                    <p className="text-2xl font-bold text-yellow-400">2024-01</p>
                  </div>
                  <Globe className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Current Webhook URL */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mb-8"
          >
            <Alert className="bg-gray-800 border-gray-700">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-gray-300">
                <strong className="text-white">Current Webhook URL:</strong> https://sizugiftcard.com/api/webhooks/square
                <br />
                <span className="text-sm">All Square webhook events are received at this endpoint. Configure individual subscriptions below.</span>
              </AlertDescription>
            </Alert>
          </motion.div>

          {/* Webhooks List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Webhook Subscriptions</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage your webhook endpoints and event subscriptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subscriptionsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                  </div>
                ) : subscriptions.length === 0 ? (
                  <div className="text-center py-8">
                    <Webhook className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No webhook subscriptions found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {subscriptions.map((subscription) => (
                      <div key={subscription.id} className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <h3 className="text-white font-medium">{subscription.name}</h3>
                              <Badge variant={subscription.enabled ? "default" : "secondary"}>
                                {subscription.enabled ? "Active" : "Disabled"}
                              </Badge>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-gray-400" />
                                <code className="text-gray-300 bg-gray-800 px-2 py-1 rounded">
                                  {subscription.notificationUrl}
                                </code>
                              </div>
                              {subscription.signatureKey && (
                                <div className="flex items-center gap-2">
                                  <Key className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-400">Signature Key: </span>
                                  <code className="text-gray-300 bg-gray-800 px-2 py-1 rounded">
                                    {subscription.signatureKey.slice(0, 20)}...
                                  </code>
                                </div>
                              )}
                              <div>
                                <p className="text-gray-400 mb-1">Events ({subscription.eventTypes.length}):</p>
                                <div className="flex flex-wrap gap-1">
                                  {subscription.eventTypes.slice(0, 5).map((event) => (
                                    <Badge key={event} variant="outline" className="text-xs text-gray-300 border-gray-600">
                                      {event}
                                    </Badge>
                                  ))}
                                  {subscription.eventTypes.length > 5 && (
                                    <Badge variant="outline" className="text-xs text-gray-300 border-gray-600">
                                      +{subscription.eventTypes.length - 5} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-gray-400">
                                Created: {format(new Date(subscription.createdAt), 'MMM d, yyyy h:mm a')}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              className={subscription.enabled ? "border-yellow-600 text-yellow-400 hover:bg-yellow-900" : "border-green-600 text-green-400 hover:bg-green-900"}
                              onClick={() => toggleSubscriptionMutation.mutate({
                                id: subscription.id,
                                enabled: !subscription.enabled
                              })}
                            >
                              {subscription.enabled ? 'Disable' : 'Enable'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-600 text-gray-300 hover:bg-gray-700"
                              onClick={() => testWebhookMutation.mutate(subscription.id)}
                            >
                              Test
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-600 text-red-400 hover:bg-red-900"
                              onClick={() => deleteSubscriptionMutation.mutate(subscription.id)}
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