import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { CreditCard, User, LogOut, Settings, BarChart3, Menu, History, TrendingUp, DollarSign } from "lucide-react";
import { Link, useLocation } from "wouter";

interface NavigationProps {
  user?: any;
  onLogin?: () => void;
  onLogout?: () => void;
  showDashboard?: boolean;
}

export default function Navigation({ user, onLogin, onLogout, showDashboard }: NavigationProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location === path;

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/shop', label: 'Shop' },
    { path: '/balance', label: 'Balance' },
    { path: '/redeem', label: 'Redeem' },
  ];
  
  // Add Order History only for authenticated users
  if (user) {
    navItems.push({ path: '/orders', label: 'Orders' });
  }

  if (showDashboard) {
    navItems.push({ path: '/dashboard', label: 'Dashboard' });
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glassmorphism border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">SiZu GiftCard</span>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <span className={`transition-colors cursor-pointer ${
                  isActive(item.path) 
                    ? 'text-primary font-semibold' 
                    : 'text-white hover:text-accent'
                }`}>
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
          
          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profileImageUrl} alt={user.firstName || 'User'} />
                      <AvatarFallback className="bg-primary text-white">
                        {user.firstName?.[0] || user.email?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-slate-900 border-white/20" align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium text-white">
                        {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'User'}
                      </p>
                      <p className="w-[200px] truncate text-sm text-gray-400">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-white/20" />
                  <Link href="/profile">
                    <DropdownMenuItem className="text-white hover:bg-white/10">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/orders">
                    <DropdownMenuItem className="text-white hover:bg-white/10">
                      <History className="mr-2 h-4 w-4" />
                      <span>Order History</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem className="text-white hover:bg-white/10">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  {/* Dashboard Link - Different based on role */}
                  <Link href={user?.role === 'admin' ? "/dashboard" : "/user-dashboard"}>
                    <DropdownMenuItem className="text-white hover:bg-white/10">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                  </Link>
                  {/* Admin-only links */}
                  {user?.role === 'admin' && (
                    <>
                      <Link href="/revenue">
                        <DropdownMenuItem className="text-white hover:bg-white/10">
                          <TrendingUp className="mr-2 h-4 w-4" />
                          <span>Revenue Analytics</span>
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/fees">
                        <DropdownMenuItem className="text-white hover:bg-white/10">
                          <DollarSign className="mr-2 h-4 w-4" />
                          <span>Fee Management</span>
                        </DropdownMenuItem>
                      </Link>
                    </>
                  )}
                  <DropdownMenuSeparator className="bg-white/20" />
                  <DropdownMenuItem 
                    className="text-red-400 hover:bg-red-500/10"
                    onClick={onLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login">
                  <Button 
                    className="hidden md:block gradient-primary text-white hover:opacity-90 transition-opacity"
                  >
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button 
                    variant="outline"
                    className="hidden md:block border-white/20 text-white hover:bg-white/10"
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] bg-slate-900 border-white/20">
                  <SheetHeader>
                    <SheetTitle className="text-white">Menu</SheetTitle>
                  </SheetHeader>
                  <div className="grid gap-6 py-6">
                    {navItems.map((item) => (
                      <Link key={item.path} href={item.path}>
                        <span 
                          className={`block text-lg font-medium transition-colors cursor-pointer ${
                            isActive(item.path) 
                              ? 'text-primary' 
                              : 'text-white hover:text-accent'
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {item.label}
                        </span>
                      </Link>
                    ))}
                    {!user && (
                      <div className="space-y-3">
                        <Link href="/login">
                          <Button 
                            onClick={() => setMobileMenuOpen(false)}
                            className="w-full gradient-primary text-white hover:opacity-90 transition-opacity"
                          >
                            Login
                          </Button>
                        </Link>
                        <Link href="/register">
                          <Button 
                            onClick={() => setMobileMenuOpen(false)}
                            variant="outline"
                            className="w-full border-white/20 text-white hover:bg-white/10"
                          >
                            Sign Up
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
