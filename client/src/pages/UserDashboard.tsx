import { useEffect, useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  TrendingUp, 
  ShoppingBag, 
  Activity,
  Wallet,
  ArrowRight,
  Gift,
  Clock,
  DollarSign
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import SideNavigation from "@/components/SideNavigation";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis
} from 'recharts';

const CARD_GRADIENTS = [
  'bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500',
  'bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600',
  'bg-gradient-to-br from-pink-500 via-rose-500 to-red-500',
];

const CHART_COLORS = ['#10b981', '#3b82f6', '#ec4899', '#f59e0b', '#8b5cf6'];

export default function UserDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [greeting, setGreeting] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [isAuthenticated, isLoading]);

  // Set greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Morning');
    else if (hour < 17) setGreeting('Afternoon');
    else setGreeting('Evening');
  }, []);

  // Get user's gift cards
  const { data: myGiftCards, isLoading: cardsLoading } = useQuery({
    queryKey: ['/api/giftcards/mine'],
    retry: false,
    enabled: isAuthenticated,
  });

  // Get user's transactions from all transactions
  const { data: allTransactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/admin/transactions'], 
    retry: false,
    enabled: isAuthenticated,
  });

  // Get user's order history  
  const { data: orderHistory, isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/user/orders'],
    retry: false,
    enabled: isAuthenticated,
  });

  const handleLogout = () => {
    toast({
      title: "Logging out...",
      description: "You will be redirected shortly.",
    });
    setTimeout(() => {
      window.location.href = '/api/logout';
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Calculate stats
  const totalBalance = myGiftCards?.reduce((sum: number, card: any) => 
    sum + parseFloat(card.balance), 0) || 0;
  
  const totalSpent = orderHistory?.orders?.reduce((sum: number, order: any) => 
    sum + parseFloat(order.amount), 0) || 0;

  // Filter transactions for current user's gift cards
  const userCardIds = myGiftCards?.map((card: any) => card.id) || [];
  const myTransactions = allTransactions?.filter((transaction: any) => 
    userCardIds.includes(transaction.giftCardId)
  ) || [];
  
  const recentTransactions = myTransactions.slice(0, 10);

  // Calculate spending by category (design)
  const spendingByCategory = myGiftCards?.reduce((acc: any, card: any) => {
    const design = card.design || 'standard';
    acc[design] = (acc[design] || 0) + parseFloat(card.initialBalance) - parseFloat(card.balance);
    return acc;
  }, {}) || {};

  const pieChartData = Object.entries(spendingByCategory).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: value as number
  }));

  // Generate monthly spending data
  const monthlyData = [
    { month: 'Jan', amount: 120 },
    { month: 'Feb', amount: 200 },
    { month: 'Mar', amount: 150 },
    { month: 'Apr', amount: 300 },
    { month: 'May', amount: 250 },
    { month: 'Jun', amount: 180 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Side Navigation */}
      <div className="w-64 flex-shrink-0">
        <SideNavigation user={user} onLogout={handleLogout} isAdmin={false} />
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
              <h1 className="text-3xl font-bold text-gray-900">
                Good {greeting}, {user?.firstName || user?.username || 'Guest'}!
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your gift cards and track your balance
              </p>
            </motion.div>

            {/* Stats Overview */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
            >
              <Card className="bg-white border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Balance</p>
                      <p className="text-2xl font-bold text-gray-900">${totalBalance.toFixed(2)}</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full">
                      <Wallet className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Cards Owned</p>
                      <p className="text-2xl font-bold text-gray-900">{myGiftCards?.length || 0}</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                      <CreditCard className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Spent</p>
                      <p className="text-2xl font-bold text-gray-900">${totalSpent.toFixed(2)}</p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-full">
                      <ShoppingBag className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Recent Activity</p>
                      <p className="text-2xl font-bold text-gray-900">{myTransactions.length}</p>
                    </div>
                    <div className="bg-orange-100 p-3 rounded-full">
                      <Activity className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Gift Cards */}
              <div className="lg:col-span-2 space-y-6">
                {/* My Gift Cards */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <Card className="bg-white border-gray-200">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center">
                          <Gift className="w-5 h-5 mr-2" />
                          My Gift Cards
                        </span>
                        <Link href="/shop">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                            <Plus className="w-4 h-4 mr-1" />
                            Buy New
                          </Button>
                        </Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {myGiftCards && myGiftCards.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {myGiftCards.slice(0, 4).map((card: any, index: number) => (
                            <div
                              key={card.id}
                              className={`${CARD_GRADIENTS[index % CARD_GRADIENTS.length]} rounded-xl p-4 text-white relative overflow-hidden cursor-pointer transform transition-all hover:scale-105`}
                            >
                              <div className="absolute top-2 right-2">
                                <CreditCard className="w-6 h-6 opacity-50" />
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs opacity-80">{card.design || 'Standard'} Card</p>
                                <p className="text-xl font-bold">${parseFloat(card.balance).toFixed(2)}</p>
                                <p className="text-xs opacity-80">Code: {card.code.slice(0, 8)}...</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No gift cards yet</p>
                          <Link href="/shop">
                            <Button className="mt-4 bg-green-600 hover:bg-green-700 text-white">
                              Buy Your First Card
                            </Button>
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Monthly Spending */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <Card className="bg-white border-gray-200">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2" />
                        Monthly Gift Card Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={monthlyData}>
                            <defs>
                              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="month" stroke="#888" />
                            <YAxis stroke="#888" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px'
                              }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="amount" 
                              stroke="#10b981" 
                              fillOpacity={1} 
                              fill="url(#colorAmount)" 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Right Column - Activity & Actions */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <Card className="bg-white border-gray-200">
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Link href="/shop">
                        <Button className="w-full bg-green-600 hover:bg-green-700 text-white justify-between">
                          <span className="flex items-center">
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            Buy Gift Card
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Link href="/balance">
                        <Button variant="outline" className="w-full justify-between">
                          <span className="flex items-center">
                            <Wallet className="w-4 h-4 mr-2" />
                            Check Balance
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Link href="/redeem">
                        <Button variant="outline" className="w-full justify-between">
                          <span className="flex items-center">
                            <CreditCard className="w-4 h-4 mr-2" />
                            Redeem Card
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Recent Activity */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <Card className="bg-white border-gray-200">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Clock className="w-5 h-5 mr-2" />
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {recentTransactions.length > 0 ? (
                          recentTransactions.slice(0, 5).map((transaction: any) => (
                            <div key={transaction.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-full ${
                                  transaction.type === 'purchase' ? 'bg-green-100' : 'bg-red-100'
                                } flex items-center justify-center`}>
                                  <DollarSign className={`w-4 h-4 ${
                                    transaction.type === 'purchase' ? 'text-green-600' : 'text-red-600'
                                  }`} />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {transaction.type === 'purchase' ? 'Purchased' : 'Redeemed'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(transaction.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <p className={`text-sm font-semibold ${
                                transaction.type === 'purchase' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {transaction.type === 'purchase' ? '+' : '-'}${transaction.amount}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-gray-500 py-4">No recent activity</p>
                        )}
                      </div>
                      {recentTransactions.length > 5 && (
                        <Link href="/orders">
                          <Button variant="ghost" className="w-full mt-2">
                            View All Activity
                          </Button>
                        </Link>
                      )}
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