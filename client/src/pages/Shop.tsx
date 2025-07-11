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
  Zap, Brush, Layout, Camera, Globe, Sparkle, MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";
import GiftCardPreview from "@/components/GiftCardPreview";
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

export default function Shop() {
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
      const response = await apiRequest('POST', '/api/giftcards', data);
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

  const handleDesignSelect = (design: string) => {
    form.setValue('design', design as any);
    setStep(2);
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

    // Check if user is admin
    if (user?.role !== 'admin') {
      toast({
        title: "Admin Access Required",
        description: "Only administrators can create gift cards.",
        variant: "destructive",
      });
      return;
    }

    createGiftCardMutation.mutate(data);
  };

  const giftCardDesigns = [
    {
      id: 'classic',
      name: 'Classic Design',
      gradient: 'gradient-primary',
      icon: <CreditCard className="w-6 h-6" />,
      description: 'Perfect for any occasion with our signature gradient design',
      color: 'from-purple-500 to-blue-500'
    },
    {
      id: 'love',
      name: 'Love Edition',
      gradient: 'gradient-love',
      icon: <Heart className="w-6 h-6" />,
      description: 'Show your love with our special heart-themed design',
      color: 'from-emerald-500 to-blue-500'
    },
    {
      id: 'premium',
      name: 'Premium Edition',
      gradient: 'gradient-premium',
      icon: <Sparkles className="w-6 h-6" />,
      description: 'Luxury design for special moments and celebrations',
      color: 'from-purple-500 to-pink-500'
    }
  ];

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
      
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Gift Card Shop</h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Create and customize premium digital gift cards
            </p>
          </motion.div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    step >= stepNum ? 'bg-primary text-white' : 'bg-white/20 text-gray-400'
                  }`}>
                    {stepNum}
                  </div>
                  {stepNum < 3 && (
                    <div className={`w-16 h-0.5 ${
                      step > stepNum ? 'bg-primary' : 'bg-white/20'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Design Selection */}
          {step === 1 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-white mb-8 text-center">Choose Your Design</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {giftCardDesigns.map((design) => (
                  <motion.div
                    key={design.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className={`glassmorphism rounded-2xl p-6 cursor-pointer hover:scale-105 transition-all duration-300 card-hover-glow ${
                      form.watch('design') === design.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleDesignSelect(design.id)}
                  >
                    <div className={`aspect-video bg-gradient-to-br ${design.color} rounded-xl mb-6 flex items-center justify-center`}>
                      <div className="text-center">
                        <div className="w-12 h-12 text-white mx-auto mb-2">
                          {design.icon}
                        </div>
                        <p className="text-white font-semibold">SiZu Gift Card</p>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{design.name}</h3>
                    <p className="text-gray-300 text-sm mb-4">{design.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-white">$1 - $500</span>
                      <Button 
                        size="sm"
                        className={`${design.gradient} text-white hover:opacity-90 transition-opacity`}
                      >
                        Select
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Customization */}
          {step === 2 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto"
            >
              <h2 className="text-2xl font-bold text-white mb-8 text-center">Customize Your Gift Card</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Preview */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white">Preview</h3>
                  <GiftCardPreview 
                    design={form.watch('design')}
                    amount={form.watch('initialAmount')}
                    customMessage={form.watch('customMessage')}
                    recipientName={form.watch('recipientName')}
                    senderName={form.watch('senderName')}
                  />
                </div>

                {/* Form */}
                <div className="space-y-6">
                  <Card className="glassmorphism border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white">Gift Card Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                          <Label htmlFor="amount" className="text-white">Amount ($)</Label>
                          <Input
                            id="amount"
                            type="number"
                            min="1"
                            max="500"
                            step="1"
                            {...form.register('initialAmount')}
                            className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                            placeholder="Enter amount"
                          />
                          {form.formState.errors.initialAmount && (
                            <p className="text-red-400 text-sm mt-1">{form.formState.errors.initialAmount.message}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="customMessage" className="text-white">Custom Message (Optional)</Label>
                          <Textarea
                            id="customMessage"
                            {...form.register('customMessage')}
                            className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                            placeholder="Add a personal message..."
                            rows={3}
                          />
                          {form.formState.errors.customMessage && (
                            <p className="text-red-400 text-sm mt-1">{form.formState.errors.customMessage.message}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="recipientName" className="text-white">Recipient Name (Optional)</Label>
                          <Input
                            id="recipientName"
                            {...form.register('recipientName')}
                            className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                            placeholder="Who is this gift for?"
                          />
                          {form.formState.errors.recipientName && (
                            <p className="text-red-400 text-sm mt-1">{form.formState.errors.recipientName.message}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="recipientEmail" className="text-white">Recipient Email (Optional)</Label>
                          <Input
                            id="recipientEmail"
                            type="email"
                            {...form.register('recipientEmail')}
                            className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                            placeholder="recipient@example.com"
                          />
                          {form.formState.errors.recipientEmail && (
                            <p className="text-red-400 text-sm mt-1">{form.formState.errors.recipientEmail.message}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="senderName" className="text-white">Your Name (Optional)</Label>
                          <Input
                            id="senderName"
                            {...form.register('senderName')}
                            className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                            placeholder="Your name"
                          />
                          {form.formState.errors.senderName && (
                            <p className="text-red-400 text-sm mt-1">{form.formState.errors.senderName.message}</p>
                          )}
                        </div>

                        {/* Price Breakdown */}
                        <div className="border-t border-white/20 pt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Gift Card Amount:</span>
                            <span className="text-white">${Number(form.watch('initialAmount') || 0).toFixed(2)}</span>
                          </div>
                          {activeFees.length > 0 && (
                            <>
                              {form.watch('design') === 'premium' && activeFees.find(fee => fee.feeType === 'premium') && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-300">Premium Design Fee:</span>
                                  <span className="text-white">${activeFees.find(fee => fee.feeType === 'premium')?.feeAmount}</span>
                                </div>
                              )}
                              {(form.watch('design') === 'classic' || form.watch('design') === 'love') && activeFees.find(fee => fee.feeType === 'standard') && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-300">Processing Fee:</span>
                                  <span className="text-white">${activeFees.find(fee => fee.feeType === 'standard')?.feeAmount}</span>
                                </div>
                              )}
                            </>
                          )}
                          <div className="flex justify-between font-bold pt-2 border-t border-white/20">
                            <span className="text-white">Total:</span>
                            <span className="text-white">${calculateTotalPrice().toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                          <Button 
                            type="button"
                            variant="outline"
                            onClick={() => setStep(1)}
                            className="flex-1 border-white/20 text-white hover:bg-white/10"
                          >
                            Back
                          </Button>
                          <Button 
                            type="submit"
                            disabled={createGiftCardMutation.isPending || !isAuthenticated || user?.role !== 'admin'}
                            className="flex-1 gradient-primary text-white hover:opacity-90 transition-opacity"
                          >
                            {createGiftCardMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              'Create Gift Card'
                            )}
                          </Button>
                        </div>

                        {!isAuthenticated && (
                          <div className="text-center p-4 bg-red-500/20 rounded-lg">
                            <p className="text-red-400 mb-2">Please log in to create gift cards</p>
                            <Button onClick={handleLogin} className="gradient-primary text-white">
                              Login
                            </Button>
                          </div>
                        )}

                        {isAuthenticated && user?.role !== 'admin' && (
                          <div className="text-center p-4 bg-yellow-500/20 rounded-lg">
                            <p className="text-yellow-400">Only administrators can create gift cards</p>
                          </div>
                        )}
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Success */}
          {step === 3 && createdGiftCard && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl mx-auto text-center"
            >
              <div className="glassmorphism rounded-2xl p-8 space-y-6">
                <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto">
                  <Gift className="w-8 h-8 text-white" />
                </div>
                
                <h2 className="text-3xl font-bold text-white">Gift Card Created!</h2>
                <p className="text-gray-300">Your gift card has been successfully created and is ready to use.</p>
                
                <div className="bg-white/10 rounded-lg p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Gift Card Code:</span>
                    <Badge className="bg-primary text-white font-mono">{createdGiftCard.code}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Amount:</span>
                    <span className="text-white font-bold">${parseFloat(createdGiftCard.initialAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Design:</span>
                    <span className="text-white capitalize">{createdGiftCard.design}</span>
                  </div>
                </div>

                {createdGiftCard.qrCode && (
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <img 
                      src={createdGiftCard.qrCode} 
                      alt="QR Code" 
                      className="w-32 h-32 mx-auto"
                    />
                    <p className="text-gray-600 text-sm mt-2">Scan to redeem</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button 
                    onClick={() => window.open(`${createdGiftCard.receiptUrl}/pdf`, '_blank')}
                    className="flex-1 gradient-primary text-white hover:opacity-90 transition-opacity"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Receipt
                  </Button>
                  <Button 
                    onClick={() => {
                      setStep(1);
                      setCreatedGiftCard(null);
                      form.reset();
                    }}
                    variant="outline"
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                  >
                    Create Another
                  </Button>
                </div>

                {form.watch('recipientEmail') && (
                  <div className="flex items-center justify-center text-green-400">
                    <Mail className="w-4 h-4 mr-2" />
                    <span className="text-sm">Email sent to recipient</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
