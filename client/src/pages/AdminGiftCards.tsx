import { useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Trash2
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import SideNavigation from "@/components/SideNavigation";

export default function AdminGiftCards() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Check if user is admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      window.location.href = "/api/login";
    }
  }, [isAuthenticated, isLoading, user]);

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
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white">Gift Cards Management</h1>
                  <p className="text-gray-400 mt-1">
                    Manage all gift cards in the system
                  </p>
                </div>
                <Link href="/shop">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Card
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-6"
            >
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by code, recipient, or amount..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
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

            {/* Gift Cards Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">
                    All Gift Cards ({giftCards?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Code</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Amount</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Balance</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Recipient</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Design</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Created</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {giftCards?.map((card: any) => (
                          <tr key={card.id} className="border-b border-gray-700 hover:bg-gray-900">
                            <td className="py-3 px-4 text-white font-mono text-sm">
                              {card.code.slice(0, 8)}...
                            </td>
                            <td className="py-3 px-4 text-white">
                              ${parseFloat(card.initialBalance).toFixed(2)}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`font-semibold ${
                                parseFloat(card.balance) > 0 ? 'text-green-400' : 'text-gray-400'
                              }`}>
                                ${parseFloat(card.balance).toFixed(2)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-white">
                              {card.recipientEmail || 'N/A'}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="border-purple-500 text-purple-400">
                                {card.design || 'Standard'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={
                                parseFloat(card.balance) === parseFloat(card.initialBalance) 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : parseFloat(card.balance) > 0 
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-gray-500/20 text-gray-400'
                              }>
                                {parseFloat(card.balance) === parseFloat(card.initialBalance) 
                                  ? 'Unused' 
                                  : parseFloat(card.balance) > 0 
                                  ? 'Partial'
                                  : 'Depleted'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-gray-400 text-sm">
                              {new Date(card.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(!giftCards || giftCards.length === 0) && (
                      <div className="text-center py-8 text-gray-400">
                        No gift cards found
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