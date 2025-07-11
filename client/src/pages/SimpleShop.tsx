import { useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Gift, CreditCard, Sparkles, Heart, Star, Loader2, Download, Mail,
  ShoppingCart, Eye, Info, Check, ArrowRight, Zap, DollarSign
} from "lucide-react";
import { motion } from "framer-motion";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const purchaseSchema = z.object({
  initialAmount: z.coerce.number().min(10, "Amount must be at least $10").max(500, "Amount cannot exceed $500"),
  design: z.string(),
  recipientEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  recipientName: z.string().max(100, "Name too long").optional(),
  senderName: z.string().max(100, "Name too long").optional(),
  customMessage: z.string().max(500, "Message too long").optional(),
});

type PurchaseForm = z.infer<typeof purchaseSchema>;

// Gift card designs catalog
const giftCardDesigns = [
  {
    id: 'classic',
    name: 'Classic Purple',
    description: 'Timeless elegance with our signature purple gradient',
    price: 'From $10',
    gradient: 'from-purple-600 to-blue-600',
    icon: CreditCard,
    features: ['No expiration', 'Instant delivery', 'Custom message'],
    popular: false
  },
  {
    id: 'love',
    name: 'Love & Romance',
    description: 'Perfect for anniversaries and special moments',
    price: 'From $25',
    gradient: 'from-pink-500 to-rose-600',
    icon: Heart,
    features: ['Romantic design', 'Gift wrapping option', 'Special occasions'],
    popular: true
  },
  {
    id: 'premium',
    name: 'Premium Gold',
    description: 'Luxury gift card for VIP experiences',
    price: 'From $50',
    gradient: 'from-amber-500 to-yellow-600',
    icon: Sparkles,
    features: ['Premium packaging', 'Priority support', 'Exclusive benefits'],
    popular: false
  },
  {
    id: 'birthday',
    name: 'Birthday Celebration',
    description: 'Make their special day unforgettable',
    price: 'From $20',
    gradient: 'from-blue-500 to-purple-600',
    icon: Gift,
    features: ['Birthday theme', 'Confetti animation', 'Age customization'],
    popular: true
  },
  {
    id: 'business',
    name: 'Corporate Professional',
    description: 'Ideal for business gifts and rewards',
    price: 'From $100',
    gradient: 'from-gray-700 to-gray-900',
    icon: Star,
    features: ['Bulk discounts', 'Company branding', 'Tax invoices'],
    popular: false
  },
  {
    id: 'seasonal',
    name: 'Seasonal Special',
    description: 'Limited edition seasonal designs',
    price: 'From $15',
    gradient: 'from-green-500 to-emerald-600',
    icon: Zap,
    features: ['Limited time', 'Seasonal themes', 'Special bonuses'],
    popular: true
  }
];

// Quick amount options
const quickAmounts = [10, 25, 50, 100, 250, 500];

