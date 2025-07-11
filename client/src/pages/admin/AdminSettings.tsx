import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Plus, Store, RefreshCw, Trash2, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import SideNavigation from "@/components/SideNavigation";

interface MerchantConnection {
  id: string;
  merchantId: string;
  merchantName?: string;
  locationIds?: string[];
  scopes: string[];
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminSettings() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      window.location.href = "/api/login";
    }
  }, [isAuthenticated, isLoading, user]);

  // Fetch merchant connections
  const { data: connections = [], isLoading: connectionsLoading } = useQuery<MerchantConnection[]>({
    queryKey: ['/api/oauth/connections']
  });

  // Delete connection mutation
  const deleteMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      await apiRequest(`/api/oauth/connections/${connectionId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "Connection Removed",
        description: "The Square merchant connection has been removed."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/oauth/connections'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove the connection. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Refresh token mutation
  const refreshMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      await apiRequest(`/api/oauth/token/refresh/${connectionId}`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      toast({
        title: "Token Refreshed",
        description: "The access token has been refreshed successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/oauth/connections'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to refresh the token. Please try again.",
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

  const handleConnectSquare = () => {
    setIsConnecting(true);
    // Redirect to Square OAuth authorization
    window.location.href = '/api/oauth/square/authorize';
  };

  const isTokenExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <div className="w-64 flex-shrink-0">
        <SideNavigation user={user} onLogout={handleLogout} isAdmin={true} />
      </div>
      
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
            <p className="text-gray-400">Manage your Square merchant connections and integrations</p>
          </div>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-white">Square Merchant Connections</CardTitle>
                  <CardDescription className="text-gray-400 mt-2">
                    Connect multiple Square merchant accounts to process payments and manage gift cards
                  </CardDescription>
                </div>
                <Button
                  onClick={handleConnectSquare}
                  disabled={isConnecting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Connect Square Account
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {connectionsLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto" />
                  <p className="text-gray-400 mt-2">Loading connections...</p>
                </div>
              ) : connections.length === 0 ? (
                <Alert className="bg-gray-700 border-gray-600">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-gray-300">
                    No Square accounts connected yet. Click "Connect Square Account" to get started.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {connections.map((connection) => (
                    <div
                      key={connection.id}
                      className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Store className="h-5 w-5 text-gray-400" />
                            <h3 className="text-lg font-semibold text-white">
                              {connection.merchantName || `Merchant ${connection.merchantId}`}
                            </h3>
                            {!isTokenExpired(connection.expiresAt) ? (
                              <Badge className="bg-green-600 text-white">Active</Badge>
                            ) : (
                              <Badge className="bg-red-600 text-white">Expired</Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-400 mb-3">
                            <div>
                              <span className="font-medium">Merchant ID:</span> {connection.merchantId}
                            </div>
                            <div>
                              <span className="font-medium">Connected:</span> {formatDate(connection.createdAt)}
                            </div>
                            <div>
                              <span className="font-medium">Expires:</span> {formatDate(connection.expiresAt)}
                            </div>
                            <div>
                              <span className="font-medium">Locations:</span> {connection.locationIds?.length || 0}
                            </div>
                          </div>

                          <div className="mb-3">
                            <span className="text-sm font-medium text-gray-400">Permissions:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {connection.scopes.map((scope) => (
                                <Badge key={scope} variant="outline" className="text-xs text-gray-300 border-gray-600">
                                  {scope.replace(/_/g, ' ').toLowerCase()}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refreshMutation.mutate(connection.id)}
                            disabled={refreshMutation.isPending}
                            className="text-gray-300 border-gray-600 hover:bg-gray-700"
                          >
                            <RefreshCw className={`h-4 w-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteMutation.mutate(connection.id)}
                            disabled={deleteMutation.isPending}
                            className="text-red-500 border-gray-600 hover:bg-red-950"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Separator className="my-6 bg-gray-700" />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">OAuth Integration Details</h3>
                <Alert className="bg-gray-700 border-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-gray-300">
                    <strong>Production Ready:</strong> The OAuth integration supports multiple merchant connections,
                    automatic token refresh, and secure token storage. Each merchant can have different permission
                    levels based on the OAuth scopes granted during authorization.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <h4 className="font-medium text-white mb-2">Supported OAuth Scopes</h4>
                    <ul className="space-y-1 text-gray-400">
                      <li>• PAYMENTS_READ & PAYMENTS_WRITE</li>
                      <li>• MERCHANT_PROFILE_READ</li>
                      <li>• CUSTOMERS_READ & CUSTOMERS_WRITE</li>
                      <li>• ORDERS_READ & ORDERS_WRITE</li>
                      <li>• GIFTCARDS_READ & GIFTCARDS_WRITE</li>
                    </ul>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <h4 className="font-medium text-white mb-2">Security Features</h4>
                    <ul className="space-y-1 text-gray-400">
                      <li>• State parameter for CSRF protection</li>
                      <li>• Secure token storage with encryption</li>
                      <li>• Automatic token refresh before expiry</li>
                      <li>• Token introspection for validation</li>
                      <li>• PKCE ready for enhanced security</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}