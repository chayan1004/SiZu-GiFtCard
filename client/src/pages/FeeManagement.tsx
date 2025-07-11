import { useState } from "react";
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
import { SideNavigation } from "@/components/SideNavigation";
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
  Shield
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

export default function FeeManagement() {
  const { toast } = useToast();
  const [editingFee, setEditingFee] = useState<FeeConfiguration | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading fee configurations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-500">Error loading fee configurations</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fee Management</h1>
          <p className="text-muted-foreground mt-2">
            Configure transaction fees for gift cards
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Fee Configuration
        </Button>
      </div>

      {/* Fee Configurations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Configurations</CardTitle>
          <CardDescription>
            Manage different fee types and amounts for gift card transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fee Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Min/Max</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees && fees.length > 0 ? (
                fees.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell className="font-medium">
                      <Badge variant="outline">{fee.feeType}</Badge>
                    </TableCell>
                    <TableCell>{fee.feeName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {fee.isPercentage ? (
                          <Percent className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span>{formatFeeDisplay(fee)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {fee.minAmount || fee.maxAmount ? (
                        <span className="text-sm text-muted-foreground">
                          {fee.minAmount && `Min: $${fee.minAmount}`}
                          {fee.minAmount && fee.maxAmount && ' / '}
                          {fee.maxAmount && `Max: $${fee.maxAmount}`}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">No limits</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={fee.isActive ? "default" : "secondary"}>
                        {fee.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEdit(fee)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this fee configuration?')) {
                              deleteMutation.mutate(fee.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No fee configurations found. Click "Add Fee Configuration" to create one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreating || !!editingFee} onOpenChange={(open) => {
        if (!open) {
          setIsCreating(false);
          setEditingFee(null);
          resetForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFee ? 'Edit Fee Configuration' : 'Create Fee Configuration'}
            </DialogTitle>
            <DialogDescription>
              Configure the fee settings for gift card transactions
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="feeType">Fee Type</Label>
                <Input
                  id="feeType"
                  value={formData.feeType}
                  onChange={(e) => setFormData({ ...formData, feeType: e.target.value })}
                  placeholder="e.g., standard, premium"
                  required
                  disabled={!!editingFee}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="feeName">Fee Name</Label>
                <Input
                  id="feeName"
                  value={formData.feeName}
                  onChange={(e) => setFormData({ ...formData, feeName: e.target.value })}
                  placeholder="e.g., Standard Processing Fee"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="feeAmount">Fee Amount</Label>
                <Input
                  id="feeAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.feeAmount}
                  onChange={(e) => setFormData({ ...formData, feeAmount: e.target.value })}
                  placeholder={formData.isPercentage ? "5" : "2.95"}
                  required
                />
              </div>
              
              <div className="flex items-center space-x-2 mt-8">
                <Switch
                  id="isPercentage"
                  checked={formData.isPercentage}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPercentage: checked })}
                />
                <Label htmlFor="isPercentage">Percentage-based fee</Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minAmount">Minimum Fee Amount (Optional)</Label>
                <Input
                  id="minAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.minAmount}
                  onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                  placeholder="0.50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxAmount">Maximum Fee Amount (Optional)</Label>
                <Input
                  id="maxAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.maxAmount}
                  onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                  placeholder="10.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe when this fee applies..."
                rows={3}
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
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                {editingFee ? 'Update' : 'Create'} Fee
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}