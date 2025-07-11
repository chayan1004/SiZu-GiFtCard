import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Palette, Plus, Trash2, Edit, Eye, Copy, Sparkles, Gift, Image as ImageIcon } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import SideNavigation from "@/components/SideNavigation";
import GiftCardPreview from "@/components/GiftCardPreview";

interface GiftCardDesign {
  id: string;
  name: string;
  description: string;
  category: string;
  baseColor: string;
  accentColor: string;
  textColor: string;
  pattern?: string;
  icon?: string;
  animation?: string;
  premiumFeatures?: {
    holographic?: boolean;
    embossed?: boolean;
    metallic?: boolean;
  };
  enabled: boolean;
  price?: number;
  minAmount?: number;
  maxAmount?: number;
  createdAt: string;
  updatedAt: string;
}

const DESIGN_CATEGORIES = [
  'Classic',
  'Premium',
  'Seasonal',
  'Birthday',
  'Love',
  'Gaming',
  'Anime',
  'Memes',
  'Corporate',
  'Custom'
];

const PATTERNS = [
  { value: 'none', label: 'None' },
  { value: 'dots', label: 'Dots' },
  { value: 'stripes', label: 'Stripes' },
  { value: 'waves', label: 'Waves' },
  { value: 'geometric', label: 'Geometric' },
  { value: 'floral', label: 'Floral' },
  { value: 'abstract', label: 'Abstract' },
  { value: 'gradient', label: 'Gradient' }
];

const ANIMATIONS = [
  { value: 'none', label: 'None' },
  { value: 'shimmer', label: 'Shimmer' },
  { value: 'pulse', label: 'Pulse' },
  { value: 'float', label: 'Float' },
  { value: 'rotate', label: 'Rotate' },
  { value: 'bounce', label: 'Bounce' },
  { value: 'glow', label: 'Glow' }
];

