import { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { TrendingUp, Users, Gift, AlertTriangle } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { 
  PageContainer, 
  PageHeader, 
  GlassCard,
  LoadingPage,
  Section,
  StatCard 
} from "@/components/DesignSystem";
import { CardContent } from "@/components/ui/card";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [greeting, setGreeting] = useState('Hello');

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
                      icon={<Users className="w-6 h-6 text-blue-400" />}
                      title="Active Users"
                      value={dashboardStats?.activeUsers || '0'}
                      color="bg-blue-600/20"
                      delay={0.3}
                    />
                    <StatCard
                      icon={<AlertTriangle className="w-6 h-6 text-yellow-400" />}
                      title="Pending Issues"
                      value={dashboardStats?.pendingIssues || '0'}
                      color="bg-yellow-600/20"
                      delay={0.4}
                    />
                  </>
                )}
              </div>
            </Section>
          )}

          {/* Quick Actions */}
          <Section title="Quick Actions" className="py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <Link href="/shop">
                <GlassCard className="group cursor-pointer hover:scale-105 transition-transform">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Gift className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">Shop</h3>
                    <p className="text-gray-300 text-sm">Buy gift cards</p>
                  </CardContent>
                </GlassCard>
              </Link>

              <Link href="/balance">
                <GlassCard className="group cursor-pointer hover:scale-105 transition-transform">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-6 h-6 text-green-400" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">Balance</h3>
                    <p className="text-gray-300 text-sm">Check balance</p>
                  </CardContent>
                </GlassCard>
              </Link>

              <Link href="/redeem">
                <GlassCard className="group cursor-pointer hover:scale-105 transition-transform">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Gift className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">Redeem</h3>
                    <p className="text-gray-300 text-sm">Use gift card</p>
                  </CardContent>
                </GlassCard>
              </Link>

              <Link href="/recharge">
                <GlassCard className="group cursor-pointer hover:scale-105 transition-transform">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-6 h-6 text-yellow-400" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">Recharge</h3>
                    <p className="text-gray-300 text-sm">Add funds</p>
                  </CardContent>
                </GlassCard>
              </Link>

              <Link href="/orders">
                <GlassCard className="group cursor-pointer hover:scale-105 transition-transform">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-indigo-600/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Users className="w-6 h-6 text-indigo-400" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">Orders</h3>
                    <p className="text-gray-300 text-sm">Order history</p>
                  </CardContent>
                </GlassCard>
              </Link>
            </div>
          </Section>

          {/* My Gift Cards */}
          <Section title="My Gift Cards" className="py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cardsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <GlassCard key={i} className="loading-shimmer">
                    <CardContent className="p-6">
                      <div className="h-24"></div>
                    </CardContent>
                  </GlassCard>
                ))
              ) : myGiftCards && myGiftCards.length > 0 ? (
                myGiftCards.map((card: any) => (
                  <GlassCard key={card.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm text-gray-300">{card.design}</div>
                        <div className="text-lg font-semibold text-white">
                          ${card.currentBalance.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 font-mono">{card.code}</div>
                      <div className="mt-4 flex gap-2">
                        <Link href={`/redeem?code=${card.code}`} className="flex-1">
                          <button className="w-full bg-primary/20 hover:bg-primary/30 text-primary-foreground py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                            Redeem
                          </button>
                        </Link>
                        <Link href={`/recharge?code=${card.code}`} className="flex-1">
                          <button className="w-full bg-secondary/20 hover:bg-secondary/30 text-secondary-foreground py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                            Recharge
                          </button>
                        </Link>
                      </div>
                    </CardContent>
                  </GlassCard>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Gift Cards Yet</h3>
                  <p className="text-gray-300 mb-4">Purchase your first gift card to get started</p>
                  <Link href="/shop">
                    <button className="bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-6 rounded-lg font-medium transition-colors">
                      Shop Gift Cards
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </Section>
        </div>
      </div>
    </PageContainer>
  );
}