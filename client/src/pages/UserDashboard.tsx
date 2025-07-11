import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Home, 
  Wallet, 
  Receipt, 
  FileText, 
  Bell, 
  HelpCircle, 
  Settings,
  Search,
  Menu,
  X,
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Clock,
  Filter,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

// Types
interface DashboardStats {
  totalBalance: number;
  totalSpent: number;
  activeCards: number;
  pendingTransactions: number;
  monthlySpending: Array<{ month: string; amount: number }>;
  recentTransactions: Array<{
    id: string;
    amount: number;
    type: 'purchase' | 'redemption';
    description: string;
    date: Date;
    status: 'completed' | 'pending' | 'failed';
  }>;
}

interface GiftCard {
  id: string;
  code: string;
  balance: string;
  initialAmount: string;
  design: string;
  recipientName?: string;
  createdAt: Date;
  expiresAt?: Date;
}

export default function UserDashboard() {
  const [, setLocation] = useLocation();
  const { user, logout, isLoading: authLoading } = useCustomerAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/user/dashboard/stats'],
    enabled: !!user,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch user's gift cards
  const { data: giftCards = [], isLoading: cardsLoading } = useQuery<GiftCard[]>({
    queryKey: ['/api/giftcards/mine'],
    enabled: !!user
  });

  // Fetch recent transactions
  const { data: transactions = [] } = useQuery({
    queryKey: ['/api/user/transactions'],
    enabled: !!user
  });

  const handleLogout = async () => {
    await logout();
    setLocation('/');
  };

  // Calculate total balance from gift cards
  const totalBalance = giftCards.reduce((sum, card) => sum + parseFloat(card.balance), 0);
  const totalInitialValue = giftCards.reduce((sum, card) => sum + parseFloat(card.initialAmount), 0);
  const totalSpent = totalInitialValue - totalBalance;

  // Mock data for charts (will be replaced with real data)
  const transactionData = [
    { name: 'Mon', value: 125 },
    { name: 'Tue', value: 89 },
    { name: 'Wed', value: 156 },
    { name: 'Thu', value: 234 },
    { name: 'Fri', value: 189 },
    { name: 'Sat', value: 298 },
    { name: 'Sun', value: 145 }
  ];

  const overviewData = [
    { name: 'Purchases', value: 201, color: '#8B5CF6' },
    { name: 'Redemptions', value: 156, color: '#10B981' },
    { name: 'Pending', value: 43, color: '#F59E0B' }
  ];

  const navItems = [
    { icon: Home, label: 'Home', path: '/dashboard/user' },
    { icon: Wallet, label: 'Wallet', path: '/dashboard/user/wallet' },
    { icon: Sparkles, label: 'Designer Studio', path: '/dashboard/user/designer' },
    { icon: Receipt, label: 'Transactions', path: '/dashboard/user/transactions' },
    { icon: FileText, label: 'Reports', path: '/dashboard/user/reports' },
    { icon: Bell, label: 'Notifications', path: '/dashboard/user/notifications' },
    { icon: HelpCircle, label: 'Support', path: '/dashboard/user/support' },
    { icon: Settings, label: 'Settings', path: '/dashboard/user/settings' }
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-950 transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          {/* Brand */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-600 p-2 rounded-lg">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-lg">Gift Card Hub</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <button
                    onClick={() => setLocation(item.path)}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <item.icon className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-300">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-purple-600 p-2 rounded-full">
                <span className="text-sm font-medium">
                  {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{user?.firstName || 'User'}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full border-gray-700 hover:bg-gray-800"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-gray-950 border-b border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-2xl font-bold">Gift Card Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 w-64"
                />
              </div>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {/* Wallet Section */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Wallet</h2>
              <Button
                onClick={() => setLocation('/shop')}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
              >
                Get More
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Balance Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-gradient-to-br from-purple-600 to-purple-800 border-0">
                  <CardContent className="p-6">
                    <p className="text-purple-100 text-sm mb-1">Total Balance</p>
                    <p className="text-3xl font-bold text-white">${totalBalance.toFixed(2)}</p>
                    <div className="flex items-center mt-2 text-purple-200">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span className="text-xs">+12% from last month</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-gradient-to-br from-green-600 to-green-800 border-0">
                  <CardContent className="p-6">
                    <p className="text-green-100 text-sm mb-1">Active Cards</p>
                    <p className="text-3xl font-bold text-white">{giftCards.length}</p>
                    <div className="flex items-center mt-2 text-green-200">
                      <CreditCard className="h-4 w-4 mr-1" />
                      <span className="text-xs">All cards active</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-gradient-to-br from-blue-600 to-blue-800 border-0">
                  <CardContent className="p-6">
                    <p className="text-blue-100 text-sm mb-1">Total Spent</p>
                    <p className="text-3xl font-bold text-white">${totalSpent.toFixed(2)}</p>
                    <div className="flex items-center mt-2 text-blue-200">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span className="text-xs">This month</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="bg-gradient-to-br from-orange-600 to-orange-800 border-0">
                  <CardContent className="p-6">
                    <p className="text-orange-100 text-sm mb-1">Saved</p>
                    <p className="text-3xl font-bold text-white">$432</p>
                    <div className="flex items-center mt-2 text-orange-200">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span className="text-xs">With special offers</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Gift Cards Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {giftCards.slice(0, 3).map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card className="bg-gray-800 border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
                    <div className={`h-32 bg-gradient-to-br ${
                      index === 0 ? 'from-pink-500 to-rose-600' :
                      index === 1 ? 'from-green-500 to-teal-600' :
                      'from-blue-500 to-purple-600'
                    } p-4 relative`}>
                      <CreditCard className="absolute right-4 top-4 h-8 w-8 text-white/20" />
                      <p className="text-white font-semibold">{card.design} Card</p>
                      <p className="text-white/80 text-sm mt-1">Balance: ${card.balance}</p>
                    </div>
                    <CardContent className="p-4">
                      <p className="text-gray-400 text-sm">Card Code</p>
                      <p className="font-mono text-sm">{card.code}</p>
                      <div className="mt-2">
                        <Progress 
                          value={(parseFloat(card.balance) / parseFloat(card.initialAmount)) * 100}
                          className="h-2"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Transaction Reports & Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Transaction Reports */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Transaction Reports</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-gray-400">
                      <Calendar className="h-4 w-4 mr-2" />
                      {selectedPeriod === 'week' ? 'This Week' : 
                       selectedPeriod === 'month' ? 'This Month' : 'This Year'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-gray-800 border-gray-700">
                    <DropdownMenuItem onClick={() => setSelectedPeriod('week')}>
                      This Week
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedPeriod('month')}>
                      This Month
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedPeriod('year')}>
                      This Year
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={transactionData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                      labelStyle={{ color: '#F3F4F6' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8B5CF6" 
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>

                {/* Recent Transactions List */}
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Recent Activity</h3>
                  <div className="space-y-3">
                    {transactions.slice(0, 3).map((tx: any) => (
                      <div key={tx.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${
                            tx.type === 'purchase' ? 'bg-green-900/50' : 'bg-red-900/50'
                          }`}>
                            {tx.type === 'purchase' ? 
                              <TrendingUp className="h-4 w-4 text-green-400" /> :
                              <TrendingDown className="h-4 w-4 text-red-400" />
                            }
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-200">{tx.description}</p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(tx.createdAt), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${
                            tx.type === 'purchase' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {tx.type === 'purchase' ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {tx.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="ghost" 
                    className="w-full mt-4 text-purple-400 hover:text-purple-300"
                    onClick={() => setLocation('/dashboard/user/transactions')}
                  >
                    View All Transactions
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Overview */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">201</p>
                    <p className="text-sm text-gray-400">Total Transactions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">156</p>
                    <p className="text-sm text-gray-400">Completed</p>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={overviewData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {overviewData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="mt-6 space-y-3">
                  {overviewData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-gray-300">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-200">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}