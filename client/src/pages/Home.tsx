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
      
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {greeting}, {user?.firstName || 'User'}! 👋
                </h1>
                <p className="text-xl text-gray-300">
                  Welcome to your SiZu GiftCard dashboard
                </p>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                  {user?.role === 'admin' ? 'Admin' : 'User'}
                </Badge>
              </div>
            </div>
          </motion.div>

          {/* Admin Stats */}
          {user?.role === 'admin' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-12"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Admin Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {statsLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="glassmorphism border-white/20 loading-shimmer">
                      <CardContent className="p-6">
                        <div className="h-16"></div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <>
                    <Card className="glassmorphism border-white/20 card-hover-glow">
                      <CardContent className="p-6 text-center">
                        <div className="text-3xl font-bold text-white mb-2">
                          ${dashboardStats?.totalSales?.toLocaleString() || '0'}
                        </div>
                        <div className="text-gray-300">Total Sales</div>
                      </CardContent>
                    </Card>
                    <Card className="glassmorphism border-white/20 card-hover-glow">
                      <CardContent className="p-6 text-center">
                        <div className="text-3xl font-bold text-white mb-2">
                          {dashboardStats?.cardsIssued || '0'}
                        </div>
                        <div className="text-gray-300">Cards Issued</div>
                      </CardContent>
                    </Card>
                    <Card className="glassmorphism border-white/20 card-hover-glow">
                      <CardContent className="p-6 text-center">
                        <div className="text-3xl font-bold text-white mb-2">
                          {dashboardStats?.redemptionsCount || '0'}
                        </div>
                        <div className="text-gray-300">Redemptions</div>
                      </CardContent>
                    </Card>
                    <Card className="glassmorphism border-white/20 card-hover-glow">
                      <CardContent className="p-6 text-center">
                        <div className="text-3xl font-bold text-white mb-2">
                          ${dashboardStats?.activeBalance?.toLocaleString() || '0'}
                        </div>
                        <div className="text-gray-300">Active Balance</div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* Quick Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <Link href="/shop">
                <Card className="glassmorphism border-white/20 hover:scale-105 transition-transform duration-300 card-hover-glow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <ShoppingBag className="w-7 h-7 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">Shop</h3>
                    <p className="text-sm text-gray-400">Buy gift cards</p>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/balance">
                <Card className="glassmorphism border-white/20 hover:scale-105 transition-transform duration-300 card-hover-glow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Search className="w-7 h-7 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">Balance</h3>
                    <p className="text-sm text-gray-400">Check balance</p>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/redeem">
                <Card className="glassmorphism border-white/20 hover:scale-105 transition-transform duration-300 card-hover-glow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-pink-600/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <ArrowDownCircle className="w-7 h-7 text-pink-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">Redeem</h3>
                    <p className="text-sm text-gray-400">Use cards</p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/recharge">
                <Card className="glassmorphism border-white/20 hover:scale-105 transition-transform duration-300 card-hover-glow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-green-600/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Plus className="w-7 h-7 text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">Recharge</h3>
                    <p className="text-sm text-gray-400">Add funds</p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/order-history">
                <Card className="glassmorphism border-white/20 hover:scale-105 transition-transform duration-300 card-hover-glow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-amber-600/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <History className="w-7 h-7 text-amber-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">Orders</h3>
                    <p className="text-sm text-gray-400">View history</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </motion.div>

          {/* My Gift Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">My Gift Cards</h2>
              <Link href="/shop">
                <Button className="gradient-primary text-white hover:opacity-90 transition-opacity">
                  <Gift className="w-4 h-4 mr-2" />
                  Create New
                </Button>
              </Link>
            </div>
            
            {cardsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="glassmorphism border-white/20 loading-shimmer">
                    <CardContent className="p-6">
                      <div className="h-32"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : myGiftCards && myGiftCards.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myGiftCards.map((card: any) => (
                  <Card key={card.id} className="glassmorphism border-white/20 card-hover-glow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white">{card.design || 'Classic'} Design</CardTitle>
                        <Badge variant={card.isActive ? "default" : "secondary"} className="bg-green-500/20 text-green-300">
                          {card.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Balance:</span>
                          <span className="text-white font-bold">${parseFloat(card.currentBalance).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Code:</span>
                          <span className="text-white font-mono text-sm">{card.code}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Created:</span>
                          <span className="text-white text-sm">{new Date(card.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="glassmorphism border-white/20">
                <CardContent className="p-12 text-center">
                  <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No Gift Cards Yet</h3>
                  <p className="text-gray-300 mb-6">Create your first gift card to get started</p>
                  <Link href="/shop">
                    <Button className="gradient-primary text-white">
                      Create Gift Card
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* User Profile Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <Card className="glassmorphism border-white/20 max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    {user?.profileImageUrl ? (
                      <img 
                        src={user.profileImageUrl} 
                        alt="Profile" 
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'User'}
                      </h3>
                      <p className="text-gray-300">{user?.email}</p>
                      <Badge variant="outline" className="border-white/20 text-white">
                        {user?.role === 'admin' ? 'Administrator' : 'User'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex space-x-4 pt-4">
                    <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
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