export default function AdminGiftCardDesigns() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState<GiftCardDesign | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Classic',
    baseColor: '#667eea',
    accentColor: '#764ba2',
    textColor: '#ffffff',
    pattern: 'none',
    icon: '',
    animation: 'none',
    holographic: false,
    embossed: false,
    metallic: false,
    price: 0,
    minAmount: 10,
    maxAmount: 1000,
    enabled: true
  });

  // Check if user is admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      window.location.href = "/api/login";
    }
  }, [isAuthenticated, isLoading, user]);

  // Fetch designs
  const { data: designs = [], isLoading: designsLoading } = useQuery<GiftCardDesign[]>({
    queryKey: ['/api/gift-card-designs'],
    enabled: isAuthenticated && user?.role === 'admin',
    retry: false
  });

  // Create design mutation
  const createDesignMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/gift-card-designs', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          premiumFeatures: {
            holographic: formData.holographic,
            embossed: formData.embossed,
            metallic: formData.metallic
          }
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Design Created",
        description: "The gift card design has been created successfully."
      });
      setIsCreateDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/gift-card-designs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create design. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Update design mutation
  const updateDesignMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiRequest(`/api/gift-card-designs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Design Updated",
        description: "The gift card design has been updated successfully."
      });
      setIsCreateDialogOpen(false);
      setIsEditMode(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/gift-card-designs'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update design. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete design mutation
  const deleteDesignMutation = useMutation({
    mutationFn: async (designId: string) => {
      await apiRequest(`/api/admin/gift-card-designs/${designId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "Design Deleted",
        description: "The gift card design has been deleted successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gift-card-designs'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete design. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Toggle design mutation
  const toggleDesignMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      await apiRequest(`/api/admin/gift-card-designs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled })
      });
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "The design status has been updated."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gift-card-designs'] });
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

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'Classic',
      baseColor: '#667eea',
      accentColor: '#764ba2',
      textColor: '#ffffff',
      pattern: 'none',
      icon: '',
      animation: 'none',
      holographic: false,
      embossed: false,
      metallic: false,
      price: 0,
      minAmount: 10,
      maxAmount: 1000,
      enabled: true
    });
    setSelectedDesign(null);
    setIsEditMode(false);
  };

  const handleEdit = (design: GiftCardDesign) => {
    setSelectedDesign(design);
    setFormData({
      name: design.name,
      description: design.description,
      category: design.category,
      baseColor: design.baseColor,
      accentColor: design.accentColor,
      textColor: design.textColor,
      pattern: design.pattern || 'none',
      icon: design.icon || '',
      animation: design.animation || 'none',
      holographic: design.premiumFeatures?.holographic || false,
      embossed: design.premiumFeatures?.embossed || false,
      metallic: design.premiumFeatures?.metallic || false,
      price: design.price || 0,
      minAmount: design.minAmount || 10,
      maxAmount: design.maxAmount || 1000,
      enabled: design.enabled
    });
    setIsEditMode(true);
    setIsCreateDialogOpen(true);
  };

  const handleDuplicate = (design: GiftCardDesign) => {
    setFormData({
      name: `${design.name} (Copy)`,
      description: design.description,
      category: design.category,
      baseColor: design.baseColor,
      accentColor: design.accentColor,
      textColor: design.textColor,
      pattern: design.pattern || 'none',
      icon: design.icon || '',
      animation: design.animation || 'none',
      holographic: design.premiumFeatures?.holographic || false,
      embossed: design.premiumFeatures?.embossed || false,
      metallic: design.premiumFeatures?.metallic || false,
      price: design.price || 0,
      minAmount: design.minAmount || 10,
      maxAmount: design.maxAmount || 1000,
      enabled: true
    });
    setIsEditMode(false);
    setIsCreateDialogOpen(true);
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

  const designsByCategory = designs.reduce((acc, design) => {
    if (!acc[design.category]) acc[design.category] = [];
    acc[design.category].push(design);
    return acc;
  }, {} as Record<string, GiftCardDesign[]>);

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
              <h1 className="text-3xl font-bold text-white mb-2">Gift Card Designs</h1>
              <p className="text-gray-400">Create and manage gift card design templates</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
              setIsCreateDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Design
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 border-gray-700 max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    {isEditMode ? 'Edit Design' : 'Create New Design'}
                  </DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Design a new gift card template
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-6 mt-4">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-300">Design Name</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="bg-gray-900 border-gray-700 text-white"
                        placeholder="Premium Gold Card"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Description</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="bg-gray-900 border-gray-700 text-white"
                        placeholder="A luxurious gold-themed gift card design"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Category</Label>
                      <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                        <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DESIGN_CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-gray-300">Base Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={formData.baseColor}
                            onChange={(e) => setFormData({...formData, baseColor: e.target.value})}
                            className="w-16 h-10 p-1 bg-gray-900 border-gray-700"
                          />
                          <Input
                            value={formData.baseColor}
                            onChange={(e) => setFormData({...formData, baseColor: e.target.value})}
                            className="bg-gray-900 border-gray-700 text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-gray-300">Accent Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={formData.accentColor}
                            onChange={(e) => setFormData({...formData, accentColor: e.target.value})}
                            className="w-16 h-10 p-1 bg-gray-900 border-gray-700"
                          />
                          <Input
                            value={formData.accentColor}
                            onChange={(e) => setFormData({...formData, accentColor: e.target.value})}
                            className="bg-gray-900 border-gray-700 text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-gray-300">Text Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={formData.textColor}
                            onChange={(e) => setFormData({...formData, textColor: e.target.value})}
                            className="w-16 h-10 p-1 bg-gray-900 border-gray-700"
                          />
                          <Input
                            value={formData.textColor}
                            onChange={(e) => setFormData({...formData, textColor: e.target.value})}
                            className="bg-gray-900 border-gray-700 text-white"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">Pattern</Label>
                        <Select value={formData.pattern} onValueChange={(v) => setFormData({...formData, pattern: v})}>
                          <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PATTERNS.map(pattern => (
                              <SelectItem key={pattern.value} value={pattern.value}>{pattern.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-gray-300">Animation</Label>
                        <Select value={formData.animation} onValueChange={(v) => setFormData({...formData, animation: v})}>
                          <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ANIMATIONS.map(anim => (
                              <SelectItem key={anim.value} value={anim.value}>{anim.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-300">Icon (Lucide icon name)</Label>
                      <Input
                        value={formData.icon}
                        onChange={(e) => setFormData({...formData, icon: e.target.value})}
                        className="bg-gray-900 border-gray-700 text-white"
                        placeholder="Gift, Star, Heart, etc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Premium Features</Label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-gray-400 font-normal">Holographic Effect</Label>
                          <Switch
                            checked={formData.holographic}
                            onCheckedChange={(checked) => setFormData({...formData, holographic: checked})}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-gray-400 font-normal">Embossed Text</Label>
                          <Switch
                            checked={formData.embossed}
                            onCheckedChange={(checked) => setFormData({...formData, embossed: checked})}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-gray-400 font-normal">Metallic Finish</Label>
                          <Switch
                            checked={formData.metallic}
                            onCheckedChange={(checked) => setFormData({...formData, metallic: checked})}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-gray-300">Design Fee</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                          className="bg-gray-900 border-gray-700 text-white"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Min Amount</Label>
                        <Input
                          type="number"
                          value={formData.minAmount}
                          onChange={(e) => setFormData({...formData, minAmount: parseInt(e.target.value) || 10})}
                          className="bg-gray-900 border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Max Amount</Label>
                        <Input
                          type="number"
                          value={formData.maxAmount}
                          onChange={(e) => setFormData({...formData, maxAmount: parseInt(e.target.value) || 1000})}
                          className="bg-gray-900 border-gray-700 text-white"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-300">Enabled</Label>
                      <Switch
                        checked={formData.enabled}
                        onCheckedChange={(checked) => setFormData({...formData, enabled: checked})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-300 mb-2 block">Preview</Label>
                    <div className="bg-gray-900 rounded-lg p-8 flex items-center justify-center">
                      <GiftCardPreview
                        amount={100}
                        code="PREVIEW-CODE"
                        recipientName="John Doe"
                        senderName="Jane Smith"
                        message="Happy Birthday!"
                        design={{
                          name: formData.name || 'Preview',
                          baseColor: formData.baseColor,
                          accentColor: formData.accentColor,
                          textColor: formData.textColor,
                          pattern: formData.pattern,
                          icon: formData.icon || 'Gift',
                          animation: formData.animation
                        }}
                        size="medium"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={() => {
                      if (isEditMode && selectedDesign) {
                        updateDesignMutation.mutate({
                          id: selectedDesign.id,
                          data: {
                            ...formData,
                            premiumFeatures: {
                              holographic: formData.holographic,
                              embossed: formData.embossed,
                              metallic: formData.metallic
                            }
                          }
                        });
                      } else {
                        createDesignMutation.mutate();
                      }
                    }}
                    disabled={!formData.name || createDesignMutation.isPending || updateDesignMutation.isPending}
                  >
                    {createDesignMutation.isPending || updateDesignMutation.isPending 
                      ? "Saving..." 
                      : isEditMode ? "Update Design" : "Create Design"
                    }
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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
                    <p className="text-sm text-gray-400">Total Designs</p>
                    <p className="text-2xl font-bold text-white">{designs.length}</p>
                  </div>
                  <Palette className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Active Designs</p>
                    <p className="text-2xl font-bold text-green-400">
                      {designs.filter(d => d.enabled).length}
                    </p>
                  </div>
                  <Eye className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Premium Designs</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      {designs.filter(d => d.category === 'Premium').length}
                    </p>
                  </div>
                  <Sparkles className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Categories</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {Object.keys(designsByCategory).length}
                    </p>
                  </div>
                  <ImageIcon className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Designs by Category */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {Object.entries(designsByCategory).map(([category, categoryDesigns]) => (
              <Card key={category} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">{category} Designs</CardTitle>
                  <CardDescription className="text-gray-400">
                    {categoryDesigns.length} design{categoryDesigns.length !== 1 ? 's' : ''} in this category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryDesigns.map((design) => (
                      <div key={design.id} className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-white font-medium">{design.name}</h3>
                            <p className="text-gray-400 text-sm">{design.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant={design.enabled ? "default" : "secondary"}>
                                {design.enabled ? "Active" : "Disabled"}
                              </Badge>
                              {design.price && design.price > 0 && (
                                <Badge variant="outline" className="text-gray-300 border-gray-600">
                                  ${design.price.toFixed(2)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mb-4">
                          <GiftCardPreview
                            amount={50}
                            code="SAMPLE"
                            recipientName="Sample"
                            design={{
                              name: design.name,
                              baseColor: design.baseColor,
                              accentColor: design.accentColor,
                              textColor: design.textColor,
                              pattern: design.pattern,
                              icon: design.icon || 'Gift',
                              animation: design.animation
                            }}
                            size="small"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700 flex-1"
                            onClick={() => handleEdit(design)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700 flex-1"
                            onClick={() => handleDuplicate(design)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className={design.enabled ? "border-yellow-600 text-yellow-400 hover:bg-yellow-900 flex-1" : "border-green-600 text-green-400 hover:bg-green-900 flex-1"}
                            onClick={() => toggleDesignMutation.mutate({
                              id: design.id,
                              enabled: !design.enabled
                            })}
                          >
                            {design.enabled ? 'Disable' : 'Enable'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-600 text-red-400 hover:bg-red-900"
                            onClick={() => deleteDesignMutation.mutate(design.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}