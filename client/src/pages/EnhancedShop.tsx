import { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Gift, CreditCard, Sparkles, Heart, Star, Loader2, Download, Mail, 
  Palette, Type, Image, Wand2, ChevronRight, ChevronLeft, Eye,
  Zap, Brush, Layout, Camera, Globe, Sparkle, MessageSquare,
  Smartphone, Monitor, Plus, Minus, RotateCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Extended schema with advanced customization options
const createGiftCardSchema = z.object({
  initialAmount: z.coerce.number().min(1, "Amount must be at least $1").max(500, "Amount cannot exceed $500"),
  design: z.string().default("modern-gradient"),
  customMessage: z.string().max(500, "Message too long").optional(),
  recipientEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  recipientName: z.string().max(100, "Name too long").optional(),
  senderName: z.string().max(100, "Name too long").optional(),
  // Advanced customization
  primaryColor: z.string().default("#7c3aed"),
  secondaryColor: z.string().default("#ec4899"),
  fontFamily: z.string().default("Inter"),
  fontSize: z.number().default(16),
  pattern: z.string().default("none"),
  animation: z.string().default("none"),
  borderStyle: z.string().default("rounded"),
  textAlign: z.string().default("center"),
});

type CreateGiftCardForm = z.infer<typeof createGiftCardSchema>;

// Design templates with predefined styles
const designTemplates = [
  {
    id: "modern-gradient",
    name: "Modern Gradient",
    primaryColor: "#7c3aed",
    secondaryColor: "#ec4899",
    pattern: "gradient",
    animation: "float",
    preview: "bg-gradient-to-br from-purple-600 to-pink-500"
  },
  {
    id: "elegant-gold",
    name: "Elegant Gold",
    primaryColor: "#f59e0b",
    secondaryColor: "#dc2626",
    pattern: "luxury",
    animation: "shimmer",
    preview: "bg-gradient-to-r from-amber-500 to-red-600"
  },
  {
    id: "ocean-breeze",
    name: "Ocean Breeze",
    primaryColor: "#0891b2",
    secondaryColor: "#10b981",
    pattern: "waves",
    animation: "wave",
    preview: "bg-gradient-to-tr from-cyan-600 to-emerald-500"
  },
  {
    id: "cosmic-night",
    name: "Cosmic Night",
    primaryColor: "#6366f1",
    secondaryColor: "#8b5cf6",
    pattern: "stars",
    animation: "twinkle",
    preview: "bg-gradient-to-b from-indigo-500 to-violet-500"
  },
  {
    id: "love-romance",
    name: "Love & Romance",
    primaryColor: "#ec4899",
    secondaryColor: "#f43f5e",
    pattern: "hearts",
    animation: "pulse",
    preview: "bg-gradient-to-br from-pink-500 to-rose-500"
  },
  {
    id: "minimalist",
    name: "Minimalist",
    primaryColor: "#374151",
    secondaryColor: "#6b7280",
    pattern: "none",
    animation: "none",
    preview: "bg-gray-700"
  }
];

// Font options
const fontOptions = [
  { value: "Inter", label: "Inter (Modern)" },
  { value: "Playfair Display", label: "Playfair (Elegant)" },
  { value: "Roboto", label: "Roboto (Clean)" },
  { value: "Dancing Script", label: "Dancing Script (Fancy)" },
  { value: "Montserrat", label: "Montserrat (Professional)" },
  { value: "Pacifico", label: "Pacifico (Fun)" }
];

// Pattern options
const patternOptions = [
  { value: "none", label: "None" },
  { value: "gradient", label: "Gradient" },
  { value: "dots", label: "Dots" },
  { value: "lines", label: "Lines" },
  { value: "waves", label: "Waves" },
  { value: "hearts", label: "Hearts" },
  { value: "stars", label: "Stars" },
  { value: "confetti", label: "Confetti" }
];

// Animation options
const animationOptions = [
  { value: "none", label: "None" },
  { value: "float", label: "Float" },
  { value: "pulse", label: "Pulse" },
  { value: "shimmer", label: "Shimmer" },
  { value: "wave", label: "Wave" },
  { value: "twinkle", label: "Twinkle" },
  { value: "bounce", label: "Bounce" },
  { value: "rotate", label: "Rotate" }
];

// Live Preview Component
const LivePreview = ({ form, previewMode }: { form: any, previewMode: string }) => {
  const values = form.watch();
  const currentTemplate = designTemplates.find(t => t.id === values.design);
  
  const getAnimationClass = (animation: string) => {
    switch (animation) {
      case 'float': return 'animate-float';
      case 'pulse': return 'animate-pulse';
      case 'shimmer': return 'animate-shimmer';
      case 'wave': return 'animate-wave';
      case 'twinkle': return 'animate-twinkle';
      case 'bounce': return 'animate-bounce';
      case 'rotate': return 'animate-spin-slow';
      default: return '';
    }
  };

  const getPatternOverlay = (pattern: string) => {
    switch (pattern) {
      case 'dots': return 'pattern-dots';
      case 'lines': return 'pattern-lines';
      case 'waves': return 'pattern-waves';
      case 'hearts': return 'pattern-hearts';
      case 'stars': return 'pattern-stars';
      case 'confetti': return 'pattern-confetti';
      default: return '';
    }
  };

  const getBorderClass = (borderStyle: string) => {
    switch (borderStyle) {
      case 'rounded': return 'rounded-xl';
      case 'sharp': return '';
      case 'pill': return 'rounded-full';
      case 'diamond': return 'transform rotate-45';
      default: return 'rounded-xl';
    }
  };

  return (
    <div className={`relative ${previewMode === 'mobile' ? 'max-w-sm mx-auto' : ''}`}>
      <div className={`aspect-[1.6/1] relative overflow-hidden ${getBorderClass(values.borderStyle)} ${getAnimationClass(values.animation)}`}
           style={{
             background: `linear-gradient(135deg, ${values.primaryColor} 0%, ${values.secondaryColor} 100%)`,
           }}>
        {/* Pattern Overlay */}
        {values.pattern !== 'none' && (
          <div className={`absolute inset-0 ${getPatternOverlay(values.pattern)} opacity-20`} />
        )}
        
        {/* Card Content */}
        <div className="relative h-full p-8 flex flex-col justify-between text-white">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-bold mb-1" 
                  style={{ fontFamily: values.fontFamily }}>
                SiZu Gift Card
              </h3>
              <p className="text-sm opacity-80">Premium Digital Gift</p>
            </div>
            <div className="text-right">
              <Gift className="w-8 h-8 mb-2 ml-auto" />
              <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                {currentTemplate?.name}
              </Badge>
            </div>
          </div>

          {/* Amount */}
          <div className={`text-${values.textAlign}`}>
            <p className="text-5xl font-bold mb-2" 
               style={{ fontFamily: values.fontFamily, fontSize: `${values.fontSize * 2}px` }}>
              ${values.initialAmount || 0}
            </p>
            {values.recipientName && (
              <p className="text-lg mb-1" style={{ fontFamily: values.fontFamily }}>
                For: {values.recipientName}
              </p>
            )}
            {values.senderName && (
              <p className="text-sm opacity-80" style={{ fontFamily: values.fontFamily }}>
                From: {values.senderName}
              </p>
            )}
          </div>

          {/* Message */}
          {values.customMessage && (
            <div className="mt-4 p-3 bg-white/10 backdrop-blur-sm rounded-lg">
              <p className="text-sm" style={{ fontFamily: values.fontFamily, textAlign: values.textAlign }}>
                {values.customMessage}
              </p>
            </div>
          )}

          {/* Card Code Preview */}
          <div className="flex justify-between items-end mt-4">
            <div>
              <p className="text-xs opacity-60">Gift Card Code</p>
              <p className="font-mono text-sm">XXXX-XXXX-XXXX</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-60">Valid Until</p>
              <p className="text-sm">No Expiry</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function EnhancedShop() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [createdGiftCard, setCreatedGiftCard] = useState<any>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [activeCustomTab, setActiveCustomTab] = useState('template');

  // Fetch active fees
  const { data: activeFees = [] } = useQuery({
    queryKey: ['/api/fees/active'],
    enabled: step === 2,
  });

  const form = useForm<CreateGiftCardForm>({
    resolver: zodResolver(createGiftCardSchema),
    defaultValues: {
      initialAmount: 50,
      design: "modern-gradient",
      customMessage: "",
      recipientEmail: "",
      recipientName: "",
      senderName: "",
      primaryColor: "#7c3aed",
      secondaryColor: "#ec4899",
      fontFamily: "Inter",
      fontSize: 16,
      pattern: "gradient",
      animation: "float",
      borderStyle: "rounded",
      textAlign: "center",
    },
  });

  // AI Message Generation
  const generateMessageMutation = useMutation({
    mutationFn: async (params: any) => {
      const response = await apiRequest('POST', '/api/ai/generate-message', params);
      return response.json();
    },
    onSuccess: (data) => {
      form.setValue('customMessage', data.message);
      toast({
        title: "Message Generated!",
        description: "AI has created a personalized message for your gift card.",
      });
    },
  });

  // Calculate total price based on selected design and amount
  const calculateTotalPrice = () => {
    const amount = Number(form.watch('initialAmount')) || 0;
    const design = form.watch('design');
    const animation = form.watch('animation');
    let totalFees = 0;

    if (activeFees && activeFees.length > 0) {
      // Premium templates
      if (['elegant-gold', 'cosmic-night'].includes(design)) {
        const premiumFee = activeFees.find((fee: any) => fee.feeType === 'premium');
        if (premiumFee && premiumFee.feeAmount) {
          totalFees += parseFloat(premiumFee.feeAmount) || 0;
        }
      } else {
        const standardFee = activeFees.find((fee: any) => fee.feeType === 'standard');
        if (standardFee && standardFee.feeAmount) {
          totalFees += parseFloat(standardFee.feeAmount) || 0;
        }
      }

      // Animation fee
      if (animation !== 'none') {
        totalFees += 2.99; // Animation effect fee
      }
    }

    return Number(amount + totalFees);
  };

  // Apply design template
  const applyTemplate = (template: typeof designTemplates[0]) => {
    form.setValue('design', template.id);
    form.setValue('primaryColor', template.primaryColor);
    form.setValue('secondaryColor', template.secondaryColor);
    form.setValue('pattern', template.pattern);
    form.setValue('animation', template.animation);
  };

  const createGiftCardMutation = useMutation({
    mutationFn: async (data: CreateGiftCardForm) => {
      const response = await apiRequest('POST', '/api/giftcards', {
        ...data,
        design: data.design === 'modern-gradient' ? 'classic' : 
                data.design === 'love-romance' ? 'love' : 'premium'
      });
      return response.json();
    },
    onSuccess: (data) => {
      setCreatedGiftCard(data);
      setStep(3);
      queryClient.invalidateQueries({ queryKey: ['/api/giftcards/mine'] });
      toast({
        title: "Gift Card Created!",
        description: "Your gift card has been successfully created.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create gift card. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  const handleLogout = () => {
    toast({
      title: "Logging out...",
      description: "You will be redirected to the login page.",
    });
    setTimeout(() => {
      window.location.href = '/api/logout';
    }, 1000);
  };

  const onSubmit = (data: CreateGiftCardForm) => {
    if (!isAuthenticated) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to create gift cards.",
        variant: "destructive",
      });
      return;
    }

    createGiftCardMutation.mutate(data);
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
        onLogin={handleLogin}
        onLogout={handleLogout}
        showDashboard={user?.role === 'admin'}
      />
      
      <div className="pt-20 sm:pt-24 pb-12 sm:pb-16 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header - Responsive */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 sm:mb-12"
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 flex items-center justify-center flex-wrap gap-2">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-yellow-400" />
              <span>Gift Card Designer Studio</span>
            </h1>
            <p className="text-sm sm:text-base lg:text-xl text-gray-300 max-w-2xl mx-auto px-4">
              Create stunning, personalized gift cards with advanced customization
            </p>
          </motion.div>

          {/* Main Content - Split View Responsive */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Left Side - Customization Panel - Responsive */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4 sm:space-y-6"
            >
              <Card className="glassmorphism border-white/20">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                    <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
                    Design Studio
                  </CardTitle>
                  <CardDescription className="text-gray-300 text-sm">
                    Customize every aspect of your gift card
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <Tabs value={activeCustomTab} onValueChange={setActiveCustomTab}>
                    <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full bg-white/10 p-1">
                      <TabsTrigger value="template" className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm">
                        <Layout className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
                        <span className="hidden xs:inline">Templates</span>
                        <span className="xs:hidden">Tmpl</span>
                      </TabsTrigger>
                      <TabsTrigger value="colors" className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm">
                        <Palette className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
                        Colors
                      </TabsTrigger>
                      <TabsTrigger value="text" className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm">
                        <Type className="w-4 h-4 mr-1" />
                        Text
                      </TabsTrigger>
                      <TabsTrigger value="effects" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                        <Wand2 className="w-4 h-4 mr-1" />
                        Effects
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="template" className="space-y-4 mt-6">
                      <div className="grid grid-cols-2 gap-3">
                        {designTemplates.map((template) => (
                          <motion.div
                            key={template.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                              form.watch('design') === template.id 
                                ? 'border-primary shadow-lg shadow-primary/20' 
                                : 'border-white/20 hover:border-white/40'
                            }`}
                            onClick={() => applyTemplate(template)}
                          >
                            <div className={`h-24 ${template.preview}`} />
                            <div className="p-3 bg-black/20 backdrop-blur-sm">
                              <p className="text-white text-sm font-medium">{template.name}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="colors" className="space-y-4 mt-6">
                      <div>
                        <Label className="text-white mb-2 block">Primary Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            {...form.register('primaryColor')}
                            className="w-20 h-10 p-1 bg-white/10 border-white/20"
                          />
                          <Input
                            type="text"
                            value={form.watch('primaryColor')}
                            onChange={(e) => form.setValue('primaryColor', e.target.value)}
                            className="flex-1 bg-white/10 border-white/20 text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-white mb-2 block">Secondary Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            {...form.register('secondaryColor')}
                            className="w-20 h-10 p-1 bg-white/10 border-white/20"
                          />
                          <Input
                            type="text"
                            value={form.watch('secondaryColor')}
                            onChange={(e) => form.setValue('secondaryColor', e.target.value)}
                            className="flex-1 bg-white/10 border-white/20 text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-white mb-2 block">Pattern</Label>
                        <Select
                          value={form.watch('pattern')}
                          onValueChange={(value) => form.setValue('pattern', value)}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {patternOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TabsContent>

                    <TabsContent value="text" className="space-y-4 mt-6">
                      <div>
                        <Label className="text-white mb-2 block">Font Family</Label>
                        <Select
                          value={form.watch('fontFamily')}
                          onValueChange={(value) => form.setValue('fontFamily', value)}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fontOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-white mb-2 block">Font Size: {form.watch('fontSize')}px</Label>
                        <Slider
                          value={[form.watch('fontSize')]}
                          onValueChange={([value]) => form.setValue('fontSize', value)}
                          min={12}
                          max={24}
                          step={1}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <Label className="text-white mb-2 block">Text Alignment</Label>
                        <RadioGroup
                          value={form.watch('textAlign')}
                          onValueChange={(value) => form.setValue('textAlign', value)}
                        >
                          <div className="flex gap-4">
                            {['left', 'center', 'right'].map((align) => (
                              <div key={align} className="flex items-center space-x-2">
                                <RadioGroupItem value={align} id={align} />
                                <Label htmlFor={align} className="text-white capitalize cursor-pointer">
                                  {align}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </RadioGroup>
                      </div>
                    </TabsContent>

                    <TabsContent value="effects" className="space-y-4 mt-6">
                      <div>
                        <Label className="text-white mb-2 block">Animation</Label>
                        <Select
                          value={form.watch('animation')}
                          onValueChange={(value) => form.setValue('animation', value)}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {animationOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-white mb-2 block">Border Style</Label>
                        <RadioGroup
                          value={form.watch('borderStyle')}
                          onValueChange={(value) => form.setValue('borderStyle', value)}
                        >
                          <div className="grid grid-cols-2 gap-2">
                            {['rounded', 'sharp', 'pill', 'diamond'].map((style) => (
                              <div key={style} className="flex items-center space-x-2">
                                <RadioGroupItem value={style} id={`border-${style}`} />
                                <Label htmlFor={`border-${style}`} className="text-white capitalize cursor-pointer">
                                  {style}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </RadioGroup>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Gift Card Details Form - Responsive */}
              <Card className="glassmorphism border-white/20">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                    <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
                    Gift Card Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
                    <div>
                      <Label htmlFor="amount" className="text-white text-sm sm:text-base">Amount ($)</Label>
                      <div className="flex gap-2 mt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => form.setValue('initialAmount', Math.max(1, (form.watch('initialAmount') || 0) - 10))}
                          className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10"
                        >
                          <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        <Input
                          id="amount"
                          type="number"
                          min="1"
                          max="500"
                          step="1"
                          {...form.register('initialAmount')}
                          className="bg-white/10 border-white/20 text-white placeholder-gray-400 text-center text-sm sm:text-base h-8 sm:h-10"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => form.setValue('initialAmount', Math.min(500, (form.watch('initialAmount') || 0) + 10))}
                          className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10"
                        >
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                      {form.formState.errors.initialAmount && (
                        <p className="text-red-400 text-sm mt-1">{form.formState.errors.initialAmount.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="recipientName" className="text-white text-sm sm:text-base">Recipient Name</Label>
                      <Input
                        id="recipientName"
                        {...form.register('recipientName')}
                        className="bg-white/10 border-white/20 text-white placeholder-gray-400 text-sm sm:text-base h-8 sm:h-10"
                        placeholder="Who is this gift for?"
                      />
                    </div>

                    <div>
                      <Label htmlFor="recipientEmail" className="text-white text-sm sm:text-base">Recipient Email (Optional)</Label>
                      <Input
                        id="recipientEmail"
                        type="email"
                        {...form.register('recipientEmail')}
                        className="bg-white/10 border-white/20 text-white placeholder-gray-400 text-sm sm:text-base h-8 sm:h-10"
                        placeholder="Send gift card via email"
                      />
                    </div>

                    <div>
                      <Label htmlFor="senderName" className="text-white text-sm sm:text-base">Your Name</Label>
                      <Input
                        id="senderName"
                        {...form.register('senderName')}
                        className="bg-white/10 border-white/20 text-white placeholder-gray-400 text-sm sm:text-base h-8 sm:h-10"
                        placeholder="From..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="customMessage" className="text-white flex items-center justify-between text-sm sm:text-base">
                        <span>Personal Message</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => generateMessageMutation.mutate({
                            occasion: 'general',
                            recipient: form.watch('recipientName') || 'friend',
                            tone: 'friendly'
                          })}
                          disabled={generateMessageMutation.isPending}
                          className="text-primary hover:text-primary/80 text-xs sm:text-sm h-7 sm:h-8"
                        >
                          <Wand2 className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
                          <span className="hidden sm:inline">AI Generate</span>
                          <span className="sm:hidden">AI</span>
                        </Button>
                      </Label>
                      <Textarea
                        id="customMessage"
                        {...form.register('customMessage')}
                        className="bg-white/10 border-white/20 text-white placeholder-gray-400 text-sm sm:text-base"
                        placeholder="Add a personal message..."
                        rows={3}
                      />
                    </div>

                    {/* Price Breakdown - Responsive */}
                    <div className="pt-3 sm:pt-4 border-t border-white/20">
                      <div className="space-y-1.5 sm:space-y-2 text-white">
                        <div className="flex justify-between text-sm sm:text-base">
                          <span>Gift Card Amount</span>
                          <span className="font-medium">${form.watch('initialAmount') || 0}</span>
                        </div>
                        {activeFees.length > 0 && (
                          <>
                            <div className="flex justify-between text-xs sm:text-sm text-gray-300">
                              <span>Processing Fee</span>
                              <span>$2.95</span>
                            </div>
                            {form.watch('animation') !== 'none' && (
                              <div className="flex justify-between text-xs sm:text-sm text-gray-300">
                                <span>Animation Effect</span>
                                <span>$2.99</span>
                              </div>
                            )}
                          </>
                        )}
                        <div className="flex justify-between font-bold text-base sm:text-lg pt-2 border-t border-white/20">
                          <span>Total</span>
                          <span>${calculateTotalPrice().toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full gradient-primary text-white hover:opacity-90 transition-opacity h-9 sm:h-11 text-sm sm:text-base"
                      disabled={createGiftCardMutation.isPending}
                    >
                      {createGiftCardMutation.isPending ? (
                        <>
                          <Loader2 className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          Create Gift Card
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Right Side - Live Preview - Responsive */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4 sm:space-y-6"
            >
              <Card className="glassmorphism border-white/20 lg:sticky lg:top-24">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                      Live Preview
                    </CardTitle>
                    <div className="flex gap-1.5 sm:gap-2">
                      <Button
                        type="button"
                        variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setPreviewMode('desktop')}
                        className={`h-7 sm:h-8 px-2 sm:px-3 ${previewMode === 'desktop' ? 'bg-primary' : 'text-white hover:text-white/80'}`}
                      >
                        <Monitor className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setPreviewMode('mobile')}
                        className={`h-7 sm:h-8 px-2 sm:px-3 ${previewMode === 'mobile' ? 'bg-primary' : 'text-white hover:text-white/80'}`}
                      >
                        <Smartphone className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="text-gray-300 text-sm mt-1">
                    See your changes in real-time
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="p-4 sm:p-6 lg:p-8 bg-black/20 rounded-xl">
                    <LivePreview form={form} previewMode={previewMode} />
                  </div>

                  {/* Quick Actions - Responsive */}
                  <div className="mt-4 sm:mt-6 flex gap-2 sm:gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        form.reset();
                        toast({
                          title: "Reset Complete",
                          description: "All customizations have been reset to defaults.",
                        });
                      }}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-8 sm:h-9 text-xs sm:text-sm"
                    >
                      <RotateCw className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
                      Reset Design
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {createdGiftCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setCreatedGiftCard(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-slate-800 rounded-2xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Gift Card Created!</h3>
                <p className="text-gray-300 mb-6">
                  Your gift card has been successfully created and is ready to use.
                </p>
                <div className="bg-white/10 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-400 mb-1">Gift Card Code</p>
                  <p className="text-xl font-mono text-white">{createdGiftCard.code}</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setCreatedGiftCard(null);
                      form.reset();
                    }}
                    className="flex-1 gradient-primary text-white"
                  >
                    Create Another
                  </Button>
                  <Button
                    onClick={() => window.location.href = '/balance'}
                    variant="outline"
                    className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    Check Balance
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add custom animations to CSS */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes wave {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-shimmer { 
          background-size: 200% 100%;
          animation: shimmer 3s linear infinite;
        }
        .animate-wave { animation: wave 4s linear infinite; }
        .animate-twinkle { animation: twinkle 2s ease-in-out infinite; }
        .animate-spin-slow { animation: spin 10s linear infinite; }
        
        /* Pattern overlays */
        .pattern-dots {
          background-image: radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        .pattern-lines {
          background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px);
        }
        .pattern-waves {
          background-image: url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21.184 20c.357-.13.72-.264 1.088-.402l1.768-.661C33.64 15.347 39.647 14 50 14c10.271 0 15.362 1.222 24.629 4.928.955.383 1.869.74 2.75 1.072h6.225c-2.51-.73-5.139-1.691-8.233-2.928C65.888 13.278 60.562 12 50 12c-10.626 0-16.855 1.397-26.66 5.063l-1.767.662c-2.475.923-4.66 1.674-6.724 2.275h6.335zm0-20C13.258 2.892 8.077 4 0 4V2c5.744 0 9.951-.574 14.85-2h6.334zM77.38 0C85.239 2.966 90.502 4 100 4V2c-6.842 0-11.386-.542-16.396-2h-6.225zM0 14c8.44 0 13.718-1.21 22.272-4.402l1.768-.661C33.64 5.347 39.647 4 50 4c10.271 0 15.362 1.222 24.629 4.928C84.112 12.722 89.438 14 100 14v-2c-10.271 0-15.362-1.222-24.629-4.928C65.888 3.278 60.562 2 50 2 39.374 2 33.145 3.397 23.34 7.063l-1.767.662C13.223 10.84 8.163 12 0 12v2z' fill='%23ffffff' fill-opacity='0.1'/%3E%3C/svg%3E");
        }
        .pattern-hearts {
          background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 21.5c-.7-.7-1.7-1.2-2.7-1.2-2 0-3.6 1.6-3.6 3.6 0 2.4 2.1 4.3 5.3 7.2.4.3.8.7 1 .9.2-.2.6-.6 1-.9 3.2-2.9 5.3-4.8 5.3-7.2 0-2-1.6-3.6-3.6-3.6-1 0-2 .5-2.7 1.2z' fill='%23ffffff' fill-opacity='0.1'/%3E%3C/svg%3E");
          background-size: 40px 40px;
        }
        .pattern-stars {
          background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon points='20,5 24,15 35,15 26,22 30,32 20,25 10,32 14,22 5,15 16,15' fill='%23ffffff' fill-opacity='0.1'/%3E%3C/svg%3E");
          background-size: 40px 40px;
        }
        .pattern-confetti {
          background-image: 
            radial-gradient(circle at 20% 35%, rgba(255,255,255,0.2) 2px, transparent 2px),
            radial-gradient(circle at 75% 44%, rgba(255,255,255,0.2) 2px, transparent 2px),
            radial-gradient(circle at 46% 72%, rgba(255,255,255,0.15) 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>
    </div>
  );
}