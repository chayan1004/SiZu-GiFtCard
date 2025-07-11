import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, DollarSign, Percent, Settings2, TrendingUp, BarChart, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { apiRequest } from '@/lib/queryClient';

// Fee form schema
const feeFormSchema = z.object({
  feeType: z.string().min(1, "Fee type is required"),
  feeAmount: z.string().optional(),
  percentage: z.string().optional(),
  minAmount: z.string().optional(),
  maxAmount: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
}).refine(
  (data) => data.feeAmount || data.percentage,
  {
    message: "Either fee amount or percentage is required",
    path: ["feeAmount"],
  }
);

type FeeFormData = z.infer<typeof feeFormSchema>;

interface FeeManagementProps {
  theme?: 'light' | 'dark';
}

export default function FeeManagement({ theme = 'light' }: FeeManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFee, setSelectedFee] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch fee configurations
  const { data: fees = [], isLoading } = useQuery({
    queryKey: ['/api/admin/fees'],
  });

  // Form for create/edit
  const form = useForm<FeeFormData>({
    resolver: zodResolver(feeFormSchema),
    defaultValues: {
      feeType: '',
      feeAmount: '',
      percentage: '',
      minAmount: '',
      maxAmount: '',
      description: '',
      isActive: true,
    },
  });

  // Create fee mutation
  const createFeeMutation = useMutation({
    mutationFn: async (data: FeeFormData) => {
      const response = await apiRequest('POST', '/api/admin/fees', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/fees'] });
      toast({
        title: "Fee Created",
        description: "New fee configuration has been created successfully.",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create fee configuration.",
        variant: "destructive",
      });
    },
  });

  // Update fee mutation
  const updateFeeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FeeFormData> }) => {
      const response = await apiRequest('PATCH', `/api/admin/fees/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/fees'] });
      toast({
        title: "Fee Updated",
        description: "Fee configuration has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update fee configuration.",
        variant: "destructive",
      });
    },
  });

  // Delete fee mutation
  const deleteFeeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/admin/fees/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/fees'] });
      toast({
        title: "Fee Deleted",
        description: "Fee configuration has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete fee configuration.",
        variant: "destructive",
      });
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await apiRequest('PATCH', `/api/admin/fees/${id}`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/fees'] });
      toast({
        title: isActive ? "Fee Activated" : "Fee Deactivated",
        description: `Fee has been ${isActive ? 'activated' : 'deactivated'} successfully.`,
      });
    },
  });

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalCollected = fees.reduce((sum: number, fee: any) => {
      const amount = parseFloat(fee.feeAmount || '0');
      return sum + (fee.isActive ? amount : 0);
    }, 0);

    const activeFees = fees.filter((fee: any) => fee.isActive).length;
    const avgFee = activeFees > 0 ? totalCollected / activeFees : 0;

    return {
      totalCollected,
      activeFees,
      avgFee,
      totalConfigurations: fees.length,
    };
  }, [fees]);

  const handleEdit = (fee: any) => {
    setSelectedFee(fee);
    form.reset({
      feeType: fee.feeType,
      feeAmount: fee.feeAmount?.toString() || '',
      percentage: fee.percentage?.toString() || '',
      minAmount: fee.minAmount?.toString() || '',
      maxAmount: fee.maxAmount?.toString() || '',
      description: fee.description || '',
      isActive: fee.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (fee: any) => {
    setSelectedFee(fee);
    setIsDeleteDialogOpen(true);
  };

  const onSubmitCreate = (data: FeeFormData) => {
    createFeeMutation.mutate(data);
  };

  const onSubmitEdit = (data: FeeFormData) => {
    if (selectedFee) {
      updateFeeMutation.mutate({ id: selectedFee.id, data });
    }
  };

  const confirmDelete = () => {
    if (selectedFee) {
      deleteFeeMutation.mutate(selectedFee.id);
    }
  };

  // Theme-specific styles
  const isDark = theme === 'dark';
  const bgGradient = isDark 
    ? "from-gray-900 via-purple-900 to-gray-900" 
    : "from-green-50 via-emerald-50 to-teal-50";
  const cardBg = isDark ? "bg-gray-800 border-gray-700" : "bg-white";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-300" : "text-gray-600";
  const statCardBg = isDark 
    ? "bg-gradient-to-r from-purple-900 to-pink-900" 
    : "bg-gradient-to-r from-green-400 to-emerald-500";

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgGradient}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-4xl font-bold ${textPrimary} mb-2`}>
            Fee Management
          </h1>
          <p className={textSecondary}>
            Configure and manage platform fees for gift card transactions
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className={`${cardBg} border ${isDark ? 'hover:border-purple-500' : 'hover:border-green-500'} transition-all`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${statistics.totalCollected.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">From active fees</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className={`${cardBg} border ${isDark ? 'hover:border-purple-500' : 'hover:border-green-500'} transition-all`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Fees</CardTitle>
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.activeFees}</div>
                <p className="text-xs text-muted-foreground">Currently enabled</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className={`${cardBg} border ${isDark ? 'hover:border-purple-500' : 'hover:border-green-500'} transition-all`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Fee</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${statistics.avgFee.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Per active fee</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className={`${cardBg} border ${isDark ? 'hover:border-purple-500' : 'hover:border-green-500'} transition-all`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Configurations</CardTitle>
                <Settings2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.totalConfigurations}</div>
                <p className="text-xs text-muted-foreground">Total fee types</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Fee Configurations */}
        <Card className={`${cardBg} border`}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Fee Configurations</CardTitle>
              <CardDescription>Manage different types of fees for gift card operations</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className={isDark ? "bg-purple-600 hover:bg-purple-700" : ""}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Fee
                </Button>
              </DialogTrigger>
              <DialogContent className={isDark ? "bg-gray-800 text-white" : ""}>
                <DialogHeader>
                  <DialogTitle>Create New Fee</DialogTitle>
                  <DialogDescription>
                    Add a new fee configuration for gift card transactions
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitCreate)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="feeType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fee Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select fee type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="standard">Standard Processing</SelectItem>
                              <SelectItem value="premium">Premium Design</SelectItem>
                              <SelectItem value="corporate">Corporate Volume</SelectItem>
                              <SelectItem value="rush">Rush Delivery</SelectItem>
                              <SelectItem value="video">Video Message</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="feeAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fixed Fee Amount</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Fixed amount in dollars
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="percentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Percentage</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Percentage of transaction
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="minAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Amount</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              For percentage fees
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="maxAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum Amount</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              For percentage fees
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Fee description"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Active
                            </FormLabel>
                            <FormDescription>
                              Enable this fee immediately
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button type="submit" disabled={createFeeMutation.isPending}>
                        {createFeeMutation.isPending ? "Creating..." : "Create Fee"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="loading-shimmer w-16 h-16 mx-auto rounded-full"></div>
              </div>
            ) : fees.length === 0 ? (
              <div className="text-center py-8">
                <p className={textSecondary}>No fee configurations found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Create your first fee configuration to get started
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {fees.map((fee: any) => (
                  <motion.div
                    key={fee.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} border`}>
                      <CardContent className="flex items-center justify-between p-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{fee.feeType}</h3>
                            <Badge variant={fee.isActive ? "default" : "secondary"}>
                              {fee.isActive ? "Active" : "Inactive"}
                            </Badge>
                            {fee.percentage && (
                              <Badge variant="outline" className="gap-1">
                                <Percent className="h-3 w-3" />
                                {fee.percentage}%
                              </Badge>
                            )}
                          </div>
                          {fee.description && (
                            <p className="text-sm text-muted-foreground mb-2">{fee.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm">
                            {fee.feeAmount && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                ${parseFloat(fee.feeAmount).toFixed(2)}
                              </span>
                            )}
                            {fee.minAmount && (
                              <span className="text-muted-foreground">
                                Min: ${parseFloat(fee.minAmount).toFixed(2)}
                              </span>
                            )}
                            {fee.maxAmount && (
                              <span className="text-muted-foreground">
                                Max: ${parseFloat(fee.maxAmount).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={fee.isActive}
                            onCheckedChange={(checked) =>
                              toggleActiveMutation.mutate({ id: fee.id, isActive: checked })
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(fee)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(fee)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className={isDark ? "bg-gray-800 text-white" : ""}>
            <DialogHeader>
              <DialogTitle>Edit Fee Configuration</DialogTitle>
              <DialogDescription>
                Update the fee configuration details
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitEdit)} className="space-y-4">
                {/* Same form fields as create dialog */}
                <FormField
                  control={form.control}
                  name="feeType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fee Type</FormLabel>
                      <FormControl>
                        <Input {...field} disabled />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="feeAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fixed Fee Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Fixed amount in dollars
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="percentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Percentage</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Percentage of transaction
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="minAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          For percentage fees
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          For percentage fees
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Fee description"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Active
                        </FormLabel>
                        <FormDescription>
                          Enable this fee
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={updateFeeMutation.isPending}>
                    {updateFeeMutation.isPending ? "Updating..." : "Update Fee"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className={isDark ? "bg-gray-800 text-white" : ""}>
            <DialogHeader>
              <DialogTitle>Delete Fee Configuration</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this fee configuration? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {selectedFee && (
                <Card className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
                  <CardContent className="pt-6">
                    <p className="font-semibold">{selectedFee.feeType}</p>
                    {selectedFee.description && (
                      <p className="text-sm text-muted-foreground mt-1">{selectedFee.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      {selectedFee.feeAmount && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${parseFloat(selectedFee.feeAmount).toFixed(2)}
                        </span>
                      )}
                      {selectedFee.percentage && (
                        <span className="flex items-center gap-1">
                          <Percent className="h-3 w-3" />
                          {selectedFee.percentage}%
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteFeeMutation.isPending}
              >
                {deleteFeeMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}