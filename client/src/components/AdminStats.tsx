import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, CreditCard, RefreshCw, DollarSign } from "lucide-react";

interface AdminStatsProps {
  stats?: {
    totalSales: number;
    totalRedemptions: number;
    activeBalance: number;
    cardsIssued: number;
    redemptionsCount: number;
  };
  isLoading: boolean;
}

export default function AdminStats({ stats, isLoading }: AdminStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="glassmorphism border-white/20">
            <CardContent className="p-6">
              <div className="loading-shimmer h-20 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      title: "Total Sales",
      value: `$${stats?.totalSales?.toLocaleString() || '0'}`,
      icon: <DollarSign className="w-6 h-6" />,
      color: "text-green-400",
      bgColor: "bg-green-500/20"
    },
    {
      title: "Cards Issued",
      value: stats?.cardsIssued || '0',
      icon: <CreditCard className="w-6 h-6" />,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20"
    },
    {
      title: "Redemptions",
      value: stats?.redemptionsCount || '0',
      icon: <RefreshCw className="w-6 h-6" />,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20"
    },
    {
      title: "Active Balance",
      value: `$${stats?.activeBalance?.toLocaleString() || '0'}`,
      icon: <TrendingUp className="w-6 h-6" />,
      color: "text-orange-400",
      bgColor: "bg-orange-500/20"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {statItems.map((item, index) => (
        <Card 
          key={index} 
          className="glassmorphism border-white/20 hover:scale-105 transition-transform duration-300 card-hover-glow"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm font-medium">{item.title}</p>
                <p className="text-2xl font-bold text-white mt-1">{item.value}</p>
              </div>
              <div className={`p-3 rounded-full ${item.bgColor}`}>
                <div className={item.color}>
                  {item.icon}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
