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
  ShoppingCart, Eye, Info, Check, ArrowRight, Zap, DollarSign,
  Gamepad2, Sword, Trophy, Laugh, TrendingUp, Rocket, Crown,
  Gem, Shield, Flame, Moon, Sun, CloudLightning, Skull,
  Cherry, Cat, Fish, Ghost, Pizza, Coffee, Music, Tv
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

const purchaseSchema = z.object({
  initialAmount: z.coerce.number().min(10, "Amount must be at least $10").max(500, "Amount cannot exceed $500"),
  design: z.string(),
  recipientEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  recipientName: z.string().max(100, "Name too long").optional(),
  senderName: z.string().max(100, "Name too long").optional(),
  customMessage: z.string().max(500, "Message too long").optional(),
});

type PurchaseForm = z.infer<typeof purchaseSchema>;

// Categories
const categories = [
  { id: 'all', name: 'All Cards', icon: Sparkles },
  { id: 'anime', name: 'Anime', icon: Cherry },
  { id: 'gaming', name: 'Gaming', icon: Gamepad2 },
  { id: 'memes', name: 'Memes', icon: Laugh },
  { id: 'premium', name: 'Premium', icon: Crown },
  { id: 'classic', name: 'Classic', icon: Star },
  { id: 'trending', name: 'Trending', icon: TrendingUp }
];

