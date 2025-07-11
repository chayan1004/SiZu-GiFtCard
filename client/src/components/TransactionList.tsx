import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, TrendingUp, RefreshCw, AlertCircle } from "lucide-react";

interface TransactionListProps {
  transactions?: any[];
  isLoading: boolean;
}

export default function TransactionList({ transactions, isLoading }: TransactionListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="loading-shimmer h-16 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-400">No transactions found</p>
      </div>
    );
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'issue':
        return <CreditCard className="w-5 h-5 text-green-400" />;
      case 'redeem':
        return <RefreshCw className="w-5 h-5 text-blue-400" />;
      case 'refund':
        return <TrendingUp className="w-5 h-5 text-orange-400" />;
      default:
        return <CreditCard className="w-5 h-5 text-gray-400" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'issue':
        return 'bg-green-500/20 text-green-300';
      case 'redeem':
        return 'bg-blue-500/20 text-blue-300';
      case 'refund':
        return 'bg-orange-500/20 text-orange-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  const formatTransactionType = (type: string) => {
    switch (type) {
      case 'issue':
        return 'Gift Card Issued';
      case 'redeem':
        return 'Gift Card Redeemed';
      case 'refund':
        return 'Gift Card Refunded';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <Card key={transaction.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  {getTransactionIcon(transaction.type)}
                </div>
                <div>
                  <div className="text-white font-semibold">
                    {formatTransactionType(transaction.type)}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {new Date(transaction.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="text-right flex items-center space-x-4">
                <div>
                  <div className="text-white font-bold">
                    ${parseFloat(transaction.amount).toFixed(2)}
                  </div>
                  <div className="text-gray-400 text-sm">
                    Balance: ${parseFloat(transaction.balanceAfter).toFixed(2)}
                  </div>
                </div>
                <Badge className={getTransactionColor(transaction.type)}>
                  {transaction.type.toUpperCase()}
                </Badge>
              </div>
            </div>
            {transaction.notes && (
              <div className="mt-2 text-gray-300 text-sm">
                {transaction.notes}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
