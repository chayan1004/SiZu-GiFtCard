import { useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  Download,
  Calendar,
  DollarSign
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import SideNavigation from "@/components/SideNavigation";

export default function AdminTransactions() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Check if user is admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      window.location.href = "/api/login";
    }
  }, [isAuthenticated, isLoading, user]);

  // Fetch transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
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
  const totalPurchases = transactions?.filter((t: any) => t.type === 'purchase')
    .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0) || 0;
  const totalRedemptions = transactions?.filter((t: any) => t.type === 'redemption')
    .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0) || 0;

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
              <h1 className="text-3xl font-bold text-white">Transaction History</h1>
              <p className="text-gray-400 mt-1">
                View all gift card purchases and redemptions
              </p>
            </motion.div>

            {/* Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            >
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total Purchases</p>
                      <p className="text-2xl font-bold text-green-400">${totalPurchases.toFixed(2)}</p>
                    </div>
                    <ArrowUpRight className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total Redemptions</p>
                      <p className="text-2xl font-bold text-red-400">${totalRedemptions.toFixed(2)}</p>
                    </div>
                    <ArrowDownRight className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total Transactions</p>
                      <p className="text-2xl font-bold text-white">{transactions?.length || 0}</p>
                    </div>
                    <Activity className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-6"
            >
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search transactions..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-700">
                      <Calendar className="w-4 h-4 mr-2" />
                      Date Range
                    </Button>
                    <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-700">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                    <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-700">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Transactions Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">All Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Type</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Amount</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Card Code</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Balance After</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions?.map((transaction: any) => (
                          <tr key={transaction.id} className="border-b border-gray-700 hover:bg-gray-900">
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <div className={`w-8 h-8 rounded-full ${
                                  transaction.type === 'purchase' ? 'bg-green-500' : 'bg-red-500'
                                } bg-opacity-20 flex items-center justify-center`}>
                                  {transaction.type === 'purchase' ? (
                                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                                  )}
                                </div>
                                <span className="text-white capitalize">{transaction.type}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`font-semibold ${
                                transaction.type === 'purchase' ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {transaction.type === 'purchase' ? '+' : '-'}${transaction.amount}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-white font-mono text-sm">
                              {transaction.giftCardCode?.slice(0, 8)}...
                            </td>
                            <td className="py-3 px-4 text-white">
                              ${transaction.balanceAfter || '0.00'}
                            </td>
                            <td className="py-3 px-4 text-gray-400 text-sm">
                              {new Date(transaction.createdAt).toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              <Badge className="bg-green-500/20 text-green-400">
                                Completed
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(!transactions || transactions.length === 0) && (
                      <div className="text-center py-8 text-gray-400">
                        No transactions found
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
  );
}