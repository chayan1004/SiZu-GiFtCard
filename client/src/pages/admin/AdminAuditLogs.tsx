import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { FileText, Filter, Download, User, Calendar, Activity, Search, Shield, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import SideNavigation from "@/components/SideNavigation";
import { format } from "date-fns";

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failure' | 'warning';
  errorMessage?: string;
}

const AUDIT_ACTIONS = [
  'user.login',
  'user.logout',
  'user.register',
  'user.update',
  'user.delete',
  'giftcard.create',
  'giftcard.redeem',
  'giftcard.recharge',
  'giftcard.update',
  'giftcard.delete',
  'payment.create',
  'payment.refund',
  'admin.settings_update',
  'admin.user_update',
  'admin.system_access',
  'security.suspicious_activity',
  'security.failed_login',
  'email.sent',
  'webhook.received',
  'api.access'
];

export default function AdminAuditLogs() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [filters, setFilters] = useState({
    search: '',
    action: 'all',
    user: 'all',
    dateFrom: '',
    dateTo: '',
    status: 'all'
  });

  // Check if user is admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      window.location.href = "/api/login";
    }
  }, [isAuthenticated, isLoading, user]);

  // Mock audit logs data - in production, this would come from the backend
  const { data: logs = [], isLoading: logsLoading } = useQuery<AuditLog[]>({
    queryKey: ['/api/admin/audit-logs', filters],
    enabled: isAuthenticated && user?.role === 'admin',
    initialData: [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        userId: '123',
        userEmail: 'admin@example.com',
        userRole: 'admin',
        action: 'admin.settings_update',
        resource: 'system_settings',
        details: { section: 'payments', fields: ['acceptApplePay'] },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 ...',
        status: 'success'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        userId: '456',
        userEmail: 'user@example.com',
        userRole: 'user',
        action: 'giftcard.redeem',
        resource: 'gift_card',
        resourceId: 'GC-123456',
        details: { amount: 50, remainingBalance: 150 },
        ipAddress: '10.0.0.1',
        userAgent: 'Chrome/91.0 ...',
        status: 'success'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        userId: '789',
        userEmail: 'suspicious@example.com',
        userRole: 'user',
        action: 'security.failed_login',
        resource: 'authentication',
        details: { attempts: 5, reason: 'Invalid password' },
        ipAddress: '123.456.789.0',
        userAgent: 'Unknown',
        status: 'failure',
        errorMessage: 'Account locked due to multiple failed attempts'
      }
    ]
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

  const exportLogs = () => {
    // In production, this would trigger a download
    const csv = [
      ['Timestamp', 'User', 'Action', 'Resource', 'Status', 'IP Address'],
      ...filteredLogs.map(log => [
        format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        log.userEmail,
        log.action,
        log.resource,
        log.status,
        log.ipAddress
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Audit logs have been exported to CSV."
    });
  };

  const getActionIcon = (action: string) => {
    if (action.startsWith('user.')) return <User className="w-4 h-4" />;
    if (action.startsWith('giftcard.')) return <FileText className="w-4 h-4" />;
    if (action.startsWith('security.')) return <Shield className="w-4 h-4" />;
    if (action.startsWith('admin.')) return <AlertCircle className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { variant: "default" | "secondary" | "destructive", label: string } } = {
      'success': { variant: 'default', label: 'Success' },
      'failure': { variant: 'destructive', label: 'Failed' },
      'warning': { variant: 'secondary', label: 'Warning' }
    };

    const config = statusMap[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getActionBadge = (action: string) => {
    const actionTypeMap: { [key: string]: string } = {
      'user.': 'blue',
      'giftcard.': 'green',
      'payment.': 'purple',
      'admin.': 'yellow',
      'security.': 'red',
      'email.': 'gray',
      'webhook.': 'indigo',
      'api.': 'cyan'
    };

    const type = Object.keys(actionTypeMap).find(key => action.startsWith(key));
    const color = actionTypeMap[type || ''] || 'gray';

    return (
      <Badge 
        variant="outline" 
        className={`text-${color}-400 border-${color}-600`}
      >
        {action}
      </Badge>
    );
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

  // Apply filters
  const filteredLogs = logs.filter(log => {
    if (filters.search && !Object.values(log).some(val => 
      String(val).toLowerCase().includes(filters.search.toLowerCase())
    )) return false;
    
    if (filters.action !== 'all' && log.action !== filters.action) return false;
    if (filters.status !== 'all' && log.status !== filters.status) return false;
    
    if (filters.dateFrom && new Date(log.timestamp) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(log.timestamp) > new Date(filters.dateTo)) return false;
    
    return true;
  });

  // Stats
  const totalLogs = filteredLogs.length;
  const successLogs = filteredLogs.filter(l => l.status === 'success').length;
  const failureLogs = filteredLogs.filter(l => l.status === 'failure').length;
  const securityEvents = filteredLogs.filter(l => l.action.startsWith('security.')).length;

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <div className="w-64 flex-shrink-0">
        <SideNavigation user={user} onLogout={handleLogout} isAdmin={true} />
      </div>
      
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 flex justify-between items-center"
          >
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Audit Logs</h1>
              <p className="text-gray-400">Track all system activities and changes</p>
            </div>
            <Button 
              className="bg-purple-600 hover:bg-purple-700"
              onClick={exportLogs}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </motion.div>

          {/* Stats Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Events</p>
                    <p className="text-2xl font-bold text-white">{totalLogs}</p>
                  </div>
                  <FileText className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Successful</p>
                    <p className="text-2xl font-bold text-green-400">{successLogs}</p>
                  </div>
                  <Activity className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Failed</p>
                    <p className="text-2xl font-bold text-red-400">{failureLogs}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Security Events</p>
                    <p className="text-2xl font-bold text-yellow-400">{securityEvents}</p>
                  </div>
                  <Shield className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mb-6"
          >
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="md:col-span-2">
                    <Label className="text-gray-300 mb-1 block text-sm">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <Input
                        value={filters.search}
                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                        placeholder="Search logs..."
                        className="pl-10 bg-gray-900 border-gray-700 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-300 mb-1 block text-sm">Action</Label>
                    <Select value={filters.action} onValueChange={(v) => setFilters({...filters, action: v})}>
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        {AUDIT_ACTIONS.map(action => (
                          <SelectItem key={action} value={action}>{action}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-300 mb-1 block text-sm">Status</Label>
                    <Select value={filters.status} onValueChange={(v) => setFilters({...filters, status: v})}>
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="failure">Failed</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-300 mb-1 block text-sm">Date From</Label>
                    <Input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300 mb-1 block text-sm">Date To</Label>
                    <Input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Logs List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Activity Log</CardTitle>
                <CardDescription className="text-gray-400">
                  Detailed record of all system activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No audit logs found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredLogs.map((log) => (
                      <div key={log.id} className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {getActionIcon(log.action)}
                              <span className="text-white font-medium">
                                {log.userEmail} ({log.userRole})
                              </span>
                              {getActionBadge(log.action)}
                              {getStatusBadge(log.status)}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-400">
                                  Resource: <span className="text-gray-300">{log.resource}</span>
                                  {log.resourceId && (
                                    <span className="text-gray-300"> ({log.resourceId})</span>
                                  )}
                                </p>
                                {log.details && (
                                  <p className="text-gray-400 mt-1">
                                    Details: <span className="text-gray-300">
                                      {JSON.stringify(log.details)}
                                    </span>
                                  </p>
                                )}
                                {log.errorMessage && (
                                  <p className="text-red-400 mt-1">
                                    Error: {log.errorMessage}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-gray-400">
                                  IP: <span className="text-gray-300 font-mono">{log.ipAddress}</span>
                                </p>
                                <p className="text-gray-400">
                                  {format(new Date(log.timestamp), 'MMM d, yyyy h:mm:ss a')}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}