import { useEffect, useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  PageContainer, 
  GradientButton,
  GlassCard,
  LoadingSpinner 
} from "@/components/DesignSystem";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Eye,
  Calendar,
  Clock,
  MoreVertical,
  Search,
  Bell
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import SideNavigation from "@/components/SideNavigation";
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

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCard, setSelectedCard] = useState(0);
  const [greeting, setGreeting] = useState('');

  // Check if user is admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      window.location.href = "/api/login";
    }
  }, [isAuthenticated, isLoading, user]);

  // Set greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Morning');
    else if (hour < 17) setGreeting('Afternoon');
    else setGreeting('Evening');
  }, []);

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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  // Calculate stats
  const totalAmount = dashboardStats?.totalSales || 4321.65;
  const totalBalance = dashboardStats?.activeBalance || 2500.00;
  const freelanceAmount = 1500.00;
  const rentPayment = 321.65;

  // Generate chart data
  const summaryData = [
    { month: 'Jan', value: 2800 },
    { month: 'Feb', value: 3200 },
    { month: 'Mar', value: 2900 },
    { month: 'Apr', value: 3500 },
    { month: 'May', value: 3100 },
    { month: 'Jun', value: 3800 },
    { month: 'Jul', value: 4200 },
    { month: 'Aug', value: 4800 },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Side Navigation */}
      <div className="w-64 flex-shrink-0">
        <SideNavigation user={user} onLogout={handleLogout} isAdmin={true} />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-x-hidden">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-bold text-white">
                Good {greeting}, {user?.firstName || 'Admin'}!
              </h1>
              <p className="text-gray-400 mt-1">
                Welcome to your gift card management portal
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Cards and Stats */}
              <div className="lg:col-span-2 space-y-6">
                {/* Gift Cards Section */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <h2 className="text-xl font-semibold text-white mb-4">Active Gift Cards</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Gift Card Templates */}
                    {[0, 1, 2].map((index) => (
                      <div key={index} className={`${CARD_GRADIENTS[index]} rounded-2xl p-6 text-white relative overflow-hidden cursor-pointer transform transition-all hover:scale-105`}>
                        <div className="absolute top-4 right-4">
                          <CreditCard className="w-8 h-8 opacity-50" />
                        </div>
                        <div className="space-y-4">
                          <p className="text-xs opacity-80">Gift Card</p>
                          <p className="text-2xl font-bold">${(index + 1) * 100}.00</p>
                          <p className="text-xs opacity-80">Click to view details</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Revenue Overview */}
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center justify-between">
                        <span className="flex items-center">
                          <TrendingUp className="w-5 h-5 mr-2" />
                          Revenue Analytics
                        </span>
                        <span className="text-2xl font-bold text-green-400">
                          ${totalAmount.toFixed(2)}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-gray-900 rounded-lg p-4 text-center">
                          <p className="text-2xl font-bold text-white">${totalBalance.toFixed(2)}</p>
                          <p className="text-xs text-gray-400 mt-1">Total Balance</p>
                        </div>
                        <div className="bg-gray-900 rounded-lg p-4 text-center">
                          <p className="text-2xl font-bold text-white">{dashboardStats?.cardsIssued || 0}</p>
                          <p className="text-xs text-gray-400 mt-1">Cards Issued</p>
                        </div>
                        <div className="bg-gray-900 rounded-lg p-4 text-center">
                          <p className="text-2xl font-bold text-white">{dashboardStats?.redemptionsCount || 0}</p>
                          <p className="text-xs text-gray-400 mt-1">Redemptions</p>
                        </div>
                      </div>

                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={summaryData}>
                            <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="month" stroke="#666" />
                            <YAxis hide />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'rgba(17, 24, 39, 0.9)',
                                border: '1px solid #374151',
                                borderRadius: '8px'
                              }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="value" 
                              stroke="#10b981" 
                              fillOpacity={1} 
                              fill="url(#colorValue)" 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Right Column - Transactions */}
              <div className="space-y-6">
                {/* Recent Transactions */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">
                        <Activity className="w-5 h-5 inline mr-2" />
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(recentTransactions?.slice(0, 6) || []).map((transaction: any, index: number) => (
                          <div key={transaction.id || index} className="flex items-center justify-between p-2 rounded hover:bg-gray-700 transition-colors">
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 rounded-full ${
                                transaction.type === 'purchase' ? 'bg-green-500' : 'bg-red-500'
                              } bg-opacity-20 flex items-center justify-center`}>
                                {transaction.type === 'purchase' ? (
                                  <ArrowUpRight className="w-5 h-5 text-green-500" />
                                ) : (
                                  <ArrowDownRight className="w-5 h-5 text-red-500" />
                                )}
                              </div>
                              <div>
                                <p className="text-white font-medium text-sm">
                                  {transaction.type === 'purchase' ? 'Card Purchase' : 'Card Redemption'}
                                </p>
                                <p className="text-gray-400 text-xs">
                                  {new Date(transaction.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <p className={`font-semibold ${
                              transaction.type === 'purchase' ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {transaction.type === 'purchase' ? '+' : '-'}${transaction.amount}
                            </p>
                          </div>
                        ))}
                      </div>
                      <Link href="/admin/transactions">
                        <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white">
                          View All Transactions
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Quick Stats */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Today's Sales</span>
                        <span className="text-white font-semibold">$1,234.56</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Active Cards</span>
                        <span className="text-white font-semibold">{dashboardStats?.cardsIssued || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Pending Balance</span>
                        <span className="text-white font-semibold">${dashboardStats?.activeBalance || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Customers</span>
                        <span className="text-white font-semibold">156</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}