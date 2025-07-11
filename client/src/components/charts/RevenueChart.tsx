import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface RevenueChartProps {
  data?: any[];
  isLoading?: boolean;
  wsData?: any;
}

export function RevenueChart({ data = [], isLoading, wsData }: RevenueChartProps) {
  const [timeRange, setTimeRange] = useState('7d');
  const [chartType, setChartType] = useState('area');
  
  // Generate sample data for demonstration (will be replaced with real data)
  const generateChartData = () => {
    const days = timeRange === '24h' ? 24 : parseInt(timeRange);
    const baseData = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      if (timeRange === '24h') {
        date.setHours(date.getHours() - (days - i));
        baseData.push({
          time: format(date, 'HH:mm'),
          revenue: Math.floor(Math.random() * 500) + 100,
          transactions: Math.floor(Math.random() * 20) + 5,
        });
      } else {
        date.setDate(date.getDate() - (days - i));
        baseData.push({
          time: format(date, 'MMM dd'),
          revenue: Math.floor(Math.random() * 2000) + 500,
          transactions: Math.floor(Math.random() * 50) + 10,
        });
      }
    }
    
    return baseData;
  };

  const [chartData, setChartData] = useState(generateChartData());

  // Update chart data when WebSocket data arrives
  useEffect(() => {
    if (wsData?.type === 'revenue_update') {
      setChartData(prev => {
        const newData = [...prev];
        newData.push({
          time: format(new Date(), timeRange === '24h' ? 'HH:mm' : 'MMM dd'),
          revenue: wsData.revenue,
          transactions: wsData.transactions,
        });
        // Keep only the latest data points
        return newData.slice(-parseInt(timeRange === '24h' ? '24' : timeRange));
      });
    }
  }, [wsData, timeRange]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-sm p-3 rounded-lg border border-white/20 shadow-xl">
          <p className="text-white font-medium mb-2">{label}</p>
          <p className="text-green-400">
            Revenue: ${payload[0]?.value?.toLocaleString() || 0}
          </p>
          <p className="text-blue-400">
            Transactions: {payload[1]?.value || 0}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 30, left: 0, bottom: 0 }
    };

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="time" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#8b5cf6"
              fillOpacity={1}
              fill="url(#colorRevenue)"
              strokeWidth={2}
            />
          </AreaChart>
        );
      
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="time" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="revenue" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            <Bar dataKey="transactions" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        );
      
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="time" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#8b5cf6"
              strokeWidth={3}
              dot={{ fill: '#8b5cf6', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="transactions"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );
      
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card className="glassmorphism border-white/20">
        <CardContent className="h-96 flex items-center justify-center">
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
            <TrendingUp className="w-5 h-5 mr-2" />
            Revenue Analytics
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger className="w-28 bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="area">Area</SelectItem>
                <SelectItem value="bar">Bar</SelectItem>
                <SelectItem value="line">Line</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-28 bg-white/10 border-white/20 text-white">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24 Hours</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
        
        {/* Real-time indicator */}
        {wsData && (
          <div className="mt-4 flex items-center justify-end">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-gray-300">Live data</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}