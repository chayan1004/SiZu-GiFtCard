import { useEffect, useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { Gift, CreditCard, TrendingUp, User, Settings, LogOut, Plus, Search, ArrowDownCircle, History, ShoppingBag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import { 
  PageContainer, 
  PageHeader, 
  Section, 
  FeatureCard, 
  StatCard, 
  GlassCard, 
  LoadingPage,
  EmptyState,
  GradientButton 
} from "@/components/DesignSystem";
import { CardContent } from "@/components/ui/card";

export default function Home() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [greeting, setGreeting] = useState('');

  // Get user's gift cards
  const { data: myGiftCards, isLoading: cardsLoading } = useQuery({
    queryKey: ['/api/giftcards/mine'],
    retry: false,
  });

  // Get dashboard stats if user is admin
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    retry: false,
    enabled: user?.role === 'admin',
  });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good Morning');
    } else if (hour < 17) {
      setGreeting('Good Afternoon');
    } else {
      setGreeting('Good Evening');
    }
  }, []);

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
    return <LoadingPage />;
  }

  return (
    <PageContainer>
      <Navigation 
        user={user} 
        onLogout={handleLogout}
        showDashboard={user?.role === 'admin'}
      />
      
      <div className="pt-20 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1440px] mx-auto">
          {/* Welcome Header */}
          <PageHeader
            title={`${greeting}, ${user?.firstName || 'User'}!`}
            subtitle="Welcome to your gift card dashboard"
            gradient={false}
          />

          {/* Admin Stats */}
          {user?.role === 'admin' && (
            <Section title="Admin Overview" className="py-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statsLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <GlassCard key={i} className="loading-shimmer">
                      <CardContent className="p-6">
                        <div className="h-16"></div>
                      </CardContent>
                    </GlassCard>
                  ))
                ) : (
                  <>
                    <StatCard
                      icon={<TrendingUp className="w-6 h-6 text-green-400" />}
                      title="Total Sales"
                      value={`$${dashboardStats?.totalSales?.toLocaleString() || '0'}`}
                      color="bg-green-600/20"
                      delay={0.1}
                    />
                    <StatCard
                      icon={<Gift className="w-6 h-6 text-purple-400" />}
                      title="Cards Issued"
                      value={dashboardStats?.cardsIssued || '0'}
                      color="bg-purple-600/20"
                      delay={0.2}
                    />
                    <StatCard
                      icon={<CreditCard className="w-6 h-6 text-blue-400" />}
                      title="Redemptions"
                      value={dashboardStats?.redemptionsCount || '0'}
                      color="bg-blue-600/20"
                      delay={0.3}
                    />
                    <StatCard
                      icon={<User className="w-6 h-6 text-amber-400" />}
                      title="Active Balance"
                      value={`$${dashboardStats?.activeBalance?.toLocaleString() || '0'}`}
                      color="bg-amber-600/20"
                      delay={0.4}
                    />
                  </>
                )}
              </div>
            </Section>
          )}

          {/* Quick Actions */}
          <Section title="Quick Actions" className="py-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <FeatureCard
                icon={<ShoppingBag className="w-8 h-8 text-purple-400" />}
                title="Shop"
                description="Buy gift cards"
                iconColor="bg-purple-600/20"
                onClick={() => window.location.href = '/shop'}
                delay={0.1}
              />
              <FeatureCard
                icon={<Search className="w-8 h-8 text-blue-400" />}
                title="Balance"
                description="Check balance"
                iconColor="bg-blue-600/20"
                onClick={() => window.location.href = '/balance'}
                delay={0.2}
              />
              <FeatureCard
                icon={<ArrowDownCircle className="w-8 h-8 text-pink-400" />}
                title="Redeem"
                description="Use gift cards"
                iconColor="bg-pink-600/20"
                onClick={() => window.location.href = '/redeem'}
                delay={0.3}
              />
              <FeatureCard
                icon={<Plus className="w-8 h-8 text-green-400" />}
                title="Recharge"
                description="Add funds"
                iconColor="bg-green-600/20"
                onClick={() => window.location.href = '/recharge'}
                delay={0.4}
              />
              <FeatureCard
                icon={<History className="w-8 h-8 text-amber-400" />}
                title="History"
                description="View orders"
                iconColor="bg-amber-600/20"
                onClick={() => window.location.href = '/order-history'}
                delay={0.5}
              />
            </div>
          </Section>

          {/* My Gift Cards */}
          <Section title="My Gift Cards" className="py-8">
            <div className="flex justify-between items-center mb-6">
              <div></div>
              <GradientButton onClick={() => window.location.href = '/shop'}>
                <Gift className="w-4 h-4 mr-2" />
                Create New
              </GradientButton>
            </div>
            
            {cardsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <GlassCard key={i} className="loading-shimmer">
                    <CardContent className="p-6">
                      <div className="h-32"></div>
                    </CardContent>
                  </GlassCard>
                ))}
              </div>
            ) : myGiftCards && myGiftCards.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myGiftCards.map((card: any, index: number) => (
                  <AnimatedCard key={card.id} delay={index * 0.1}>
                    <GlassCard>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-white">{card.design || 'Classic'} Design</h3>
                          <Badge 
                            variant={card.isActive ? "default" : "secondary"} 
                            className={`text-xs px-2 py-0.5 ${
                              card.isActive 
                                ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                                : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                            }`}
                          >
                            {card.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 text-sm">Balance:</span>
                            <span className="text-white font-bold text-xl text-gradient">
                              ${parseFloat(card.currentBalance).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 text-sm">Code:</span>
                            <span className="text-white font-mono text-sm bg-white/10 px-2 py-0.5 rounded">
                              {card.code}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 text-sm">Created:</span>
                            <span className="text-white text-sm">
                              {new Date(card.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </GlassCard>
                  </AnimatedCard>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Gift className="w-8 h-8 text-gray-400" />}
                title="No Gift Cards Yet"
                description="Create your first gift card to get started"
                action={{
                  label: "Create Gift Card",
                  onClick: () => window.location.href = '/shop'
                }}
              />
            )}
          </Section>
        </div>
      </div>
    </PageContainer>
  );
}
