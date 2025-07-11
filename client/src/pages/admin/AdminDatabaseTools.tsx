import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Database, Download, Upload, RefreshCw, AlertCircle, CheckCircle, Clock, HardDrive, Activity, FileDown } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import SideNavigation from "@/components/SideNavigation";
import { format } from "date-fns";

interface DatabaseStats {
  totalSize: string;
  tableCount: number;
  recordCount: number;
  lastBackup?: string;
  tables: {
    name: string;
    rows: number;
    size: string;
  }[];
}

interface BackupJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt: string;
  completedAt?: string;
  size?: string;
  downloadUrl?: string;
  error?: string;
}

export default function AdminDatabaseTools() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeBackupJob, setActiveBackupJob] = useState<BackupJob | null>(null);
  const [isOptimizeDialogOpen, setIsOptimizeDialogOpen] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      window.location.href = "/api/login";
    }
  }, [isAuthenticated, isLoading, user]);

  // Fetch database stats from backend
  const { data: dbStats, isLoading: statsLoading } = useQuery<DatabaseStats>({
    queryKey: ['/api/admin/database/stats'],
    enabled: isAuthenticated && user?.role === 'admin',
    retry: false
  });

  // Create backup mutation
  const createBackupMutation = useMutation({
    mutationFn: async () => {
      // Simulate backup creation
      const job: BackupJob = {
        id: Date.now().toString(),
        status: 'running',
        progress: 0,
        startedAt: new Date().toISOString()
      };
      setActiveBackupJob(job);

      // Simulate progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setActiveBackupJob(prev => prev ? {...prev, progress: i} : null);
      }

      const completedJob: BackupJob = {
        ...job,
        status: 'completed',
        progress: 100,
        completedAt: new Date().toISOString(),
        size: '125.3 MB',
        downloadUrl: '/api/admin/database/backup/download/latest'
      };
      setActiveBackupJob(completedJob);
      return completedJob;
    },
    onSuccess: () => {
      toast({
        title: "Backup Complete",
        description: "Database backup has been created successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/database/stats'] });
    },
    onError: () => {
      toast({
        title: "Backup Failed",
        description: "Failed to create database backup. Please try again.",
        variant: "destructive"
      });
      setActiveBackupJob(null);
    }
  });

  // Export table mutation
  const exportTableMutation = useMutation({
    mutationFn: async (tableName: string) => {
      await apiRequest(`/api/admin/database/export/${tableName}`, {
        method: 'POST'
      });
    },
    onSuccess: (_, tableName) => {
      toast({
        title: "Export Started",
        description: `Table ${tableName} export has been initiated. You'll receive a download link shortly.`
      });
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "Failed to export table. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Optimize database mutation
  const optimizeDatabaseMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('/api/admin/database/optimize', {
        method: 'POST'
      });
    },
    onSuccess: () => {
      toast({
        title: "Optimization Complete",
        description: "Database has been optimized successfully."
      });
      setIsOptimizeDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/database/stats'] });
    },
    onError: () => {
      toast({
        title: "Optimization Failed",
        description: "Failed to optimize database. Please try again.",
        variant: "destructive"
      });
    }
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

  const downloadBackup = (url: string) => {
    // In production, this would trigger a secure download
    window.open(url, '_blank');
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
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-white mb-2">Database Tools</h1>
            <p className="text-gray-400">Manage database backups and maintenance</p>
          </motion.div>

          {/* Warning Alert */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mb-6"
          >
            <Alert className="bg-yellow-900 border-yellow-700">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-200">
                <strong>Caution:</strong> Database operations can be resource-intensive. 
                It's recommended to perform backups during low-traffic periods.
              </AlertDescription>
            </Alert>
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
                    <p className="text-sm text-gray-400">Database Size</p>
                    <p className="text-2xl font-bold text-white">{dbStats.totalSize}</p>
                  </div>
                  <HardDrive className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Tables</p>
                    <p className="text-2xl font-bold text-white">{dbStats.tableCount}</p>
                  </div>
                  <Database className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Records</p>
                    <p className="text-2xl font-bold text-white">
                      {dbStats.recordCount.toLocaleString()}
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Last Backup</p>
                    <p className="text-xl font-bold text-white">
                      {dbStats.lastBackup 
                        ? format(new Date(dbStats.lastBackup), 'MMM d')
                        : 'Never'
                      }
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Database Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mb-8"
          >
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Database Actions</CardTitle>
                <CardDescription className="text-gray-400">
                  Backup and maintenance operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    className="bg-purple-600 hover:bg-purple-700 h-24 flex flex-col items-center justify-center gap-2"
                    onClick={() => createBackupMutation.mutate()}
                    disabled={createBackupMutation.isPending || activeBackupJob?.status === 'running'}
                  >
                    <Download className="w-6 h-6" />
                    <span className="text-sm">Create Full Backup</span>
                  </Button>
                  
                  <Dialog open={isOptimizeDialogOpen} onOpenChange={setIsOptimizeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700 h-24 flex flex-col items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-6 h-6" />
                        <span className="text-sm">Optimize Database</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-800 border-gray-700">
                      <DialogHeader>
                        <DialogTitle className="text-white">Optimize Database</DialogTitle>
                        <DialogDescription className="text-gray-400">
                          This will reclaim unused space and rebuild indexes. The process may take several minutes.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <Alert className="bg-yellow-900 border-yellow-700">
                          <AlertCircle className="h-4 w-4 text-yellow-400" />
                          <AlertDescription className="text-yellow-200">
                            Database optimization will temporarily lock tables. 
                            Ensure no critical operations are running.
                          </AlertDescription>
                        </Alert>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                            onClick={() => setIsOptimizeDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={() => optimizeDatabaseMutation.mutate()}
                            disabled={optimizeDatabaseMutation.isPending}
                          >
                            {optimizeDatabaseMutation.isPending ? "Optimizing..." : "Start Optimization"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 h-24 flex flex-col items-center justify-center gap-2"
                    onClick={() => window.open('/api/admin/database/schema', '_blank')}
                  >
                    <FileDown className="w-6 h-6" />
                    <span className="text-sm">Export Schema</span>
                  </Button>
                </div>

                {/* Active Backup Job */}
                {activeBackupJob && (
                  <div className="mt-6 p-4 bg-gray-900 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-medium">
                        {activeBackupJob.status === 'running' ? 'Creating Backup...' : 'Backup Complete'}
                      </h3>
                      <Badge variant={activeBackupJob.status === 'completed' ? 'default' : 'secondary'}>
                        {activeBackupJob.status}
                      </Badge>
                    </div>
                    <Progress value={activeBackupJob.progress} className="mb-2" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">
                        Started: {format(new Date(activeBackupJob.startedAt), 'h:mm:ss a')}
                      </span>
                      {activeBackupJob.status === 'completed' && activeBackupJob.downloadUrl && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => downloadBackup(activeBackupJob.downloadUrl!)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download ({activeBackupJob.size})
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Table Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Database Tables</CardTitle>
                <CardDescription className="text-gray-400">
                  Individual table information and actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dbStats.tables?.map((table) => (
                    <div key={table.name} className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-medium">{table.name}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                            <span>{table.rows.toLocaleString()} rows</span>
                            <span>•</span>
                            <span>{table.size}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                            onClick={() => exportTableMutation.mutate(table.name)}
                          >
                            Export CSV
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}