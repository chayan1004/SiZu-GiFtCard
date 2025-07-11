import { useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { useLogin } from "@/hooks/useLogin";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, CreditCard, Scan, History, CheckCircle } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import QRScanner from "@/components/QRScanner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  PageContainer, 
  PageHeader, 
  FormContainer, 
  GradientButton,
  GlassCard,
  LoadingSpinner 
} from "@/components/DesignSystem";
import { CardContent } from "@/components/ui/card";

const rechargeSchema = z.object({
  code: z.string().min(12, "Please enter a valid gift card code"),
  amount: z.string().min(1, "Please enter an amount"),
});

type RechargeFormData = z.infer<typeof rechargeSchema>;

const PRESET_AMOUNTS = [10, 25, 50, 100, 250];

export default function Recharge() {
  const { user, isAuthenticated } = useAuth();
  const { handleLogin } = useLogin();
  const { toast } = useToast();
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [rechargeResult, setRechargeResult] = useState<any>(null);
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);

  const form = useForm<RechargeFormData>({
    resolver: zodResolver(rechargeSchema),
    defaultValues: {
      code: "",
      amount: "",
    },
  });

  // Fetch user's gift cards
  const { data: userGiftCards } = useQuery({
    queryKey: ['/api/giftcards/mine'],
    enabled: isAuthenticated,
    retry: false,
  });

  const rechargeGiftCardMutation = useMutation({
    mutationFn: async (data: { code: string; amount: number }) => {
      const response = await apiRequest('POST', '/api/giftcards/recharge', data);
      return response.json();
    },
    onSuccess: (data) => {
      setRechargeResult(data);
      setCurrentBalance(data.newBalance);
      toast({
        title: "Recharge Successful!",
        description: `Added $${data.rechargeAmount.toFixed(2)}. New balance: $${data.newBalance.toFixed(2)}`,
      });
    },
    onError: (error) => {
      setRechargeResult(null);
      toast({
        title: "Recharge Failed",
        description: "Unable to recharge gift card. Please try again.",
        variant: "destructive",
      });
    },
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

  const onSubmit = (data: RechargeFormData) => {
    if (!isAuthenticated) {
      handleLogin();
      return;
    }
    
    const amount = parseFloat(data.amount);
    if (amount > 0) {
      rechargeGiftCardMutation.mutate({
        code: data.code,
        amount: amount,
      });
    }
  };

  const handleQRCodeScanned = (code: string) => {
    form.setValue('code', code);
    setShowQRScanner(false);
    toast({
      title: "QR Code Scanned!",
      description: "Gift card code has been filled in.",
    });
  };

  const handlePresetAmount = (amount: number) => {
    form.setValue('amount', amount.toString());
  };

  const handleSavedCardSelect = (card: any) => {
    form.setValue('code', card.code);
    setCurrentBalance(card.currentBalance);
  };

  return (
    <PageContainer>
      <Navigation 
        user={user} 
        onLogin={handleLogin}
        onLogout={handleLogout}
        showDashboard={user?.role === 'admin'}
      />
      
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <PageHeader
            title="Recharge Gift Card"
            subtitle="Add funds to your existing gift card"
          />

          <FormContainer
            title="Gift Card Recharge"
            description={!isAuthenticated ? "Please log in to recharge your gift card" : "Choose how to enter your gift card details"}
          >
            <Tabs defaultValue="manual" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                <TabsTrigger value="scan">QR Scanner</TabsTrigger>
                <TabsTrigger value="saved">Saved Cards</TabsTrigger>
              </TabsList>
              
              <TabsContent value="manual">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Gift Card Code</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your gift card code"
                              {...field}
                              disabled={rechargeGiftCardMutation.isPending}
                              className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Recharge Amount</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter amount to add"
                              {...field}
                              disabled={rechargeGiftCardMutation.isPending}
                              className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                              step="0.01"
                              min="0"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Current Balance Display */}
                    {currentBalance !== null && (
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Current Balance:</span>
                          <span className="text-green-400 font-semibold">
                            ${currentBalance.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Preset Amounts */}
                    <div className="space-y-2">
                      <Label className="text-white">Quick Amounts</Label>
                      <div className="grid grid-cols-5 gap-2">
                        {PRESET_AMOUNTS.map((amount) => (
                          <button
                            key={amount}
                            type="button"
                            onClick={() => handlePresetAmount(amount)}
                            className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg p-2 text-white text-sm transition-colors"
                          >
                            ${amount}
                          </button>
                        ))}
                      </div>
                    </div>

                    <GradientButton
                      type="submit"
                      disabled={rechargeGiftCardMutation.isPending}
                      className="w-full"
                    >
                      {rechargeGiftCardMutation.isPending ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Recharging...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Recharge Gift Card
                        </>
                      )}
                    </GradientButton>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="scan">
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-gray-300 mb-4">
                      Use your camera to scan the QR code on your gift card
                    </p>
                    <GradientButton
                      type="button"
                      onClick={() => setShowQRScanner(true)}
                      className="w-full"
                    >
                      <Scan className="w-4 h-4 mr-2" />
                      Start QR Scanner
                    </GradientButton>
                  </div>

                  {showQRScanner && (
                    <div className="mt-4">
                      <QRScanner
                        onCodeScanned={handleQRCodeScanned}
                        onClose={() => setShowQRScanner(false)}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="saved">
                <div className="space-y-4">
                  {userGiftCards && userGiftCards.length > 0 ? (
                    <div className="grid gap-3">
                      {userGiftCards.map((card: any) => (
                        <div
                          key={card.id}
                          className="bg-white/5 rounded-lg p-4 cursor-pointer hover:bg-white/10 transition-colors"
                          onClick={() => handleSavedCardSelect(card)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-white font-medium">{card.design}</div>
                              <div className="text-xs text-gray-400 font-mono">{card.code}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-green-400 font-semibold">
                                ${card.currentBalance.toFixed(2)}
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {card.design}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">No Saved Cards</h3>
                      <p className="text-gray-300 mb-4">You don't have any saved gift cards yet</p>
                      <GradientButton 
                        onClick={() => window.location.href = '/shop'}
                        className="w-full"
                      >
                        Buy a Gift Card
                      </GradientButton>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </FormContainer>

          {/* Recharge Result */}
          {rechargeResult && (
            <div className="mt-8">
              <GlassCard>
                <CardContent className="p-6">
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        Recharge Successful!
                      </h3>
                      <p className="text-gray-300">
                        Your gift card has been recharged
                      </p>
                    </div>
                    
                    <div className="bg-white/5 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Recharge Amount:</span>
                        <span className="text-green-400 font-semibold text-lg">
                          +${rechargeResult.rechargeAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">New Balance:</span>
                        <span className="text-white font-semibold text-lg">
                          ${rechargeResult.newBalance.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Transaction ID:</span>
                        <span className="text-white font-mono text-sm">
                          {rechargeResult.transactionId}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <GradientButton 
                        onClick={() => window.location.href = '/balance'}
                        className="flex-1"
                      >
                        Check Balance
                      </GradientButton>
                      <GradientButton 
                        onClick={() => window.location.href = '/orders'}
                        variant="outline"
                        className="flex-1"
                      >
                        View Orders
                      </GradientButton>
                    </div>
                  </div>
                </CardContent>
              </GlassCard>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}