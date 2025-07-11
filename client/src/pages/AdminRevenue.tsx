import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SideNavigation from "@/components/SideNavigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  CreditCard,
  ShoppingBag,
  Calendar,
  Download,
  Filter,
  BarChart3,
  LineChart,
  PieChart,
  Activity
} from "lucide-react";
import {
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { motion } from "framer-motion";

// Mock data for demonstration
const revenueOverview = {
  totalRevenue: 125750.50,
  monthlyGrowth: 23.5,
  yearlyGrowth: 156.2,
  averageOrderValue: 47.25,
  totalOrders: 2659,
  activeGiftCards: 1823
};

const monthlyRevenue = [
  { month: "Jan", revenue: 8500, orders: 175, fees: 425 },
  { month: "Feb", revenue: 9200, orders: 189, fees: 460 },
  { month: "Mar", revenue: 10100, orders: 207, fees: 505 },
  { month: "Apr", revenue: 9800, orders: 201, fees: 490 },
  { month: "May", revenue: 11200, orders: 230, fees: 560 },
  { month: "Jun", revenue: 12500, orders: 257, fees: 625 },
  { month: "Jul", revenue: 13100, orders: 269, fees: 655 }
];

const revenueByDesign = [
  { design: "Classic", revenue: 45250, percentage: 36, color: "#8B5CF6" },
  { design: "Premium", revenue: 38900, percentage: 31, color: "#10B981" },
  { design: "Love", revenue: 21350, percentage: 17, color: "#EC4899" },
  { design: "Birthday", revenue: 12500, percentage: 10, color: "#F59E0B" },
  { design: "Holiday", revenue: 7750, percentage: 6, color: "#3B82F6" }
];

const topCustomers = [
  { id: 1, name: "Sarah Johnson", totalSpent: 2450, orders: 23, lastOrder: "2 days ago" },
  { id: 2, name: "Michael Chen", totalSpent: 1890, orders: 17, lastOrder: "5 days ago" },
  { id: 3, name: "Emily Davis", totalSpent: 1675, orders: 15, lastOrder: "1 week ago" },
  { id: 4, name: "Robert Wilson", totalSpent: 1520, orders: 14, lastOrder: "3 days ago" },
  { id: 5, name: "Lisa Anderson", totalSpent: 1380, orders: 12, lastOrder: "Today" }
];

export default function AdminRevenue() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState("month");
  const [selectedMetric, setSelectedMetric] = useState("revenue");

  // Check if user is admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      window.location.href = "/api/login";
    }
  }, [isAuthenticated, isLoading, user]);

  const handleLogout = () => {
    toast({
      title: "Logging out...",
      description: "You will be redirected to the login page.",
    });
    setTimeout(() => {
      window.location.href = '/api/logout';
    }, 1000);
  };

  // In real implementation, replace with actual API calls
  const { data: stats } = useQuery({
    queryKey: ['/api/admin/revenue-stats', timeRange],
    queryFn: () => Promise.resolve(revenueOverview),
    staleTime: 30000
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
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
      {/* Side Navigation */}
      <div className="w-64 flex-shrink-0">
        <SideNavigation user={user} onLogout={handleLogout} isAdmin={true} />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-x-hidden">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Revenue Analytics</h1>
          <p className="text-gray-400">Track and analyze your gift card platform revenue</p>
        </div>

        {/* Filters */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="quarter">Last Quarter</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
          <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Revenue</CardTitle>
                <DollarSign className="w-4 h-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{formatCurrency(stats?.totalRevenue || 0)}</div>
                <div className="flex items-center text-xs text-green-400 mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{stats?.monthlyGrowth}% from last month
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-green-900/20 to-teal-900/20 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Orders</CardTitle>
                <ShoppingBag className="w-4 h-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats?.totalOrders?.toLocaleString()}</div>
                <div className="flex items-center text-xs text-green-400 mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +18.2% from last month
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Avg Order Value</CardTitle>
                <Activity className="w-4 h-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{formatCurrency(stats?.averageOrderValue || 0)}</div>
                <div className="flex items-center text-xs text-red-400 mt-1">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  -2.4% from last month
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-orange-900/20 to-red-900/20 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Active Cards</CardTitle>
                <CreditCard className="w-4 h-4 text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats?.activeGiftCards?.toLocaleString()}</div>
                <div className="flex items-center text-xs text-green-400 mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12.7% from last month
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Section */}
        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="trends" className="data-[state=active]:bg-gray-700">
              <LineChart className="w-4 h-4 mr-2" />
              Revenue Trends
            </TabsTrigger>
            <TabsTrigger value="breakdown" className="data-[state=active]:bg-gray-700">
              <PieChart className="w-4 h-4 mr-2" />
              Design Breakdown
            </TabsTrigger>
            <TabsTrigger value="comparison" className="data-[state=active]:bg-gray-700">
              <BarChart3 className="w-4 h-4 mr-2" />
              Monthly Comparison
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trends">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Revenue Trends</CardTitle>
                <CardDescription className="text-gray-400">
                  Monthly revenue, orders, and fees over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyRevenue}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                        labelStyle={{ color: '#F3F4F6' }}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#8B5CF6" 
                        fillOpacity={1} 
                        fill="url(#colorRevenue)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="fees" 
                        stroke="#10B981" 
                        fillOpacity={1} 
                        fill="url(#colorOrders)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="breakdown">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Revenue by Design</CardTitle>
                  <CardDescription className="text-gray-400">
                    Distribution of revenue across gift card designs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={revenueByDesign}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ percentage }) => `${percentage}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="revenue"
                        >
                          {revenueByDesign.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                          formatter={(value) => formatCurrency(value as number)}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Design Performance</CardTitle>
                  <CardDescription className="text-gray-400">
                    Revenue breakdown by design type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {revenueByDesign.map((design) => (
                      <div key={design.design}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-300">{design.design}</span>
                          <span className="text-sm text-gray-400">{formatCurrency(design.revenue)}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${design.percentage}%`,
                              backgroundColor: design.color
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="comparison">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Monthly Comparison</CardTitle>
                <CardDescription className="text-gray-400">
                  Revenue and orders comparison month over month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                        labelStyle={{ color: '#F3F4F6' }}
                      />
                      <Legend />
                      <Bar dataKey="revenue" fill="#8B5CF6" />
                      <Bar dataKey="fees" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Top Customers */}
        <Card className="bg-gray-800/50 border-gray-700 mt-8">
          <CardHeader>
            <CardTitle className="text-white">Top Customers</CardTitle>
            <CardDescription className="text-gray-400">
              Highest spending customers this period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCustomers.map((customer) => (
                <div key={customer.id} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                      {customer.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-white font-medium">{customer.name}</p>
                      <p className="text-sm text-gray-400">{customer.orders} orders • Last order {customer.lastOrder}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-white">{formatCurrency(customer.totalSpent)}</p>
                    <Badge variant="outline" className="border-gray-600 text-gray-300">
                      VIP Customer
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
          </div>
        </div>
      </div>
    </div>
  );
}