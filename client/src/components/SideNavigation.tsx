import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  CreditCard, 
  Users, 
  ShoppingBag,
  TrendingUp,
  Receipt,
  Settings,
  LogOut,
  Package,
  DollarSign,
  BarChart3,
  UserCircle,
  History,
  Shield,
  Wallet
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SideNavigationProps {
  user: any;
  onLogout: () => void;
  isAdmin?: boolean;
}

export default function SideNavigation({ user, onLogout, isAdmin = false }: SideNavigationProps) {
  const [location] = useLocation();

  const adminNavItems = [
    { path: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard },
    { path: '/admin/gift-cards', label: 'Gift Cards', icon: CreditCard },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/transactions', label: 'Transactions', icon: Receipt },
    { path: '/admin/revenue', label: 'Revenue', icon: TrendingUp },
    { path: '/admin/fees', label: 'Fee Management', icon: DollarSign },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/admin/security', label: 'Security', icon: Shield },
  ];

  const userNavItems = [
    { path: '/dashboard/user', label: 'My Dashboard', icon: LayoutDashboard },
    { path: '/shop', label: 'Buy Gift Cards', icon: ShoppingBag },
    { path: '/balance', label: 'Check Balance', icon: Wallet },
    { path: '/redeem', label: 'Redeem Card', icon: Package },
    { path: '/orders', label: 'Order History', icon: History },
    { path: '/profile', label: 'My Profile', icon: UserCircle },
  ];

  const navItems = isAdmin ? adminNavItems : userNavItems;

  const isActive = (path: string) => location === path;

  return (
    <div className="h-full bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-2 rounded-lg">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Gift Card Pro</h2>
            <p className="text-xs text-gray-400">{isAdmin ? 'Admin Portal' : 'Customer Portal'}</p>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.profileImageUrl} />
            <AvatarFallback className="bg-purple-600 text-white">
              {user?.firstName?.[0] || user?.username?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.firstName || user?.username || 'User'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {user?.email || 'user@example.com'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <span
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg transition-all cursor-pointer",
                isActive(item.path)
                  ? "bg-purple-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </span>
          </Link>
        ))}
      </nav>

      {/* Settings & Logout */}
      <div className="p-4 border-t border-gray-800 space-y-2">
        <Link href="/settings">
          <span className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-all cursor-pointer">
            <Settings className="w-5 h-5" />
            <span className="text-sm font-medium">Settings</span>
          </span>
        </Link>
        <Button
          onClick={onLogout}
          variant="ghost"
          className="w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-white"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span className="text-sm font-medium">Logout</span>
        </Button>
      </div>
    </div>
  );
}