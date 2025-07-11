import { useEffect, useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  PieChart,
  Calendar,
  Clock,
  Plus
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell
} from 'recharts';

const CARD_GRADIENTS = [
  'bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500',
  'bg-gradient-to-br from-green-400 via-cyan-500 to-blue-500', 
  'bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600',
  'bg-gradient-to-br from-orange-400 via-red-500 to-pink-500'
];

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

export default function UserDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedCard, setSelectedCard] = useState(0);

  // Get user's gift cards
  const { data: myGiftCards, isLoading: cardsLoading } = useQuery({
    queryKey: ['/api/giftcards/mine'],
    retry: false,
    enabled: isAuthenticated,
  });

  // Get user's transactions from their gift cards
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
      description: "You will be redirected to the login page.",
    });
    setTimeout(() => {
      window.location.href = '/api/logout';
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = "/api/login";
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
  
  // Generate spending data for chart
  const spendingData = [
    { month: 'Jan', amount: 2500 },
    { month: 'Feb', amount: 1800 },
    { month: 'Mar', amount: 3200 },
    { month: 'Apr', amount: 2100 },
    { month: 'May', amount: 2800 },
    { month: 'Jun', amount: 1500 },
  ];

  const categoryData = [
    { name: 'Shopping', value: 35 },
    { name: 'Food', value: 25 },
    { name: 'Entertainment', value: 20 },
    { name: 'Other', value: 20 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <Navigation 
        user={user} 
        onLogout={handleLogout}
        showDashboard={false}
      />
      
      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  My Dashboard
                </h1>
                <p className="text-gray-600 mt-1">
                  Welcome back, {user?.firstName || 'User'}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Cards and Balance */}
            <div className="lg:col-span-2 space-y-6">
              {/* Gift Cards Section */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Card className="bg-white/80 backdrop-blur shadow-lg border-0">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-semibold">My Gift Cards</CardTitle>
                      <Badge className="bg-emerald-100 text-emerald-700 border-0">
                        {myGiftCards?.length || 0} Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Gift Card Display */}
                    <div className="relative h-56 mb-6">
                      {cardsLoading ? (
                        <div className="absolute inset-0 bg-gray-200 rounded-2xl animate-pulse"></div>
                      ) : myGiftCards && myGiftCards.length > 0 ? (
                        <>
                          {myGiftCards.slice(0, 3).map((card: any, index: number) => (
                            <motion.div
                              key={card.id}
                              className={`absolute inset-0 ${CARD_GRADIENTS[index % CARD_GRADIENTS.length]} rounded-2xl p-6 text-white shadow-xl transform transition-all duration-300 cursor-pointer`}
                              style={{
                                zIndex: selectedCard === index ? 10 : 3 - index,
                                transform: `translateX(${selectedCard === index ? 0 : index * 20}px) translateY(${selectedCard === index ? 0 : index * 10}px) scale(${selectedCard === index ? 1 : 0.95})`,
                                opacity: selectedCard === index ? 1 : 0.8,
                              }}
                              onClick={() => setSelectedCard(index)}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="flex flex-col h-full justify-between">
                                <div>
                                  <div className="flex justify-between items-start mb-8">
                                    <CreditCard className="w-10 h-10" />
                                    <span className="text-sm opacity-80">{card.design}</span>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-2xl font-mono tracking-wider">
                                      •••• •••• •••• {card.code.slice(-4)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex justify-between items-end">
                                  <div>
                                    <p className="text-xs opacity-80">Balance</p>
                                    <p className="text-2xl font-bold">${card.balance}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs opacity-80">Expires</p>
                                    <p className="text-sm">
                                      {new Date(card.expiresAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </>
                      ) : (
                        <div className="absolute inset-0 bg-gray-100 rounded-2xl flex items-center justify-center">
                          <div className="text-center">
                            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500">No gift cards yet</p>
                            <Link href="/shop">
                              <Button className="mt-4" size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Get Your First Card
                              </Button>
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Balance Overview */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">
                          ${totalBalance.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">Total Balance</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          ${totalSpent.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">Total Spent</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {myGiftCards?.length || 0}
                        </p>
                        <p className="text-sm text-gray-500">Active Cards</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Spending Chart */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="bg-white/80 backdrop-blur shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold">
                      Monthly Spending
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={spendingData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" stroke="#666" />
                          <YAxis stroke="#666" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              border: '1px solid #e0e0e0',
                              borderRadius: '8px'
                            }}
                          />
                          <Bar 
                            dataKey="amount" 
                            fill="#10b981" 
                            radius={[8, 8, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right Column - Transactions and Stats */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Card className="bg-white/80 backdrop-blur shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold">
                      Spending by Category
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {categoryData.map((category, index) => (
                        <div key={category.name} className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm text-gray-600">
                            {category.name} ({category.value}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Transactions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="bg-white/80 backdrop-blur shadow-lg border-0">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-semibold">
                        Recent Transactions
                      </CardTitle>
                      <Link href="/orders">
                        <Button variant="ghost" size="sm" className="text-primary">
                          View All
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {transactionsLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
                        ))
                      ) : recentTransactions.length > 0 ? (
                        recentTransactions.slice(0, 5).map((transaction: any) => (
                          <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                transaction.type === 'purchase' ? 'bg-green-100' : 'bg-red-100'
                              }`}>
                                {transaction.type === 'purchase' ? (
                                  <ArrowDownRight className="w-5 h-5 text-green-600" />
                                ) : (
                                  <ArrowUpRight className="w-5 h-5 text-red-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {transaction.type === 'purchase' ? 'Purchase' : 'Redemption'}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {new Date(transaction.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <p className={`font-semibold ${
                              transaction.type === 'purchase' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.type === 'purchase' ? '+' : '-'}${transaction.amount}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500">No transactions yet</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}