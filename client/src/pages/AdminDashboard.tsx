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

const recentUsersData = [
  { id: 1, name: 'John Doe', avatar: null, status: 'active' },
  { id: 2, name: 'Jane Smith', avatar: null, status: 'active' },
  { id: 3, name: 'Mike Johnson', avatar: null, status: 'new' },
  { id: 4, name: 'Sarah Williams', avatar: null, status: 'active' },
  { id: 5, name: 'Tom Brown', avatar: null, status: 'active' },
  { id: 6, name: '+3', avatar: null, status: 'more' }
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

  // Fetch gift cards
  const { data: giftCards, isLoading: cardsLoading } = useQuery({
    queryKey: ['/api/admin/giftcards'],
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
    <div className="min-h-screen bg-gray-900">
      <Navigation 
        user={user} 
        onLogout={handleLogout}
        showDashboard={true}
      />
      
      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold text-white">
                {greeting} {user?.firstName || 'Admin'},
              </h1>
              <p className="text-gray-400 mt-1">
                Prev Account
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search..."
                  className="bg-gray-800 text-white pl-10 pr-4 py-2 rounded-full border border-gray-700 focus:outline-none focus:border-gray-600"
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
              <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white">
                <Bell className="w-5 h-5" />
              </Button>
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.profileImageUrl} />
                <AvatarFallback className="bg-primary text-white">
                  {user?.firstName?.[0] || 'A'}
                </AvatarFallback>
              </Avatar>
            </div>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Card 1 */}
                  <div className={`${CARD_GRADIENTS[0]} rounded-2xl p-6 text-white relative overflow-hidden cursor-pointer transform transition-all hover:scale-105`}>
                    <div className="absolute top-4 right-4">
                      <CreditCard className="w-8 h-8 opacity-50" />
                    </div>
                    <div className="space-y-4">
                      <p className="text-lg font-mono">2781 8191 6671 3190</p>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs opacity-80">{user?.firstName || 'Admin'}</p>
                        </div>
                        <div>
                          <p className="text-xs opacity-80">Exp: 09/29</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className={`${CARD_GRADIENTS[1]} rounded-2xl p-6 text-white relative overflow-hidden cursor-pointer transform transition-all hover:scale-105`}>
                    <div className="absolute top-4 right-4">
                      <CreditCard className="w-8 h-8 opacity-50" />
                    </div>
                    <div className="space-y-4">
                      <p className="text-lg font-mono">0192 1827 1181 0182</p>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs opacity-80">{user?.firstName || 'Admin'}</p>
                        </div>
                        <div>
                          <p className="text-xs opacity-80">Exp: 10/32</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className={`${CARD_GRADIENTS[2]} rounded-2xl p-6 text-white relative overflow-hidden cursor-pointer transform transition-all hover:scale-105`}>
                    <div className="absolute top-4 right-4">
                      <CreditCard className="w-8 h-8 opacity-50" />
                    </div>
                    <div className="space-y-4">
                      <p className="text-lg font-mono">1019 9910 1129 0191</p>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs opacity-80">{user?.firstName || 'Admin'}</p>
                        </div>
                        <div>
                          <p className="text-xs opacity-80">Exp: 10/30</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* My Velo Card Stats */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white flex items-center">
                        <CreditCard className="w-5 h-5 mr-2" />
                        My Velo Card
                      </CardTitle>
                      <span className="text-3xl font-bold text-red-500">
                        ${totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <h3 className="text-white font-semibold mb-4">Overview</h3>
                      <div className="flex items-center space-x-2 text-red-400">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-sm">Total Amount</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-gray-900 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-white">${totalBalance.toFixed(2)}</p>
                        <p className="text-xs text-gray-400 mt-1">+42% Daily</p>
                      </div>
                      <div className="bg-gray-900 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-white">${freelanceAmount.toFixed(2)}</p>
                        <p className="text-xs text-gray-400 mt-1">+25% Freelance</p>
                      </div>
                      <div className="bg-gray-900 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-white">${rentPayment.toFixed(2)}</p>
                        <p className="text-xs text-gray-400 mt-1">-5.1% Rent Payment</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-white font-semibold mb-4">Summary</h3>
                      <p className="text-gray-400 text-sm mb-3">13m - 31 Dec 2024</p>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={summaryData}>
                            <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
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
                              stroke="#ef4444" 
                              fillOpacity={1} 
                              fill="url(#colorValue)" 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right Column - Transactions and Details */}
            <div className="space-y-6">
              {/* Transactions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">
                        <Users className="w-5 h-5 inline mr-2" />
                        Transaction
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Transaction Items */}
                      {[
                        { name: 'Salary', amount: 2500.00, change: '+', icon: DollarSign, iconBg: 'bg-green-500' },
                        { name: 'Designer', amount: 900.00, change: '+', icon: Users, iconBg: 'bg-blue-500' },
                        { name: 'Rent', amount: 2000.00, change: '-', icon: ShoppingBag, iconBg: 'bg-red-500' },
                        { name: 'Admin Fee', amount: 10.00, change: '-', icon: CreditCard, iconBg: 'bg-yellow-500' },
                        { name: 'Savings Interest', amount: 1.00, change: '+', icon: TrendingUp, iconBg: 'bg-purple-500' },
                        { name: 'Developer', amount: 20.00, change: '+', icon: Users, iconBg: 'bg-indigo-500' },
                        { name: 'Admin Fee', amount: 6.00, change: '-', icon: CreditCard, iconBg: 'bg-orange-500' },
                        { name: 'Rent', amount: 90.00, change: '-', icon: ShoppingBag, iconBg: 'bg-pink-500' },
                      ].map((transaction, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded hover:bg-gray-700 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full ${transaction.iconBg} bg-opacity-20 flex items-center justify-center`}>
                              <transaction.icon className={`w-5 h-5 ${transaction.iconBg.replace('bg-', 'text-')}`} />
                            </div>
                            <div>
                              <p className="text-white font-medium">{transaction.name}</p>
                            </div>
                          </div>
                          <p className={`font-semibold ${transaction.change === '+' ? 'text-green-400' : 'text-red-400'}`}>
                            {transaction.change}${transaction.amount.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>

                    <Link href="/dashboard">
                      <Button className="w-full mt-4 bg-pink-500 hover:bg-pink-600 text-white">
                        View All
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Card Details */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Eye className="w-5 h-5 mr-2" />
                      Card Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Holder Name</span>
                        <span className="text-white">{user?.firstName || 'Admin'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Card Number</span>
                        <span className="text-white">*** 3190</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Expire Date</span>
                        <span className="text-white">09/29</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">CVV</span>
                        <span className="text-white">***</span>
                      </div>
                    </div>
                    <Button className="w-full mt-6 bg-pink-500 hover:bg-pink-600 text-white">
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Join Premium */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <h3 className="text-white font-semibold text-lg">Join Premium</h3>
                        <p className="text-gray-400 text-sm">Get exclusive features</p>
                      </div>
                      <div className="bg-pink-500 rounded-lg p-3">
                        <Plus className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Users */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      Recent
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex -space-x-3">
                      {recentUsersData.map((user, index) => (
                        <Avatar key={user.id} className="h-10 w-10 border-2 border-gray-800">
                          {user.status === 'more' ? (
                            <AvatarFallback className="bg-gray-700 text-white text-xs">
                              {user.name}
                            </AvatarFallback>
                          ) : (
                            <>
                              <AvatarImage src={user.avatar || undefined} />
                              <AvatarFallback className={`${
                                user.status === 'new' ? 'bg-green-500' : 'bg-primary'
                              } text-white`}>
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </>
                          )}
                        </Avatar>
                      ))}
                    </div>
                    <p className="text-gray-400 text-sm mt-3">View All</p>
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