export default function SimpleShop() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDesign, setSelectedDesign] = useState<typeof giftCardDesigns[0] | null>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);

  const form = useForm<PurchaseForm>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      initialAmount: 50,
      design: '',
      recipientEmail: '',
      recipientName: '',
      senderName: '',
      customMessage: '',
    },
  });

  const createGiftCardMutation = useMutation({
    mutationFn: async (data: PurchaseForm) => {
      const response = await apiRequest('POST', '/api/giftcards', data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/giftcards/mine'] });
      toast({
        title: "Purchase Successful!",
        description: `Your gift card (${data.code}) has been created.`,
      });
      setShowPurchaseDialog(false);
      form.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Please log in",
          description: "You need to be logged in to purchase gift cards.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Purchase Failed",
        description: "Unable to complete your purchase. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDesignSelect = (design: typeof giftCardDesigns[0]) => {
    setSelectedDesign(design);
    form.setValue('design', design.id);
    setShowPurchaseDialog(true);
  };

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

  const onSubmit = (data: PurchaseForm) => {
    if (!isAuthenticated) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to purchase gift cards.",
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
      
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Gift Card Collection
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Choose from our premium selection of digital gift cards for every occasion
            </p>
          </motion.div>

          {/* Gift Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {giftCardDesigns.map((design, index) => (
              <motion.div
                key={design.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="glassmorphism border-white/20 overflow-hidden hover:scale-105 transition-all duration-300 h-full flex flex-col">
                  {/* Card Preview */}
                  <div className={`h-48 bg-gradient-to-br ${design.gradient} relative overflow-hidden`}>
                    {design.popular && (
                      <Badge className="absolute top-4 right-4 bg-yellow-500 text-black">
                        Popular
                      </Badge>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <design.icon className="w-24 h-24 text-white/20" />
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <p className="text-white font-bold text-lg">SiZu Gift Card</p>
                      <p className="text-white/80 text-sm">{design.name}</p>
                    </div>
                  </div>

                  {/* Card Details */}
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{design.name}</h3>
                      <p className="text-gray-300 text-sm mb-4">{design.description}</p>
                      
                      {/* Features */}
                      <div className="space-y-2 mb-4">
                        {design.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center text-gray-400 text-sm">
                            <Check className="w-4 h-4 mr-2 text-green-500" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Price and Action */}
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-lg font-bold text-white">{design.price}</span>
                      <Button
                        onClick={() => handleDesignSelect(design)}
                        className="gradient-primary text-white hover:opacity-90 transition-opacity"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Buy Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Info Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 text-center"
          >
            <Card className="glassmorphism border-white/20 max-w-3xl mx-auto">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-bold text-white mb-2">Instant Delivery</h3>
                    <p className="text-gray-400 text-sm">Gift cards delivered instantly via email</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Eye className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-bold text-white mb-2">Track Balance</h3>
                    <p className="text-gray-400 text-sm">Check your balance anytime, anywhere</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-bold text-white mb-2">Custom Design</h3>
                    <p className="text-gray-400 text-sm">
                      Want more options? Try our{' '}
                      <a href="/dashboard/user/designer" className="text-primary hover:underline">
                        Designer Studio
                      </a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Purchase Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Your Purchase</DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedDesign ? `You've selected: ${selectedDesign.name}` : 'Configure your gift card'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Amount Selection */}
            <div>
              <Label htmlFor="amount" className="text-white">Select Amount</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant={form.watch('initialAmount') === amount ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => form.setValue('initialAmount', amount)}
                    className={form.watch('initialAmount') === amount 
                      ? 'bg-primary text-white' 
                      : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}
                  >
                    ${amount}
                  </Button>
                ))}
              </div>
              <Input
                id="amount"
                type="number"
                min="10"
                max="500"
                step="1"
                {...form.register('initialAmount')}
                className="mt-2 bg-white/10 border-white/20 text-white placeholder-gray-400"
                placeholder="Or enter custom amount"
              />
              {form.formState.errors.initialAmount && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.initialAmount.message}</p>
              )}
            </div>

            {/* Recipient Details */}
            <div>
              <Label htmlFor="recipientName" className="text-white">Recipient Name (Optional)</Label>
              <Input
                id="recipientName"
                {...form.register('recipientName')}
                className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                placeholder="Who is this gift for?"
              />
            </div>

            <div>
              <Label htmlFor="recipientEmail" className="text-white">Send via Email (Optional)</Label>
              <Input
                id="recipientEmail"
                type="email"
                {...form.register('recipientEmail')}
                className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                placeholder="recipient@example.com"
              />
            </div>

            <div>
              <Label htmlFor="senderName" className="text-white">Your Name</Label>
              <Input
                id="senderName"
                {...form.register('senderName')}
                className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                placeholder="From..."
              />
            </div>

            <div>
              <Label htmlFor="customMessage" className="text-white">Add a Message (Optional)</Label>
              <Textarea
                id="customMessage"
                {...form.register('customMessage')}
                className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                placeholder="Write a personal message..."
                rows={3}
              />
            </div>

            {/* Total Price */}
            <div className="pt-4 border-t border-white/20">
              <div className="flex justify-between items-center text-white">
                <span className="text-lg font-bold">Total</span>
                <span className="text-2xl font-bold">${form.watch('initialAmount') || 0}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPurchaseDialog(false)}
                className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createGiftCardMutation.isPending}
                className="flex-1 gradient-primary text-white hover:opacity-90 transition-opacity"
              >
                {createGiftCardMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Complete Purchase
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}