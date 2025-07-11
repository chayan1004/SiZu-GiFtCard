import { useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  CreditCard,
  ShoppingBag,
  BarChart3,
  PieChart
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
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
  Bar,
  PieChart as RechartsChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function AdminAnalytics() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Check if user is admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      window.location.href = "/api/login";
    }
  }, [isAuthenticated, isLoading, user]);

  // Fetch dashboard stats
  const { data: dashboardStats } = useQuery({
    queryKey: ['/api/admin/stats'],
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

  // Generate chart data
  const monthlyRevenue = [
    { month: 'Jan', revenue: 2800, cards: 28 },
    { month: 'Feb', revenue: 3200, cards: 32 },
    { month: 'Mar', revenue: 2900, cards: 29 },
    { month: 'Apr', revenue: 3500, cards: 35 },
    { month: 'May', revenue: 3100, cards: 31 },
    { month: 'Jun', revenue: 3800, cards: 38 },
    { month: 'Jul', revenue: 4200, cards: 42 },
    { month: 'Aug', revenue: 4800, cards: 48 },
  ];

  const designDistribution = [
    { name: 'Classic', value: 35 },
    { name: 'Love', value: 25 },
    { name: 'Premium', value: 20 },
    { name: 'Birthday', value: 15 },
    { name: 'Holiday', value: 5 },
  ];

  const redemptionTrend = [
    { week: 'W1', redemptions: 12 },
    { week: 'W2', redemptions: 15 },
    { week: 'W3', redemptions: 18 },
    { week: 'W4', redemptions: 14 },
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
              <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
              <p className="text-gray-400 mt-1">
                Comprehensive insights into your gift card business
              </p>
            </motion.div>

            {/* Key Metrics */}
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
                      <p className="text-sm text-gray-400">Total Revenue</p>
                      <p className="text-2xl font-bold text-white">${dashboardStats?.totalSales || 0}</p>
                      <p className="text-xs text-green-400 mt-1">+12.5% from last month</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Cards Sold</p>
                      <p className="text-2xl font-bold text-white">{dashboardStats?.cardsIssued || 0}</p>
                      <p className="text-xs text-blue-400 mt-1">+8 this week</p>
                    </div>
                    <CreditCard className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Active Balance</p>
                      <p className="text-2xl font-bold text-white">${dashboardStats?.activeBalance || 0}</p>
                      <p className="text-xs text-yellow-400 mt-1">Unredeemed funds</p>
                    </div>
                    <ShoppingBag className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Redemption Rate</p>
                      <p className="text-2xl font-bold text-white">68%</p>
                      <p className="text-xs text-purple-400 mt-1">Above average</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Monthly Revenue Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyRevenue}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="month" stroke="#666" />
                          <YAxis stroke="#666" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(17, 24, 39, 0.9)',
                              border: '1px solid #374151',
                              borderRadius: '8px'
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#8b5cf6" 
                            fillOpacity={1} 
                            fill="url(#colorRevenue)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Design Distribution */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <PieChart className="w-5 h-5 mr-2" />
                      Card Design Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsChart>
                          <Pie
                            data={designDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {designDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RechartsChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Cards Sold */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <CreditCard className="w-5 h-5 mr-2" />
                      Cards Sold by Month
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyRevenue}>
                          <XAxis dataKey="month" stroke="#666" />
                          <YAxis stroke="#666" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(17, 24, 39, 0.9)',
                              border: '1px solid #374151',
                              borderRadius: '8px'
                            }}
                          />
                          <Bar dataKey="cards" fill="#10b981" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Redemption Trend */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <TrendingDown className="w-5 h-5 mr-2" />
                      Weekly Redemption Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={redemptionTrend}>
                          <XAxis dataKey="week" stroke="#666" />
                          <YAxis stroke="#666" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(17, 24, 39, 0.9)',
                              border: '1px solid #374151',
                              borderRadius: '8px'
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="redemptions" 
                            stroke="#ef4444" 
                            strokeWidth={2}
                            dot={{ fill: '#ef4444' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
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