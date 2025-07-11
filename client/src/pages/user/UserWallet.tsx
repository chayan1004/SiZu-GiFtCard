import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  CreditCard,
  Plus,
  Send,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  Download,
  ChevronLeft,
  Copy,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface GiftCard {
  id: string;
  code: string;
  balance: string;
  initialAmount: string;
  design: string;
  recipientName?: string;
  recipientEmail?: string;
  message?: string;
  createdAt: Date;
  expiresAt?: Date;
  purchasedBy: string;
  lastUsedAt?: Date;
}

interface Transaction {
  id: string;
  giftCardId: string;
  amount: string;
  type: 'purchase' | 'redemption';
  description: string;
  createdAt: Date;
  balanceAfter: string;
}

export default function UserWallet() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCard, setSelectedCard] = useState<GiftCard | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDesign, setFilterDesign] = useState("all");
  const [copiedCode, setCopiedCode] = useState("");

  // Fetch user's gift cards
  const { data: giftCards = [], isLoading } = useQuery<GiftCard[]>({
    queryKey: ['/api/giftcards/mine'],
    enabled: !!user
  });

  // Fetch transactions for selected card
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['/api/giftcards/transactions', selectedCard?.id],
    queryFn: async () => {
      if (!selectedCard) return [];
      const res = await fetch(`/api/giftcards/${selectedCard.id}/transactions`);
      if (!res.ok) throw new Error('Failed to fetch transactions');
      return res.json();
    },
    enabled: !!selectedCard
  });

  // Copy card code to clipboard
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({
      title: "Copied!",
      description: "Gift card code copied to clipboard"
    });
    setTimeout(() => setCopiedCode(""), 2000);
  };

  // Filter cards
  const filteredCards = giftCards.filter(card => {
    const matchesSearch = card.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         card.design.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterDesign === "all" || card.design === filterDesign;
    return matchesSearch && matchesFilter;
  });

  // Get unique designs for filter
  const uniqueDesigns = [...new Set(giftCards.map(card => card.design))];

  // Calculate statistics
  const totalBalance = giftCards.reduce((sum, card) => sum + parseFloat(card.balance), 0);
  const totalCards = giftCards.length;
  const activeCards = giftCards.filter(card => parseFloat(card.balance) > 0).length;
  const totalInitialValue = giftCards.reduce((sum, card) => sum + parseFloat(card.initialAmount), 0);

  const getCardGradient = (design: string) => {
    switch (design.toLowerCase()) {
      case 'premium':
        return 'from-purple-500 to-pink-600';
      case 'birthday':
        return 'from-pink-500 to-rose-600';
      case 'holiday':
        return 'from-red-500 to-green-600';
      case 'love':
        return 'from-red-500 to-pink-600';
      case 'graduation':
        return 'from-blue-500 to-purple-600';
      case 'thank you':
        return 'from-green-500 to-teal-600';
      case 'congratulations':
        return 'from-yellow-500 to-orange-600';
      default:
        return 'from-gray-500 to-gray-700';
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
            <h1 className="text-2xl font-bold">My Wallet</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setLocation('/shop')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Gift Card
            </Button>
          </div>
        </div>
      </header>

      <main className="p-6">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Balance</p>
                  <p className="text-2xl font-bold">${totalBalance.toFixed(2)}</p>
                </div>
                <div className="bg-purple-600/20 p-3 rounded-lg">
                  <CreditCard className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Cards</p>
                  <p className="text-2xl font-bold">{totalCards}</p>
                </div>
                <div className="bg-green-600/20 p-3 rounded-lg">
                  <CreditCard className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Cards</p>
                  <p className="text-2xl font-bold">{activeCards}</p>
                </div>
                <div className="bg-blue-600/20 p-3 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Value</p>
                  <p className="text-2xl font-bold">${totalInitialValue.toFixed(2)}</p>
                </div>
                <div className="bg-orange-600/20 p-3 rounded-lg">
                  <ArrowUpRight className="h-6 w-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search by code or design..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            />
          </div>
          <Tabs value={filterDesign} onValueChange={setFilterDesign} className="w-auto">
            <TabsList className="bg-gray-800">
              <TabsTrigger value="all">All Designs</TabsTrigger>
              {uniqueDesigns.map(design => (
                <TabsTrigger key={design} value={design}>{design}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Gift Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCards.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <CreditCard className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">No gift cards found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || filterDesign !== "all" 
                  ? "Try adjusting your search or filters"
                  : "Get started by purchasing your first gift card"}
              </p>
              <Button
                onClick={() => setLocation('/shop')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Shop Gift Cards
              </Button>
            </div>
          ) : (
            filteredCards.map((card) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                className="cursor-pointer"
                onClick={() => setSelectedCard(card)}
              >
                <Card className="bg-gray-800 border-gray-700 overflow-hidden hover:border-gray-600 transition-all">
                  <div className={`h-32 bg-gradient-to-br ${getCardGradient(card.design)} p-4 relative`}>
                    <CreditCard className="absolute right-4 top-4 h-8 w-8 text-white/20" />
                    <div>
                      <p className="text-white font-semibold">{card.design} Card</p>
                      <p className="text-white/80 text-sm mt-1">
                        {card.recipientName || 'Gift Card'}
                      </p>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Balance</span>
                        <span className="text-xl font-bold">${card.balance}</span>
                      </div>
                      <Progress 
                        value={(parseFloat(card.balance) / parseFloat(card.initialAmount)) * 100}
                        className="h-2"
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-xs">
                          of ${card.initialAmount}
                        </span>
                        <Badge 
                          variant={parseFloat(card.balance) > 0 ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {parseFloat(card.balance) > 0 ? 'Active' : 'Depleted'}
                        </Badge>
                      </div>
                      <div className="pt-2 border-t border-gray-700">
                        <div className="flex items-center justify-between">
                          <code className="text-xs text-gray-400 font-mono">
                            {card.code.slice(0, 8)}...
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyCode(card.code);
                            }}
                            className="h-6 px-2"
                          >
                            {copiedCode === card.code ? (
                              <CheckCircle className="h-3 w-3 text-green-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Card Details Dialog */}
        <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Gift Card Details</DialogTitle>
              <DialogDescription>View and manage your gift card</DialogDescription>
            </DialogHeader>
            
            {selectedCard && (
              <div className="space-y-6">
                {/* Card Visual */}
                <div className={`h-48 bg-gradient-to-br ${getCardGradient(selectedCard.design)} p-6 rounded-lg relative`}>
                  <CreditCard className="absolute right-6 top-6 h-12 w-12 text-white/20" />
                  <div className="space-y-2">
                    <p className="text-white text-2xl font-bold">{selectedCard.design} Card</p>
                    <p className="text-white/80">{selectedCard.recipientName || 'Gift Card'}</p>
                    <p className="text-white text-3xl font-bold mt-4">${selectedCard.balance}</p>
                  </div>
                </div>

                {/* Card Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-400">Card Code</Label>
                    <div className="flex items-center space-x-2">
                      <code className="text-sm font-mono">{selectedCard.code}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyCode(selectedCard.code)}
                      >
                        {copiedCode === selectedCard.code ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-400">Initial Value</Label>
                    <p className="text-sm">${selectedCard.initialAmount}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Purchased On</Label>
                    <p className="text-sm">
                      {format(new Date(selectedCard.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Status</Label>
                    <Badge 
                      variant={parseFloat(selectedCard.balance) > 0 ? "default" : "secondary"}
                    >
                      {parseFloat(selectedCard.balance) > 0 ? 'Active' : 'Depleted'}
                    </Badge>
                  </div>
                </div>

                {/* Transactions */}
                {transactions.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Transaction History</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {transactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              tx.type === 'purchase' ? 'bg-green-900/50' : 'bg-red-900/50'
                            }`}>
                              {tx.type === 'purchase' ? 
                                <ArrowDownLeft className="h-4 w-4 text-green-400" /> :
                                <ArrowUpRight className="h-4 w-4 text-red-400" />
                              }
                            </div>
                            <div>
                              <p className="text-sm">{tx.description}</p>
                              <p className="text-xs text-gray-500">
                                {format(new Date(tx.createdAt), 'MMM d, h:mm a')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-medium ${
                              tx.type === 'purchase' ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {tx.type === 'purchase' ? '+' : '-'}${Math.abs(parseFloat(tx.amount)).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Balance: ${tx.balanceAfter}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setLocation(`/redeem?code=${selectedCard.code}`)}
                    disabled={parseFloat(selectedCard.balance) === 0}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Use Card
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedCard(null);
                      setLocation('/shop');
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Buy Another
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}