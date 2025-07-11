import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LiveRevenueTrackerProps {
  wsData?: any;
  todayRevenue?: number;
  yesterdayRevenue?: number;
}

export function LiveRevenueTracker({ wsData, todayRevenue = 0, yesterdayRevenue = 0 }: LiveRevenueTrackerProps) {
  const [currentRevenue, setCurrentRevenue] = useState(todayRevenue);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  // Calculate percentage change
  const percentageChange = yesterdayRevenue > 0 
    ? ((currentRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1)
    : '0.0';
  const isPositive = parseFloat(percentageChange) >= 0;

  // Update revenue when WebSocket data arrives
  useEffect(() => {
    if (wsData?.type === 'transaction') {
      setCurrentRevenue(prev => prev + (wsData.amount || 0));
      setPulseAnimation(true);
      
      // Add to recent transactions
      setRecentTransactions(prev => {
        const newTransaction = {
          id: Date.now(),
          amount: wsData.amount,
          type: wsData.transactionType,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        };
        return [newTransaction, ...prev].slice(0, 5);
      });

      // Remove pulse animation after duration
      setTimeout(() => setPulseAnimation(false), 1000);
    }
  }, [wsData]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Revenue Display */}
      <Card className="glassmorphism border-white/20 lg:col-span-2">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className={`p-3 rounded-full bg-green-500/20 ${pulseAnimation ? 'animate-pulse' : ''}`}>
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-300">Today's Revenue</h3>
                <p className="text-sm text-gray-500">Real-time tracking</p>
              </div>
            </div>
            <Badge 
              variant={isPositive ? "default" : "destructive"}
              className={isPositive ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}
            >
              {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {percentageChange}% vs yesterday
            </Badge>
          </div>

          <div className="flex items-baseline space-x-2">
            <motion.span
              key={currentRevenue}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold text-white"
            >
              ${currentRevenue.toLocaleString()}
            </motion.span>
            <span className="text-gray-400">USD</span>
          </div>

          {/* Live indicator */}
          <div className="mt-4 flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Activity className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-300">Live</span>
            </div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions Feed */}
      <Card className="glassmorphism border-white/20">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <AnimatePresence>
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        transaction.type === 'purchase' ? 'bg-green-400' : 'bg-blue-400'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          ${transaction.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">{transaction.time}</p>
                      </div>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="bg-white/10 text-white text-xs"
                    >
                      {transaction.type}
                    </Badge>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Waiting for transactions...</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}