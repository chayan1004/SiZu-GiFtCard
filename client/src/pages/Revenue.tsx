import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingUp, 
  Wallet, 
  Users, 
  CreditCard,
  Gift,
  Percent,
  Info
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Mock data for charts - in production this would come from API
const monthlyRevenue = [
  { month: 'Jan', revenue: 2500, transactions: 45 },
  { month: 'Feb', revenue: 3200, transactions: 58 },
  { month: 'Mar', revenue: 4100, transactions: 72 },
  { month: 'Apr', revenue: 3800, transactions: 65 },
  { month: 'May', revenue: 4600, transactions: 84 },
  { month: 'Jun', revenue: 5200, transactions: 96 }
];

const revenueStreams = [
  { name: 'Float Income', value: 35, color: '#3b82f6' },
  { name: 'Breakage', value: 25, color: '#10b981' },
  { name: 'Transaction Fees', value: 20, color: '#f59e0b' },
  { name: 'Premium Designs', value: 15, color: '#8b5cf6' },
  { name: 'Corporate Sales', value: 5, color: '#ef4444' }
];

export default function Revenue() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/admin/stats']
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  // Calculate revenue metrics
  const estimatedFloat = (stats?.activeBalance || 0) * 0.05; // 5% annual return on float
  const estimatedBreakage = (stats?.totalSales || 0) * 0.1; // 10% breakage rate
  const transactionFees = (stats?.cardsIssued || 0) * 2.5; // $2.50 per card
  const totalRevenue = estimatedFloat + estimatedBreakage + transactionFees;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Revenue Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Track your income streams and understand how to maximize revenue
        </p>
      </div>

      {/* Revenue Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Float</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.activeBalance || 0}</div>
            <p className="text-xs text-muted-foreground">
              Unredeemed balance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaction Fees</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${transactionFees.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.cardsIssued || 0} cards × $2.50
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. Breakage</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${estimatedBreakage.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              10% of total sales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Streams */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Streams</CardTitle>
            <CardDescription>
              Breakdown of income sources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueStreams}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueStreams.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue Trend</CardTitle>
            <CardDescription>
              Revenue growth over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* How to Generate Revenue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            How to Generate Revenue
          </CardTitle>
          <CardDescription>
            Multiple income streams from your gift card platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-blue-500" />
                  Float Income (35% of revenue)
                </h4>
                <p className="text-sm text-muted-foreground">
                  Money held between purchase and redemption can be invested. With proper treasury management, 
                  you can earn 3-5% annually on the float balance.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Breakage Revenue (25% of revenue)
                </h4>
                <p className="text-sm text-muted-foreground">
                  Industry average shows 10-20% of gift cards are never fully redeemed. This "breakage" 
                  becomes pure profit after the expiration period.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-amber-500" />
                  Transaction Fees (20% of revenue)
                </h4>
                <p className="text-sm text-muted-foreground">
                  Charge $2-5 per gift card purchase as a service fee. Premium designs can command 
                  higher fees ($5-10).
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Gift className="h-4 w-4 text-purple-500" />
                  Premium Features (15% of revenue)
                </h4>
                <p className="text-sm text-muted-foreground">
                  Offer premium gift card designs, custom branding, video messages, or scheduled 
                  delivery for additional fees.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-red-500" />
                  Corporate Sales (5% of revenue)
                </h4>
                <p className="text-sm text-muted-foreground">
                  Bulk sales to businesses for employee rewards or customer incentives. Volume 
                  discounts with minimum fees ensure profitability.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-indigo-500" />
                  Additional Opportunities
                </h4>
                <p className="text-sm text-muted-foreground">
                  Partner commissions, API access fees, white-label solutions, data analytics 
                  services, and promotional partnerships.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Revenue Optimization Tips:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Set expiration dates 2-5 years out to maximize float time</li>
              <li>• Offer reload bonuses to increase average balance</li>
              <li>• Create seasonal designs to drive repeat purchases</li>
              <li>• Implement a referral program for viral growth</li>
              <li>• Partner with local businesses for co-branded cards</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}