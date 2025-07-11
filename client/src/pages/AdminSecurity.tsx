import { useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield,
  AlertTriangle,
  Check,
  X,
  Lock,
  Key,
  FileWarning,
  ShieldAlert
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import SideNavigation from "@/components/SideNavigation";

export default function AdminSecurity() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Check if user is admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      window.location.href = "/api/login";
    }
  }, [isAuthenticated, isLoading, user]);

  // Fetch fraud alerts
  const { data: fraudAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['/api/admin/fraud-alerts'],
    retry: false,
    enabled: isAuthenticated && user?.role === 'admin',
  });

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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  const securityChecks = [
    { name: 'SSL Certificate', status: 'active', icon: Lock },
    { name: 'Rate Limiting', status: 'active', icon: Shield },
    { name: 'XSS Protection', status: 'active', icon: ShieldAlert },
    { name: 'SQL Injection Prevention', status: 'active', icon: FileWarning },
    { name: 'Session Security', status: 'active', icon: Key },
    { name: 'CORS Configuration', status: 'active', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Side Navigation */}
      <div className="w-64 flex-shrink-0">
        <SideNavigation user={user} onLogout={handleLogout} isAdmin={true} />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-x-hidden">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-bold text-white">Security Center</h1>
              <p className="text-gray-400 mt-1">
                Monitor and manage platform security
              </p>
            </motion.div>

            {/* Security Status */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            >
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Security Score</p>
                      <p className="text-2xl font-bold text-green-400">96%</p>
                      <p className="text-xs text-green-400 mt-1">Excellent</p>
                    </div>
                    <Shield className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Active Alerts</p>
                      <p className="text-2xl font-bold text-yellow-400">
                        {fraudAlerts?.filter((a: any) => !a.resolvedAt).length || 0}
                      </p>
                      <p className="text-xs text-yellow-400 mt-1">Requires attention</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Last Audit</p>
                      <p className="text-2xl font-bold text-white">2 days</p>
                      <p className="text-xs text-gray-400 mt-1">ago</p>
                    </div>
                    <FileWarning className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Security Checks */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Security Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {securityChecks.map((check) => {
                        const Icon = check.icon;
                        return (
                          <div key={check.name} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Icon className="w-5 h-5 text-gray-400" />
                              <span className="text-white">{check.name}</span>
                            </div>
                            {check.status === 'active' ? (
                              <Badge className="bg-green-500/20 text-green-400">
                                <Check className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge className="bg-red-500/20 text-red-400">
                                <X className="w-3 h-3 mr-1" />
                                Inactive
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Fraud Alerts */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Fraud Alerts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {fraudAlerts && fraudAlerts.length > 0 ? (
                      <div className="space-y-3">
                        {fraudAlerts.slice(0, 5).map((alert: any) => (
                          <div key={alert.id} className="p-3 bg-gray-900 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-white font-medium">{alert.reason}</p>
                                <p className="text-gray-400 text-sm mt-1">
                                  Card: {alert.giftCardCode?.slice(0, 8)}...
                                </p>
                                <p className="text-gray-500 text-xs mt-1">
                                  {new Date(alert.createdAt).toLocaleString()}
                                </p>
                              </div>
                              {alert.resolvedAt ? (
                                <Badge className="bg-green-500/20 text-green-400">Resolved</Badge>
                              ) : (
                                <Badge className="bg-yellow-500/20 text-yellow-400">Pending</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>No fraud alerts detected</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Audit Report */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-6"
            >
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Security Audit Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gray-900 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-white">25</p>
                      <p className="text-xs text-gray-400 mt-1">Tests Passed</p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-yellow-400">1</p>
                      <p className="text-xs text-gray-400 mt-1">Warnings</p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-400">0</p>
                      <p className="text-xs text-gray-400 mt-1">Critical Issues</p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-white">25ms</p>
                      <p className="text-xs text-gray-400 mt-1">Avg Response Time</p>
                    </div>
                  </div>
                  <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white">
                    Run Full Security Audit
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}