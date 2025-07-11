import { useEffect, useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  Users, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Wallet,
  ShoppingBag,
  Plus,
  AlertTriangle,
  Eye,
  Calendar,
  Clock,
  MoreVertical
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

const CARD_GRADIENTS = [
  'bg-gradient-to-br from-pink-500 via-rose-500 to-red-500',
  'bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500', 
  'bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600',
  'bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500'
];

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCard, setSelectedCard] = useState(0);

  // Check if user is admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  // WebSocket connection for real-time fraud alerts
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      setWsConnected(true);
      console.log('WebSocket connected');
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'fraud-alert') {
          setFraudAlerts(prev => [data.data, ...prev]);
          toast({
            title: "🚨 Fraud Alert",
            description: `${data.data.alertType} - ${data.data.severity.toUpperCase()}`,
            variant: "destructive",
          });
        } else if (data.type === 'transaction' || data.type === 'revenue_update') {
          // Handle real-time transaction/revenue updates
          setFraudAlerts(prev => [data, ...prev.slice(0, 4)]);
          
          // Refresh stats and transactions
          queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
          queryClient.invalidateQueries({ queryKey: ['/api/admin/transactions'] });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onclose = () => {
      setWsConnected(false);
      console.log('WebSocket disconnected');
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsConnected(false);
    };
    
    return () => {
      ws.close();
    };
  }, [isAuthenticated, user, toast]);

  // Fetch dashboard stats
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    retry: false,
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Fetch recent transactions
  const { data: recentTransactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/admin/transactions'],
    retry: false,
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Fetch fraud alerts
  const { data: dbFraudAlerts, isLoading: fraudAlertsLoading } = useQuery({
    queryKey: ['/api/admin/fraud-alerts'],
    retry: false,
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Resolve fraud alert mutation
  const resolveFraudAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await apiRequest('POST', `/api/admin/fraud-alerts/${alertId}/resolve`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/fraud-alerts'] });
      toast({
        title: "Alert Resolved",
        description: "Fraud alert has been marked as resolved.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to resolve fraud alert.",
        variant: "destructive",
      });
    },
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="loading-shimmer w-32 h-32 rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation 
        user={user} 
        onLogout={handleLogout}
        showDashboard={true}
      />
      
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Admin Dashboard</h1>
                <p className="text-xl text-gray-300">
                  Complete overview of gift card operations
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Badge 
                  variant={wsConnected ? "default" : "destructive"}
                  className={wsConnected ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}
                >
                  <Activity className="w-3 h-3 mr-1" />
                  {wsConnected ? 'Live' : 'Offline'}
                </Badge>
                <Badge variant="secondary" className="bg-primary/20 text-primary">
                  Administrator
                </Badge>
              </div>
            </div>
          </motion.div>

          {/* Stats Overview */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-12"
          >
            <AdminStats 
              stats={dashboardStats} 
              isLoading={statsLoading}
            />
          </motion.div>

          {/* Live Revenue Tracker */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mb-12"
          >
            <LiveRevenueTracker 
              wsData={fraudAlerts[0]} 
              todayRevenue={dashboardStats?.totalSales || 0}
              yesterdayRevenue={dashboardStats?.totalSales ? dashboardStats.totalSales * 0.9 : 0}
            />
          </motion.div>

          {/* Revenue Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-12"
          >
            <RevenueChart 
              data={recentTransactions}
              isLoading={transactionsLoading}
              wsData={fraudAlerts[0]}
            />
          </motion.div>

          {/* Transaction Trends */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mb-12"
          >
            <TransactionTrends 
              data={recentTransactions}
              isLoading={transactionsLoading}
            />
          </motion.div>

          {/* Card Distribution */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mb-12"
          >
            <CardDistribution 
              data={dashboardStats}
              isLoading={statsLoading}
            />
          </motion.div>

          {/* Main Content Tabs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Tabs defaultValue="transactions" className="w-full">
              <TabsList className="grid w-full grid-cols-4 max-w-lg bg-white/10 border-white/20">
                <TabsTrigger value="transactions" className="text-white data-[state=active]:bg-primary data-[state=active]:text-white">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Transactions
                </TabsTrigger>
                <TabsTrigger value="charts" className="text-white data-[state=active]:bg-primary data-[state=active]:text-white">
                  <ChartBar className="w-4 h-4 mr-2" />
                  Charts
                </TabsTrigger>
                <TabsTrigger value="fraud" className="text-white data-[state=active]:bg-primary data-[state=active]:text-white">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Fraud
                </TabsTrigger>
                <TabsTrigger value="analytics" className="text-white data-[state=active]:bg-primary data-[state=active]:text-white">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="transactions" className="mt-6">
                <Card className="glassmorphism border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <div className="flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2" />
                        Recent Transactions
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TransactionList 
                      transactions={recentTransactions} 
                      isLoading={transactionsLoading}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="fraud" className="mt-6">
                <Card className="glassmorphism border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <div className="flex items-center">
                        <Shield className="w-5 h-5 mr-2" />
                        Fraud Alerts
                      </div>
                      <Badge 
                        variant="destructive" 
                        className="bg-red-500/20 text-red-300"
                      >
                        {(dbFraudAlerts?.length || 0) + fraudAlerts.length} Active
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {fraudAlertsLoading ? (
                      <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="loading-shimmer h-16 rounded-lg"></div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Real-time fraud alerts */}
                        {fraudAlerts.map((alert, index) => (
                          <div key={`realtime-${index}`} className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                                  <AlertTriangle className="w-5 h-5 text-red-400" />
                                </div>
                                <div>
                                  <div className="text-white font-semibold">{alert.alertType}</div>
                                  <div className="text-red-400 text-sm">
                                    Severity: {alert.severity.toUpperCase()} • Just now
                                  </div>
                                </div>
                              </div>
                              <Badge variant="destructive" className="bg-red-500/20 text-red-300">
                                LIVE
                              </Badge>
                            </div>
                            <p className="text-gray-300 text-sm mt-2">{alert.description}</p>
                          </div>
                        ))}

                        {/* Database fraud alerts */}
                        {dbFraudAlerts && dbFraudAlerts.length > 0 ? (
                          dbFraudAlerts.map((alert: any) => (
                            <div key={alert.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                                  </div>
                                  <div>
                                    <div className="text-white font-semibold">{alert.alertType}</div>
                                    <div className="text-gray-400 text-sm">
                                      Severity: {alert.severity.toUpperCase()} • {new Date(alert.createdAt).toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge 
                                    variant={alert.resolved ? "default" : "destructive"}
                                    className={alert.resolved ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}
                                  >
                                    {alert.resolved ? 'Resolved' : 'Active'}
                                  </Badge>
                                  {!alert.resolved && (
                                    <Button 
                                      size="sm"
                                      onClick={() => resolveFraudAlertMutation.mutate(alert.id)}
                                      disabled={resolveFraudAlertMutation.isPending}
                                      className="bg-green-500/20 text-green-300 hover:bg-green-500/30"
                                    >
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Resolve
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <p className="text-gray-300 text-sm mt-2">{alert.description}</p>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-400">No fraud alerts at this time</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="glassmorphism border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white">Revenue Analytics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Total Revenue</span>
                          <span className="text-2xl font-bold text-white">
                            ${dashboardStats?.totalSales?.toLocaleString() || '0'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Cards Issued</span>
                          <span className="text-xl font-bold text-white">
                            {dashboardStats?.cardsIssued || '0'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Redemption Rate</span>
                          <span className="text-xl font-bold text-white">
                            {dashboardStats?.cardsIssued ? 
                              Math.round((dashboardStats.redemptionsCount / dashboardStats.cardsIssued) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glassmorphism border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white">System Health</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">WebSocket Status</span>
                          <div className="flex items-center">
                            {wsConnected ? (
                              <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400 mr-2" />
                            )}
                            <span className={`text-sm ${wsConnected ? 'text-green-400' : 'text-red-400'}`}>
                              {wsConnected ? 'Connected' : 'Disconnected'}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Active Balance</span>
                          <span className="text-xl font-bold text-white">
                            ${dashboardStats?.activeBalance?.toLocaleString() || '0'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Fraud Alerts</span>
                          <span className="text-xl font-bold text-red-400">
                            {(dbFraudAlerts?.filter((a: any) => !a.resolved).length || 0) + fraudAlerts.length}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="charts" className="mt-6">
                <div className="space-y-6">
                  {/* Remove duplicate charts from here since they're already shown above */}
                  <Card className="glassmorphism border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white">
                        <ChartBar className="w-5 h-5 inline mr-2" />
                        Real-Time Analytics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300">
                        Charts are displayed above the tabs section for better visibility. 
                        This tab provides a focused view on chart customization and analysis.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