// Enhanced gift card designs catalog
const giftCardDesigns = [
  // Classic Cards
  {
    id: 'classic-purple',
    name: 'Classic Purple',
    category: 'classic',
    description: 'Timeless elegance with our signature purple gradient',
    price: 'From $10',
    gradient: 'from-purple-600 via-purple-800 to-indigo-900',
    backgroundPattern: 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))]',
    icon: CreditCard,
    features: ['No expiration', 'Instant delivery', 'Custom message'],
    popular: false,
    animation: 'hover:scale-105 hover:rotate-1',
    glow: 'hover:shadow-purple-500/50'
  },
  {
    id: 'love-romance',
    name: 'Love & Romance',
    category: 'classic',
    description: 'Perfect for anniversaries and special moments',
    price: 'From $25',
    gradient: 'from-pink-500 via-rose-600 to-red-700',
    backgroundPattern: 'bg-[conic-gradient(at_bottom_left,_var(--tw-gradient-stops))]',
    icon: Heart,
    features: ['Romantic design', 'Gift wrapping option', 'Special occasions'],
    popular: true,
    animation: 'hover:scale-105 hover:-rotate-1',
    glow: 'hover:shadow-pink-500/50'
  },
  
  // Anime Cards
  {
    id: 'anime-sakura',
    name: 'Sakura Dreams',
    category: 'anime',
    description: 'Cherry blossom themed card for anime enthusiasts',
    price: 'From $30',
    gradient: 'from-pink-300 via-purple-400 to-indigo-500',
    backgroundPattern: 'bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))]',
    icon: Cherry,
    features: ['Limited edition', 'Anime artwork', 'Collectible design'],
    popular: true,
    animation: 'hover:scale-110 hover:rotate-3',
    glow: 'hover:shadow-pink-400/60'
  },
  {
    id: 'anime-neko',
    name: 'Neko Paradise',
    category: 'anime',
    description: 'Kawaii cat-themed gift card for otaku friends',
    price: 'From $25',
    gradient: 'from-purple-400 via-pink-500 to-red-500',
    backgroundPattern: 'bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)]',
    icon: Cat,
    features: ['Cute design', 'Manga style', 'Special effects'],
    popular: true,
    animation: 'hover:scale-105 hover:rotate-2',
    glow: 'hover:shadow-purple-400/50'
  },
  {
    id: 'anime-cyber',
    name: 'Cyber Tokyo',
    category: 'anime',
    description: 'Futuristic cyberpunk anime aesthetic',
    price: 'From $50',
    gradient: 'from-cyan-500 via-blue-600 to-purple-700',
    backgroundPattern: 'bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,.05)_10px,rgba(255,255,255,.05)_20px)]',
    icon: Tv,
    features: ['Neon effects', 'Holographic style', 'Premium quality'],
    popular: false,
    animation: 'hover:scale-105 hover:-rotate-2',
    glow: 'hover:shadow-cyan-500/60'
  },
  
  // Gaming Cards
  {
    id: 'gaming-epic',
    name: 'Epic Gamer',
    category: 'gaming',
    description: 'Ultimate gift for hardcore gamers',
    price: 'From $50',
    gradient: 'from-green-500 via-emerald-600 to-teal-700',
    backgroundPattern: 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))]',
    icon: Gamepad2,
    features: ['Gaming theme', 'Achievement unlocked', 'Power-up ready'],
    popular: true,
    animation: 'hover:scale-110 hover:rotate-1',
    glow: 'hover:shadow-green-500/60'
  },
  {
    id: 'gaming-legendary',
    name: 'Legendary Loot',
    category: 'gaming',
    description: 'Rare drop for your gaming inventory',
    price: 'From $100',
    gradient: 'from-orange-500 via-amber-600 to-yellow-700',
    backgroundPattern: 'bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))]',
    icon: Trophy,
    features: ['SSR rarity', 'Legendary status', 'Max level rewards'],
    popular: false,
    animation: 'hover:scale-105 hover:-rotate-3',
    glow: 'hover:shadow-orange-500/70'
  },
  {
    id: 'gaming-pvp',
    name: 'PvP Champion',
    category: 'gaming',
    description: 'For the competitive gaming warriors',
    price: 'From $75',
    gradient: 'from-red-600 via-orange-700 to-yellow-800',
    backgroundPattern: 'bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.1)_25%,rgba(255,255,255,.1)_75%,transparent_75%,transparent)]',
    icon: Sword,
    features: ['Battle ready', 'Ranked rewards', 'Victory assured'],
    popular: true,
    animation: 'hover:scale-105 hover:rotate-2',
    glow: 'hover:shadow-red-600/60'
  },
  
  // Meme Cards
  {
    id: 'meme-doge',
    name: 'Much Wow Card',
    category: 'memes',
    description: 'Such gift, very money, wow',
    price: 'From $69',
    gradient: 'from-yellow-400 via-orange-500 to-red-600',
    backgroundPattern: 'bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))]',
    icon: Laugh,
    features: ['Very meme', 'Much funny', 'So gift'],
    popular: true,
    animation: 'hover:scale-110 hover:-rotate-3',
    glow: 'hover:shadow-yellow-400/60'
  },
  {
    id: 'meme-stonks',
    name: 'Stonks Rising',
    category: 'memes',
    description: 'When the gift card value only goes up',
    price: 'From $420',
    gradient: 'from-green-400 via-blue-500 to-purple-600',
    backgroundPattern: 'bg-[linear-gradient(to_top_right,#00000040,#00000020)]',
    icon: TrendingUp,
    features: ['To the moon', 'Diamond hands', 'Profit guaranteed'],
    popular: true,
    animation: 'hover:scale-105 hover:rotate-1',
    glow: 'hover:shadow-green-400/60'
  },
  {
    id: 'meme-pepe',
    name: 'Rare Pepe Card',
    category: 'memes',
    description: 'Ultra rare collectible meme card',
    price: 'From $33',
    gradient: 'from-green-600 via-emerald-700 to-teal-800',
    backgroundPattern: 'bg-[repeating-conic-gradient(from_0deg_at_50%_50%,rgba(255,255,255,0.1)_0deg_10deg,transparent_10deg_20deg)]',
    icon: Ghost,
    features: ['Extremely rare', 'Meme magic', 'Feels good man'],
    popular: false,
    animation: 'hover:scale-105 hover:-rotate-2',
    glow: 'hover:shadow-green-600/60'
  },
  
  // Premium Cards
  {
    id: 'premium-diamond',
    name: 'Diamond Elite',
    category: 'premium',
    description: 'The pinnacle of luxury gift cards',
    price: 'From $500',
    gradient: 'from-slate-200 via-gray-300 to-slate-400',
    backgroundPattern: 'bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))]',
    icon: Gem,
    features: ['VIP treatment', 'Concierge service', 'Exclusive access'],
    popular: false,
    animation: 'hover:scale-105 hover:rotate-1',
    glow: 'hover:shadow-slate-300/70'
  },
  {
    id: 'premium-cosmic',
    name: 'Cosmic Infinity',
    category: 'premium',
    description: 'Beyond the stars luxury experience',
    price: 'From $1000',
    gradient: 'from-indigo-900 via-purple-900 to-pink-900',
    backgroundPattern: 'bg-[conic-gradient(from_230.29deg_at_51.63%_52.16%,#2400ff_0deg,#0087ff_67.5deg,#eb00ff_198.75deg,#ff0099_251.25deg,#2400ff_360deg)]',
    icon: Rocket,
    features: ['Unlimited potential', 'Cosmic rewards', 'Stellar service'],
    popular: true,
    animation: 'hover:scale-110 hover:-rotate-2',
    glow: 'hover:shadow-purple-900/80'
  },
  
  // Trending Cards
  {
    id: 'trending-nft',
    name: 'NFT Vibes',
    category: 'trending',
    description: 'Digital art meets gift cards',
    price: 'From $100',
    gradient: 'from-violet-600 via-purple-700 to-indigo-800',
    backgroundPattern: 'bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)]',
    icon: Shield,
    features: ['Blockchain verified', 'Digital collectible', 'Web3 ready'],
    popular: true,
    animation: 'hover:scale-105 hover:rotate-3',
    glow: 'hover:shadow-violet-600/60'
  },
  {
    id: 'trending-ai',
    name: 'AI Generated',
    category: 'trending',
    description: 'Powered by artificial intelligence',
    price: 'From $75',
    gradient: 'from-cyan-600 via-teal-700 to-emerald-800',
    backgroundPattern: 'bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(255,255,255,.05)_2px,rgba(255,255,255,.05)_4px)]',
    icon: CloudLightning,
    features: ['AI enhanced', 'Machine learning', 'Future tech'],
    popular: false,
    animation: 'hover:scale-105 hover:-rotate-1',
    glow: 'hover:shadow-cyan-600/60'
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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

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

  const filteredCards = giftCardDesigns.filter(card => 
    selectedCategory === 'all' || card.category === selectedCategory
  );

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
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated background - Optimized for performance */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-blue-900/40 to-pink-900/40" />
        <div className="absolute top-0 -left-[10%] w-[40%] max-w-[400px] aspect-square bg-purple-700 rounded-full mix-blend-multiply filter blur-[120px] animate-blob" />
        <div className="absolute top-0 -right-[10%] w-[40%] max-w-[400px] aspect-square bg-blue-700 rounded-full mix-blend-multiply filter blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute -bottom-[10%] left-[10%] w-[40%] max-w-[400px] aspect-square bg-pink-700 rounded-full mix-blend-multiply filter blur-[120px] animate-blob animation-delay-4000" />
      </div>

      <Navigation 
        user={user} 
        onLogin={handleLogin}
        onLogout={handleLogout}
        showDashboard={user?.role === 'admin'}
      />
      
      <div className="relative pt-20 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-[1440px] mx-auto">
          {/* Header - Responsive Typography */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 sm:mb-10 lg:mb-12"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 mb-3 sm:mb-4 animate-gradient leading-tight">
              Gift Card Universe
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-[90%] sm:max-w-2xl lg:max-w-3xl mx-auto leading-relaxed px-2">
              Explore our collection of premium digital gift cards featuring anime, gaming, memes, and exclusive designs
            </p>
          </motion.div>

          {/* Category Filters - Responsive Layout */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8 sm:mb-10 lg:mb-12"
          >
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 px-2 sm:px-0">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <Button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    variant={selectedCategory === category.id ? 'default' : 'outline'}
                    className={`
                      relative group transition-all duration-300 
                      px-3 sm:px-4 py-2 sm:py-2.5
                      text-xs sm:text-sm font-medium
                      ${selectedCategory === category.id 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent shadow-lg shadow-purple-500/25 scale-105' 
                        : 'bg-white/5 backdrop-blur-md border-white/20 text-white hover:bg-white/10 hover:border-white/30 hover:scale-105'
                      }
                      rounded-lg sm:rounded-xl
                    `}
                  >
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 inline-block" />
                    <span className="inline-block">{category.name}</span>
                    {selectedCategory === category.id && (
                      <motion.div
                        layoutId="categoryHighlight"
                        className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg sm:rounded-xl -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </Button>
                );
              })}
            </div>
          </motion.div>

          {/* Gift Card Grid - Fully Responsive */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={selectedCategory}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6"
            >
              {filteredCards.map((design, index) => {
                const Icon = design.icon;
                return (
                  <motion.div
                    key={design.id}
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      duration: 0.4, 
                      delay: index * 0.03,
                      type: "spring",
                      stiffness: 120,
                      damping: 20
                    }}
                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                    onHoverStart={() => setHoveredCard(design.id)}
                    onHoverEnd={() => setHoveredCard(null)}
                    className="relative group h-full"
                  >
                    <div className={`
                      relative h-full rounded-xl sm:rounded-2xl overflow-hidden backdrop-blur-xl
                      bg-gradient-to-br from-white/10 to-white/5 
                      border border-white/10 
                      ${design.animation} 
                      transition-all duration-500
                      shadow-xl hover:shadow-2xl ${design.glow}
                    `}>
                      {/* Card Background */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${design.gradient} ${design.backgroundPattern} opacity-90`} />
                      
                      {/* Animated overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Popular Badge */}
                      {design.popular && (
                        <motion.div
                          initial={{ x: 50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.03 + 0.2, type: "spring", stiffness: 200 }}
                        >
                          <Badge className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold shadow-lg z-10 text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1">
                            <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                            HOT
                          </Badge>
                        </motion.div>
                      )}

                      {/* Card Content */}
                      <div className="relative p-4 sm:p-5 lg:p-6 h-[380px] sm:h-[420px] lg:h-[450px] flex flex-col">
                        {/* Icon Section */}
                        <div className="flex-1 flex items-center justify-center mb-3 sm:mb-4">
                          <div className="relative">
                            <div className="absolute inset-0 bg-white/20 rounded-full blur-xl sm:blur-2xl scale-125 sm:scale-150 animate-pulse" />
                            <Icon className={`
                              w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-white/80 relative z-10
                              transition-all duration-300
                              ${hoveredCard === design.id ? 'animate-bounce scale-110' : ''}
                            `} />
                          </div>
                        </div>

                        {/* Title and Description */}
                        <div className="text-center mb-3 sm:mb-4 px-2">
                          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1.5 sm:mb-2 drop-shadow-lg line-clamp-1">
                            {design.name}
                          </h3>
                          <p className="text-white/80 text-xs sm:text-sm leading-relaxed line-clamp-2">
                            {design.description}
                          </p>
                        </div>

                        {/* Features - Show on hover */}
                        <AnimatePresence>
                          {hoveredCard === design.id && (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 20 }}
                              transition={{ duration: 0.2 }}
                              className="absolute inset-x-0 bottom-0 p-3 sm:p-4 lg:p-6 bg-gradient-to-t from-black/95 to-black/60 backdrop-blur-sm"
                            >
                              <div className="space-y-0.5 sm:space-y-1 mb-3 sm:mb-4">
                                {design.features.map((feature, idx) => (
                                  <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="flex items-center text-white/90 text-[10px] sm:text-xs"
                                  >
                                    <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1.5 sm:mr-2 text-green-400 flex-shrink-0" />
                                    <span className="line-clamp-1">{feature}</span>
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Price and Action */}
                        <div className="mt-auto space-y-2 sm:space-y-3">
                          <div className="text-center">
                            <span className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
                              {design.price}
                            </span>
                          </div>
                          
                          <Button
                            onClick={() => handleDesignSelect(design)}
                            className={`
                              w-full relative overflow-hidden group/btn
                              bg-gradient-to-r from-purple-600 to-pink-600 
                              hover:from-purple-700 hover:to-pink-700
                              text-white font-bold 
                              text-sm sm:text-base
                              py-2.5 sm:py-3
                              rounded-lg sm:rounded-xl
                              shadow-lg hover:shadow-xl
                              transform transition-all duration-300
                              active:scale-95
                            `}
                          >
                            <span className="relative z-10 flex items-center justify-center">
                              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                              Buy Now
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {/* Info Section - Fully Responsive */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-12 sm:mt-16 lg:mt-20 text-center px-2 sm:px-0"
          >
            <div className="relative">
              {/* Glowing background effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-blue-600/10 blur-2xl sm:blur-3xl" />
              
              <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/20 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 max-w-5xl mx-auto shadow-2xl">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-full p-3 sm:p-4 shadow-lg">
                    <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                </div>
                
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-3 sm:mb-4 mt-3 sm:mt-4 px-4">
                  Unlock Advanced Customization
                </h3>
                <p className="text-gray-300 text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto px-4 leading-relaxed">
                  Take your gift cards to the next level with our Designer Studio. Create truly unique designs with AI-powered messages, custom artwork, and exclusive templates.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 px-4 sm:px-0">
                  <div className="text-center group">
                    <div className="bg-gradient-to-br from-purple-600/20 to-purple-600/10 rounded-xl p-3 sm:p-4 mb-2 transition-all duration-300 group-hover:scale-110 group-hover:from-purple-600/30 group-hover:to-purple-600/20">
                      <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 mx-auto" />
                    </div>
                    <h4 className="text-white font-semibold text-sm sm:text-base mb-1">AI-Powered</h4>
                    <p className="text-gray-400 text-xs sm:text-sm">Smart message suggestions</p>
                  </div>
                  <div className="text-center group">
                    <div className="bg-gradient-to-br from-pink-600/20 to-pink-600/10 rounded-xl p-3 sm:p-4 mb-2 transition-all duration-300 group-hover:scale-110 group-hover:from-pink-600/30 group-hover:to-pink-600/20">
                      <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-pink-400 mx-auto" />
                    </div>
                    <h4 className="text-white font-semibold text-sm sm:text-base mb-1">Exclusive Designs</h4>
                    <p className="text-gray-400 text-xs sm:text-sm">Premium templates</p>
                  </div>
                  <div className="text-center group">
                    <div className="bg-gradient-to-br from-blue-600/20 to-blue-600/10 rounded-xl p-3 sm:p-4 mb-2 transition-all duration-300 group-hover:scale-110 group-hover:from-blue-600/30 group-hover:to-blue-600/20">
                      <Rocket className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 mx-auto" />
                    </div>
                    <h4 className="text-white font-semibold text-sm sm:text-base mb-1">Instant Delivery</h4>
                    <p className="text-gray-400 text-xs sm:text-sm">Send via email or SMS</p>
                  </div>
                </div>
                
                {isAuthenticated ? (
                  <Link 
                    href="/dashboard/user/designer" 
                    className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base lg:text-lg font-bold rounded-full text-white bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 active:scale-95"
                  >
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 mr-1.5 sm:mr-2" />
                    Open Designer Studio
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5 sm:ml-2" />
                  </Link>
                ) : (
                  <Button
                    onClick={handleLogin}
                    className="px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base lg:text-lg font-bold rounded-full text-white bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 active:scale-95"
                  >
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 mr-1.5 sm:mr-2" />
                    Login to Access Designer Studio
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5 sm:ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Purchase Dialog - Responsive */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="bg-gradient-to-b from-slate-800 to-slate-900 border-slate-700 text-white w-[95%] max-w-md mx-auto rounded-xl sm:rounded-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Complete Your Purchase
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-sm sm:text-base">
              {selectedDesign ? `You've selected: ${selectedDesign.name}` : 'Configure your gift card'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4 mt-4">
            {/* Amount Selection - Responsive Grid */}
            <div>
              <Label htmlFor="amount" className="text-white text-sm sm:text-base font-medium">Select Amount</Label>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-2">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant={form.watch('initialAmount') === amount ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => form.setValue('initialAmount', amount)}
                    className={`
                      text-sm sm:text-base py-2 sm:py-2.5 transition-all duration-200
                      ${form.watch('initialAmount') === amount 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105' 
                        : 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:scale-105'}
                    `}
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
                className="mt-2 bg-white/10 border-white/20 text-white placeholder-gray-400 focus:bg-white/20 transition-colors"
                placeholder="Or enter custom amount"
              />
              {form.formState.errors.initialAmount && (
                <p className="text-red-400 text-xs sm:text-sm mt-1">{form.formState.errors.initialAmount.message}</p>
              )}
            </div>

            {/* Recipient Details - Polished Inputs */}
            <div className="space-y-1">
              <Label htmlFor="recipientName" className="text-white text-sm sm:text-base font-medium">Recipient Name (Optional)</Label>
              <Input
                id="recipientName"
                {...form.register('recipientName')}
                className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:bg-white/20 transition-all duration-200 rounded-lg"
                placeholder="Who is this gift for?"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="recipientEmail" className="text-white text-sm sm:text-base font-medium">Send via Email (Optional)</Label>
              <Input
                id="recipientEmail"
                type="email"
                {...form.register('recipientEmail')}
                className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:bg-white/20 transition-all duration-200 rounded-lg"
                placeholder="recipient@example.com"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="senderName" className="text-white text-sm sm:text-base font-medium">Your Name</Label>
              <Input
                id="senderName"
                {...form.register('senderName')}
                className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:bg-white/20 transition-all duration-200 rounded-lg"
                placeholder="From..."
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="customMessage" className="text-white text-sm sm:text-base font-medium">Add a Message (Optional)</Label>
              <Textarea
                id="customMessage"
                {...form.register('customMessage')}
                className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:bg-white/20 transition-all duration-200 rounded-lg resize-none min-h-[60px] sm:min-h-[80px]"
                placeholder="Write a personal message..."
                rows={3}
              />
            </div>

            {/* Total Price - Enhanced Design */}
            <div className="pt-3 sm:pt-4 border-t border-white/20">
              <div className="flex justify-between items-center text-white">
                <span className="text-base sm:text-lg font-semibold">Total</span>
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    ${form.watch('initialAmount') || 0}
                  </span>
                  <p className="text-xs text-gray-400">USD</p>
                </div>
              </div>
            </div>

            {/* Action Buttons - Responsive and Polished */}
            <div className="flex gap-2 sm:gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPurchaseDialog(false)}
                className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all duration-200 rounded-lg sm:rounded-xl font-medium"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createGiftCardMutation.isPending}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform transition-all duration-200 active:scale-95 rounded-lg sm:rounded-xl font-semibold"
              >
                {createGiftCardMutation.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 sm:mr-2 h-4 w-4 animate-spin" />
                    <span className="text-sm sm:text-base">Processing...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-1.5 sm:mr-2 h-4 w-4" />
                    <span className="text-sm sm:text-base">Complete Purchase</span>
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