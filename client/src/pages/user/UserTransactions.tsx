import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Receipt,
  ChevronLeft,
  Download,
  Filter,
  Calendar,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { useToast } from "@/hooks/use-toast";
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
  Legend
} from 'recharts';

interface Transaction {
  id: string;
  giftCardId: string;
  cardCode: string;
  cardDesign: string;
  amount: string;
  type: 'purchase' | 'redemption';
  description: string;
  createdAt: Date;
  balanceAfter: string;
  receiptId?: string;
  status: 'completed' | 'pending' | 'failed';
}

interface TransactionStats {
  totalTransactions: number;
  totalPurchases: number;
  totalRedemptions: number;
  totalSpent: number;
  totalReceived: number;
  monthlyData: Array<{ month: string; purchases: number; redemptions: number }>;
}

export default function UserTransactions() {
  const [, setLocation] = useLocation();
  const { user } = useCustomerAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDesign, setFilterDesign] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  // Fetch transactions
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/user/transactions'],
    enabled: !!user
  });

  // Calculate statistics
  const stats: TransactionStats = {
    totalTransactions: transactions.length,
    totalPurchases: transactions.filter(tx => tx.type === 'purchase').length,
    totalRedemptions: transactions.filter(tx => tx.type === 'redemption').length,
    totalSpent: transactions
      .filter(tx => tx.type === 'redemption')
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0),
    totalReceived: transactions
      .filter(tx => tx.type === 'purchase')
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0),
    monthlyData: []
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.cardCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tx.cardDesign.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || tx.type === filterType;
    const matchesStatus = filterStatus === "all" || tx.status === filterStatus;
    const matchesDesign = filterDesign === "all" || tx.cardDesign === filterDesign;
    return matchesSearch && matchesType && matchesStatus && matchesDesign;
  });

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'amount':
        return parseFloat(b.amount) - parseFloat(a.amount);
      case 'type':
        return a.type.localeCompare(b.type);
      default:
        return 0;
    }
  });

  // Get unique designs for filter
  const uniqueDesigns = [...new Set(transactions.map(tx => tx.cardDesign))];

  // Monthly data for chart
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(new Date(), 5 - i);
    const monthName = format(month, 'MMM');
    const monthTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.createdAt);
      return txDate.getMonth() === month.getMonth() && 
             txDate.getFullYear() === month.getFullYear();
    });
    
    return {
      month: monthName,
      purchases: monthTransactions.filter(tx => tx.type === 'purchase').length,
      redemptions: monthTransactions.filter(tx => tx.type === 'redemption').length,
      total: monthTransactions.length
    };
  });

  const downloadTransactions = () => {
    const csv = [
      ['Date', 'Type', 'Description', 'Amount', 'Card Code', 'Design', 'Balance After', 'Status'],
      ...sortedTransactions.map(tx => [
        format(new Date(tx.createdAt), 'yyyy-MM-dd HH:mm'),
        tx.type,
        tx.description,
        tx.type === 'purchase' ? `+$${tx.amount}` : `-$${tx.amount}`,
        tx.cardCode,
        tx.cardDesign,
        `$${tx.balanceAfter}`,
        tx.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Download started",
      description: "Your transaction history is being downloaded"
    });
  };

  const getTransactionIcon = (type: string) => {
    return type === 'purchase' ? ArrowDownLeft : ArrowUpRight;
  };

  const getTransactionColor = (type: string) => {
    return type === 'purchase' ? 'text-green-400' : 'text-red-400';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-950 border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setLocation('/dashboard/user')}
              variant="ghost"
              size="icon"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Transaction History</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={downloadTransactions}
              variant="outline"
              className="border-gray-700 hover:bg-gray-800"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </header>

      <main className="p-6">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Transactions</p>
                  <p className="text-2xl font-bold">{stats.totalTransactions}</p>
                </div>
                <Receipt className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Purchases</p>
                  <p className="text-2xl font-bold text-green-400">{stats.totalPurchases}</p>
                </div>
                <ArrowDownLeft className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Redemptions</p>
                  <p className="text-2xl font-bold text-red-400">{stats.totalRedemptions}</p>
                </div>
                <ArrowUpRight className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Received</p>
                  <p className="text-2xl font-bold text-green-400">
                    ${stats.totalReceived.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Spent</p>
                  <p className="text-2xl font-bold text-red-400">
                    ${stats.totalSpent.toFixed(2)}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction Chart */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle>Transaction Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRedemptions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
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
                  dataKey="purchases" 
                  stroke="#10B981" 
                  fillOpacity={1} 
                  fill="url(#colorPurchases)"
                  name="Purchases" 
                />
                <Area 
                  type="monotone" 
                  dataKey="redemptions" 
                  stroke="#EF4444" 
                  fillOpacity={1} 
                  fill="url(#colorRedemptions)"
                  name="Redemptions" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="purchase">Purchases</SelectItem>
                <SelectItem value="redemption">Redemptions</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterDesign} onValueChange={setFilterDesign}>
              <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700">
                <SelectValue placeholder="Filter by design" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Designs</SelectItem>
                {uniqueDesigns.map(design => (
                  <SelectItem key={design} value={design}>{design}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="date">Date (Newest)</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="type">Type</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Transactions List */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-0">
            {sortedTransactions.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">No transactions found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery || filterType !== "all" || filterDesign !== "all"
                    ? "Try adjusting your filters"
                    : "Your transaction history will appear here"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700 hover:bg-gray-800/50">
                      <TableHead className="text-gray-400">Date</TableHead>
                      <TableHead className="text-gray-400">Type</TableHead>
                      <TableHead className="text-gray-400">Description</TableHead>
                      <TableHead className="text-gray-400">Card</TableHead>
                      <TableHead className="text-gray-400 text-right">Amount</TableHead>
                      <TableHead className="text-gray-400 text-right">Balance After</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedTransactions.map((tx) => {
                      const Icon = getTransactionIcon(tx.type);
                      const color = getTransactionColor(tx.type);
                      
                      return (
                        <TableRow key={tx.id} className="border-gray-700 hover:bg-gray-800/50">
                          <TableCell className="font-medium">
                            <div>
                              <p className="text-sm">
                                {format(new Date(tx.createdAt), 'MMM d, yyyy')}
                              </p>
                              <p className="text-xs text-gray-500">
                                {format(new Date(tx.createdAt), 'h:mm a')}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className={`p-1.5 rounded-lg ${
                                tx.type === 'purchase' ? 'bg-green-900/50' : 'bg-red-900/50'
                              }`}>
                                <Icon className={`h-4 w-4 ${color}`} />
                              </div>
                              <span className="capitalize">{tx.type}</span>
                            </div>
                          </TableCell>
                          <TableCell>{tx.description}</TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{tx.cardDesign}</p>
                              <code className="text-xs text-gray-500">
                                {tx.cardCode.slice(0, 8)}...
                              </code>
                            </div>
                          </TableCell>
                          <TableCell className={`text-right font-medium ${color}`}>
                            {tx.type === 'purchase' ? '+' : '-'}${Math.abs(parseFloat(tx.amount)).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            ${tx.balanceAfter}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(tx.status)}
                              <span className="text-sm capitalize">{tx.status}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {tx.receiptId && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setLocation(`/receipt-view/${tx.receiptId}`)}
                              >
                                View Receipt
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}