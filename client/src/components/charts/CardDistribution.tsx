import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, RadialBarChart, RadialBar } from 'recharts';
import { PieChartIcon } from 'lucide-react';

interface CardDistributionProps {
  data?: any;
  isLoading?: boolean;
}

export function CardDistribution({ data, isLoading }: CardDistributionProps) {
  // Sample distribution data
  const distributionData = [
    { name: 'Birthday', value: 35, color: '#8b5cf6' },
    { name: 'Thank You', value: 25, color: '#3b82f6' },
    { name: 'Congratulations', value: 20, color: '#10b981' },
    { name: 'Holiday', value: 15, color: '#f59e0b' },
    { name: 'Custom', value: 5, color: '#ef4444' },
  ];

  const radialData = [
    { name: '$25', value: 40, fill: '#8b5cf6' },
    { name: '$50', value: 30, fill: '#3b82f6' },
    { name: '$100', value: 20, fill: '#10b981' },
    { name: '$200+', value: 10, fill: '#f59e0b' },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-sm p-3 rounded-lg border border-white/20 shadow-xl">
          <p className="text-white font-medium">{payload[0].name}</p>
          <p className="text-gray-300">{payload[0].value}%</p>
        </div>
      );
    }
    return null;
  };

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-sm font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Design Distribution */}
      <Card className="glassmorphism border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <PieChartIcon className="w-5 h-5 mr-2" />
            Card Design Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {distributionData.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm text-gray-300">{item.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Amount Distribution */}
      <Card className="glassmorphism border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <PieChartIcon className="w-5 h-5 mr-2" />
            Amount Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="90%" data={radialData}>
                <RadialBar
                  minAngle={15}
                  label={{ position: 'insideStart', fill: '#fff' }}
                  background
                  clockWise
                  dataKey="value"
                />
                <Tooltip content={<CustomTooltip />} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {radialData.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.fill }}
                ></div>
                <span className="text-sm text-gray-300">{item.name}: {item.value}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}