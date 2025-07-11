import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar, Line } from 'recharts';
import { Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TransactionTrendsProps {
  data?: any[];
  isLoading?: boolean;
}

export function TransactionTrends({ data = [], isLoading }: TransactionTrendsProps) {
  // Generate sample trend data
  const trendData = [
    { hour: '00:00', purchases: 12, redemptions: 5, volume: 1200 },
    { hour: '04:00', purchases: 8, redemptions: 3, volume: 800 },
    { hour: '08:00', purchases: 25, redemptions: 12, volume: 2500 },
    { hour: '12:00', purchases: 45, redemptions: 20, volume: 4500 },
    { hour: '16:00', purchases: 38, redemptions: 18, volume: 3800 },
    { hour: '20:00', purchases: 30, redemptions: 15, volume: 3000 },
  ];

  const calculateTrend = () => {
    const lastTwo = trendData.slice(-2);
    if (lastTwo.length === 2) {
      const change = ((lastTwo[1].volume - lastTwo[0].volume) / lastTwo[0].volume) * 100;
      return { value: Math.abs(change).toFixed(1), isPositive: change > 0 };
    }
    return { value: '0.0', isPositive: true };
  };

  const trend = calculateTrend();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-sm p-3 rounded-lg border border-white/20 shadow-xl">
          <p className="text-white font-medium mb-2">{label}</p>
          <p className="text-purple-400">
            Purchases: {payload[0]?.value || 0}
          </p>
          <p className="text-blue-400">
            Redemptions: {payload[1]?.value || 0}
          </p>
          <p className="text-green-400">
            Volume: ${payload[2]?.value?.toLocaleString() || 0}
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="glassmorphism border-white/20">
        <CardContent className="h-80 flex items-center justify-center">
          <div className="loading-shimmer w-full h-full rounded-lg"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glassmorphism border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Transaction Trends
          </CardTitle>
          <Badge 
            variant={trend.isPositive ? "default" : "destructive"}
            className={trend.isPositive ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}
          >
            {trend.isPositive ? (
              <ArrowUpRight className="w-3 h-3 mr-1" />
            ) : (
              <ArrowDownRight className="w-3 h-3 mr-1" />
            )}
            {trend.value}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trendData}>
              <defs>
                <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="hour" stroke="#9ca3af" />
              <YAxis yAxisId="left" stroke="#9ca3af" />
              <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
              <Tooltip content={<CustomTooltip />} />
              <Bar yAxisId="left" dataKey="purchases" fill="#a855f7" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="left" dataKey="redemptions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="volume"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}