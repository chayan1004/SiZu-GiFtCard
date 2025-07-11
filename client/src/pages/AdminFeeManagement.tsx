import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import SideNavigation from "@/components/SideNavigation";
import { useAuth } from "@/hooks/useAuth";
import { 
  DollarSign, 
  Plus, 
  Edit2, 
  Trash2,
  Percent,
  Save,
  X,
  Settings,
  Activity,
  TrendingUp,
  Shield,
  Info,
  AlertCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";

interface FeeConfiguration {
  id: string;
  feeType: string;
  feeName: string;
  feeAmount: string;
  isPercentage: boolean;
  minAmount?: string;
  maxAmount?: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminFeeManagement() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [editingFee, setEditingFee] = useState<FeeConfiguration | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      window.location.href = "/api/login";
    }
  }, [isAuthenticated, authLoading, user]);

  const handleLogout = () => {
    toast({
      title: "Logging out...",
      description: "You will be redirected to the login page.",
    });
    setTimeout(() => {
      window.location.href = '/api/logout';
    }, 1000);
  };
  
  // Form state
  const [formData, setFormData] = useState({
    feeType: '',
    feeName: '',
    feeAmount: '',
    isPercentage: false,
    minAmount: '',
    maxAmount: '',
    description: ''
  });

  // Fee statistics
  const feeStats = {
    totalCollected: 8475.50,
    activeFees: 5,
    averageFee: 4.25,
    monthlyGrowth: 12.3
  };

  const { data: fees, isLoading, error } = useQuery<FeeConfiguration[]>({
    queryKey: ['/api/admin/fees']
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/admin/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/fees'] });
      toast({ title: "Fee configuration created successfully" });
      resetForm();
      setIsCreating(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create fee configuration",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest(`/api/admin/fees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/fees'] });
      toast({ title: "Fee configuration updated successfully" });
      setEditingFee(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update fee configuration",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/admin/fees/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/fees'] });
      toast({ title: "Fee configuration deleted successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete fee configuration",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const toggleFeeMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return await apiRequest(`/api/admin/fees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/fees'] });
      toast({ title: "Fee status updated successfully" });
    }
  });

  const resetForm = () => {
    setFormData({
      feeType: '',
      feeName: '',
      feeAmount: '',
      isPercentage: false,
      minAmount: '',
      maxAmount: '',
      description: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      feeAmount: formData.feeAmount || '0',
      minAmount: formData.minAmount || null,
      maxAmount: formData.maxAmount || null,
      isActive: true
    };

    if (editingFee) {
      updateMutation.mutate({ id: editingFee.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const startEdit = (fee: FeeConfiguration) => {
    setEditingFee(fee);
    setFormData({
      feeType: fee.feeType,
      feeName: fee.feeName,
      feeAmount: fee.feeAmount,
      isPercentage: fee.isPercentage,
      minAmount: fee.minAmount || '',
      maxAmount: fee.maxAmount || '',
      description: fee.description || ''
    });
  };

  const formatFeeDisplay = (fee: FeeConfiguration) => {
    if (fee.isPercentage) {
      return `${fee.feeAmount}%`;
    }
    return `$${fee.feeAmount}`;
  };

  const getFeeTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      standard: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      premium: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
      corporate: 'bg-green-500/20 text-green-400 border-green-500/50',
      rush: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
      video: 'bg-pink-500/20 text-pink-400 border-pink-500/50'
    };
    return colors[type] || 'bg-gray-500/20 text-gray-400 border-gray-500/50';
  };

  if (authLoading) {
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
      {/* Side Navigation */}
      <div className="w-64 flex-shrink-0">
        <SideNavigation user={user} onLogout={handleLogout} isAdmin={true} />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-x-hidden">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Fee Management</h1>
          <p className="text-gray-400">Configure and manage transaction fees for gift cards</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Collected</CardTitle>
                <DollarSign className="w-4 h-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">${feeStats.totalCollected.toFixed(2)}</div>
                <div className="flex items-center text-xs text-green-400 mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{feeStats.monthlyGrowth}% from last month
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-green-900/20 to-teal-900/20 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Active Fees</CardTitle>
                <Settings className="w-4 h-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{fees?.filter(f => f.isActive).length || 0}</div>
                <div className="text-xs text-gray-400 mt-1">Configuration types</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Average Fee</CardTitle>
                <Activity className="w-4 h-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">${feeStats.averageFee.toFixed(2)}</div>
                <div className="text-xs text-gray-400 mt-1">Per transaction</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-orange-900/20 to-red-900/20 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Configurations</CardTitle>
                <Shield className="w-4 h-4 text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{fees?.length || 0}</div>
                <div className="text-xs text-gray-400 mt-1">Fee types configured</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Add Fee Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Fee Configurations</h2>
          <Button
            onClick={() => setIsCreating(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Plus className="w-4 w-4 mr-2" />
            Add Fee Configuration
          </Button>
        </div>

        {/* Fee Configurations Grid */}
        {isLoading ? (
          <div className="text-center text-gray-400 py-12">Loading fee configurations...</div>
        ) : error ? (
          <div className="text-center text-red-400 py-12">Error loading fee configurations</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {fees && fees.length > 0 ? (
              fees.map((fee) => (
                <motion.div
                  key={fee.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-white flex items-center gap-2">
                            {fee.feeName}
                            <Badge className={getFeeTypeColor(fee.feeType)}>
                              {fee.feeType}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="text-gray-400 mt-1">
                            {fee.description || 'No description provided'}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={fee.isActive}
                            onCheckedChange={(checked) => 
                              toggleFeeMutation.mutate({ id: fee.id, isActive: checked })
                            }
                          />
                          <Badge variant={fee.isActive ? "default" : "secondary"}>
                            {fee.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Fee Amount Display */}
                        <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            {fee.isPercentage ? (
                              <Percent className="w-5 h-5 text-purple-400" />
                            ) : (
                              <DollarSign className="w-5 h-5 text-green-400" />
                            )}
                            <span className="text-2xl font-bold text-white">
                              {formatFeeDisplay(fee)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-400">
                            {fee.isPercentage ? 'Percentage Fee' : 'Fixed Fee'}
                          </div>
                        </div>

                        {/* Min/Max Limits */}
                        {(fee.minAmount || fee.maxAmount) && (
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Info className="w-4 h-4" />
                            <span>
                              {fee.minAmount && `Min: $${fee.minAmount}`}
                              {fee.minAmount && fee.maxAmount && ' • '}
                              {fee.maxAmount && `Max: $${fee.maxAmount}`}
                            </span>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(fee)}
                            className="flex-1 bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this fee configuration?')) {
                                deleteMutation.mutate(fee.id);
                              }
                            }}
                            className="flex-1 bg-gray-700 border-gray-600 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="col-span-2">
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <AlertCircle className="w-12 h-12 text-gray-500 mb-4" />
                    <p className="text-gray-400 text-center mb-4">
                      No fee configurations found. Create your first fee configuration to get started.
                    </p>
                    <Button
                      onClick={() => setIsCreating(true)}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Fee Configuration
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isCreating || !!editingFee} onOpenChange={(open) => {
          if (!open) {
            setIsCreating(false);
            setEditingFee(null);
            resetForm();
          }
        }}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editingFee ? 'Edit Fee Configuration' : 'Create Fee Configuration'}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Configure the fee settings for gift card transactions
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="feeType" className="text-gray-300">Fee Type</Label>
                  <Input
                    id="feeType"
                    value={formData.feeType}
                    onChange={(e) => setFormData({ ...formData, feeType: e.target.value })}
                    placeholder="e.g., standard, premium"
                    required
                    disabled={!!editingFee}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="feeName" className="text-gray-300">Fee Name</Label>
                  <Input
                    id="feeName"
                    value={formData.feeName}
                    onChange={(e) => setFormData({ ...formData, feeName: e.target.value })}
                    placeholder="e.g., Standard Processing Fee"
                    required
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="feeAmount" className="text-gray-300">Fee Amount</Label>
                  <Input
                    id="feeAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.feeAmount}
                    onChange={(e) => setFormData({ ...formData, feeAmount: e.target.value })}
                    placeholder={formData.isPercentage ? "5" : "2.95"}
                    required
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
                
                <div className="flex items-center space-x-2 mt-8">
                  <Switch
                    id="isPercentage"
                    checked={formData.isPercentage}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPercentage: checked })}
                  />
                  <Label htmlFor="isPercentage" className="text-gray-300">Percentage-based fee</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minAmount" className="text-gray-300">Minimum Fee Amount (Optional)</Label>
                  <Input
                    id="minAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.minAmount}
                    onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                    placeholder="0.50"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxAmount" className="text-gray-300">Maximum Fee Amount (Optional)</Label>
                  <Input
                    id="maxAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.maxAmount}
                    onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                    placeholder="10.00"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-300">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe when this fee applies..."
                  rows={3}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingFee(null);
                    resetForm();
                  }}
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingFee ? 'Update' : 'Create'} Fee
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}