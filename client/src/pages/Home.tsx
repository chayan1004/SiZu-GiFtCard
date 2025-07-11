import { useEffect, useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, CreditCard, TrendingUp, User, Settings, LogOut, Plus, Search, ArrowDownCircle, History, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";

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
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="loading-shimmer w-32 h-32 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation 
        user={user} 
        onLogout={handleLogout}
        showDashboard={user?.role === 'admin'}
      />
      
      <div className="pt-20 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1440px] mx-auto">
          {/* Welcome Header - Responsive */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8 sm:mb-10 lg:mb-12"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 leading-tight">
                  {greeting}, {user?.firstName || 'User'}! 👋
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-gray-300">
                  Welcome to your SiZu GiftCard dashboard
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Badge 
                  variant="secondary" 
                  className="bg-white/10 text-white border-white/20 px-3 py-1 text-sm sm:text-base backdrop-blur-sm"
                >
                  {user?.role === 'admin' ? 'Admin' : 'User'}
                </Badge>
              </div>
            </div>
          </motion.div>

          {/* Admin Stats - Responsive Grid */}
          {user?.role === 'admin' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-8 sm:mb-10 lg:mb-12"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Admin Overview</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {statsLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="glassmorphism border-white/20 loading-shimmer">
                      <CardContent className="p-4 sm:p-6">
                        <div className="h-12 sm:h-16"></div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <>
                    <Card className="glassmorphism border-white/20 card-hover-glow transform transition-all duration-200 hover:scale-105">
                      <CardContent className="p-4 sm:p-6 text-center">
                        <div className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-1 sm:mb-2">
                          ${dashboardStats?.totalSales?.toLocaleString() || '0'}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-300">Total Sales</div>
                      </CardContent>
                    </Card>
                    <Card className="glassmorphism border-white/20 card-hover-glow transform transition-all duration-200 hover:scale-105">
                      <CardContent className="p-4 sm:p-6 text-center">
                        <div className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-1 sm:mb-2">
                          {dashboardStats?.cardsIssued || '0'}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-300">Cards Issued</div>
                      </CardContent>
                    </Card>
                    <Card className="glassmorphism border-white/20 card-hover-glow transform transition-all duration-200 hover:scale-105">
                      <CardContent className="p-4 sm:p-6 text-center">
                        <div className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-1 sm:mb-2">
                          {dashboardStats?.redemptionsCount || '0'}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-300">Redemptions</div>
                      </CardContent>
                    </Card>
                    <Card className="glassmorphism border-white/20 card-hover-glow transform transition-all duration-200 hover:scale-105">
                      <CardContent className="p-4 sm:p-6 text-center">
                        <div className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 mb-1 sm:mb-2">
                          ${dashboardStats?.activeBalance?.toLocaleString() || '0'}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-300">Active Balance</div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* Quick Actions - Fully Responsive Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-8 sm:mb-10 lg:mb-12"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              <Link href="/shop">
                <Card className="glassmorphism border-white/20 hover:scale-105 transition-all duration-200 card-hover-glow cursor-pointer h-full">
                  <CardContent className="p-4 sm:p-5 lg:p-6 text-center flex flex-col items-center justify-center h-full">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-600/20 to-purple-600/10 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                      <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7 text-purple-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-0.5 sm:mb-1">Shop</h3>
                    <p className="text-xs sm:text-sm text-gray-400">Buy gift cards</p>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/balance">
                <Card className="glassmorphism border-white/20 hover:scale-105 transition-all duration-200 card-hover-glow cursor-pointer h-full">
                  <CardContent className="p-4 sm:p-5 lg:p-6 text-center flex flex-col items-center justify-center h-full">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-600/20 to-blue-600/10 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                      <Search className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-0.5 sm:mb-1">Balance</h3>
                    <p className="text-xs sm:text-sm text-gray-400">Check balance</p>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/redeem">
                <Card className="glassmorphism border-white/20 hover:scale-105 transition-all duration-200 card-hover-glow cursor-pointer h-full">
                  <CardContent className="p-4 sm:p-5 lg:p-6 text-center flex flex-col items-center justify-center h-full">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-pink-600/20 to-pink-600/10 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                      <ArrowDownCircle className="w-6 h-6 sm:w-7 sm:h-7 text-pink-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-0.5 sm:mb-1">Redeem</h3>
                    <p className="text-xs sm:text-sm text-gray-400">Use cards</p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/recharge">
                <Card className="glassmorphism border-white/20 hover:scale-105 transition-all duration-200 card-hover-glow cursor-pointer h-full">
                  <CardContent className="p-4 sm:p-5 lg:p-6 text-center flex flex-col items-center justify-center h-full">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-600/20 to-green-600/10 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                      <Plus className="w-6 h-6 sm:w-7 sm:h-7 text-green-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-0.5 sm:mb-1">Recharge</h3>
                    <p className="text-xs sm:text-sm text-gray-400">Add funds</p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/order-history" className="col-span-2 sm:col-span-1">
                <Card className="glassmorphism border-white/20 hover:scale-105 transition-all duration-200 card-hover-glow cursor-pointer h-full">
                  <CardContent className="p-4 sm:p-5 lg:p-6 text-center flex flex-col items-center justify-center h-full">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-amber-600/20 to-amber-600/10 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                      <History className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-0.5 sm:mb-1">Orders</h3>
                    <p className="text-xs sm:text-sm text-gray-400">View history</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </motion.div>

          {/* My Gift Cards - Responsive Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mb-8 sm:mb-10 lg:mb-12"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white">My Gift Cards</h2>
              <Link href="/shop">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base">
                  <Gift className="w-4 h-4 mr-1.5 sm:mr-2" />
                  Create New
                </Button>
              </Link>
            </div>
            
            {cardsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="glassmorphism border-white/20 loading-shimmer">
                    <CardContent className="p-4 sm:p-6">
                      <div className="h-24 sm:h-32"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : myGiftCards && myGiftCards.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                {myGiftCards.map((card: any) => (
                  <Card key={card.id} className="glassmorphism border-white/20 card-hover-glow hover:scale-105 transition-all duration-200">
                    <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white text-base sm:text-lg">{card.design || 'Classic'} Design</CardTitle>
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
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-2 sm:pt-2">
                      <div className="space-y-1.5 sm:space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm">Balance:</span>
                          <span className="text-white font-bold text-lg sm:text-xl bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                            ${parseFloat(card.currentBalance).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm">Code:</span>
                          <span className="text-white font-mono text-xs sm:text-sm bg-white/10 px-2 py-0.5 rounded">
                            {card.code}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm">Created:</span>
                          <span className="text-white text-xs sm:text-sm">
                            {new Date(card.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="glassmorphism border-white/20">
                <CardContent className="p-8 sm:p-12 text-center">
                  <Gift className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5 sm:mb-2">No Gift Cards Yet</h3>
                  <p className="text-gray-300 text-sm sm:text-base mb-4 sm:mb-6">Create your first gift card to get started</p>
                  <Link href="/shop">
                    <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base">
                      Create Gift Card
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* User Profile Section - Responsive */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <Card className="glassmorphism border-white/20 max-w-2xl mx-auto">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                    {user?.profileImageUrl ? (
                      <img 
                        src={user.profileImageUrl} 
                        alt="Profile" 
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover ring-2 ring-white/20"
                      />
                    ) : (
                      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center ring-2 ring-white/20">
                        <User className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                      </div>
                    )}
                    <div className="text-center sm:text-left">
                      <h3 className="text-lg sm:text-xl font-bold text-white">
                        {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'User'}
                      </h3>
                      <p className="text-gray-300 text-sm sm:text-base mb-1">{user?.email}</p>
                      <Badge 
                        variant="outline" 
                        className="border-white/20 text-white text-xs px-2 py-0.5"
                      >
                        {user?.role === 'admin' ? 'Administrator' : 'User'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-2 sm:pt-4">
                    <Button 
                      variant="outline" 
                      className="border-white/20 text-white hover:bg-white/10 transition-all duration-200 text-sm sm:text-base"
                    >
                      <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                      Settings
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all duration-200 text-sm sm:text-base"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                      Logout
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
