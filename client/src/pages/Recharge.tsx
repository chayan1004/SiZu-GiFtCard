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
    retry: false,
    enabled: isAuthenticated,
  });

  const rechargeGiftCardMutation = useMutation({
    mutationFn: async (data: { code: string; amount: number }) => {
      const response = await apiRequest('POST', '/api/giftcards/recharge', data);
      return response.json();
    },
    onSuccess: (data) => {
      setRechargeResult(data);
      form.reset();
      toast({
        title: "Recharge Successful!",
        description: `Added $${data.rechargedAmount.toFixed(2)} to your gift card. New balance: $${data.newBalance.toFixed(2)}`,
      });
    },
    onError: (error) => {
      setRechargeResult(null);
      toast({
        title: "Recharge Failed",
        description: "Unable to recharge gift card. Please check your code and try again.",
        variant: "destructive",
      });
    },
  });

  const checkBalanceMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest('POST', '/api/giftcards/balance', { code });
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentBalance(data.balance);
    },
    onError: (error) => {
      setCurrentBalance(null);
      toast({
        title: "Error",
        description: "Unable to check balance. Please verify your gift card code.",
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

  const handleQRScan = (result: string) => {
    setShowQRScanner(false);
    
    // Try to extract gift card code from QR result
    try {
      if (result.startsWith('http://') || result.startsWith('https://')) {
        const url = new URL(result);
        const code = url.searchParams.get('code');
        if (code) {
          form.setValue('code', code);
          checkBalanceMutation.mutate(code);
          toast({
            title: "QR Code Scanned",
            description: "Gift card code has been filled in automatically.",
          });
          return;
        }
      }
    } catch (error) {
      // If not a URL, assume it's a direct code
      if (result.startsWith('GC')) {
        form.setValue('code', result);
        checkBalanceMutation.mutate(result);
        toast({
          title: "QR Code Scanned",
          description: "Gift card code has been filled in automatically.",
        });
      } else {
        toast({
          title: "Invalid QR Code",
          description: "The scanned QR code doesn't contain a valid gift card code.",
          variant: "destructive",
        });
      }
    }
  };

  const onSubmit = (data: RechargeFormData) => {
    if (!isAuthenticated) {
      handleLogin();
      return;
    }

    rechargeGiftCardMutation.mutate({
      code: data.code,
      amount: parseFloat(data.amount)
    });
  };

  const handlePresetAmount = (amount: number) => {
    form.setValue('amount', amount.toString());
  };

  const handleCheckBalance = () => {
    const code = form.getValues('code');
    if (code) {
      checkBalanceMutation.mutate(code);
    }
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
            subtitle="Add more funds to your existing gift card"
          />

          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto mb-8 bg-white/10 border-white/20">
              <TabsTrigger value="manual" className="text-white data-[state=active]:bg-primary data-[state=active]:text-white">
                <Plus className="w-4 h-4 mr-2" />
                Manual
              </TabsTrigger>
              <TabsTrigger value="qr" className="text-white data-[state=active]:bg-primary data-[state=active]:text-white">
                <Scan className="w-4 h-4 mr-2" />
                QR Scanner
              </TabsTrigger>
              <TabsTrigger value="saved" className="text-white data-[state=active]:bg-primary data-[state=active]:text-white">
                <History className="w-4 h-4 mr-2" />
                Saved Cards
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual">
              <FormContainer
                title="Manual Entry"
                description="Enter your gift card code and recharge amount"
              >
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Gift Card Code</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input
                                {...field}
                                placeholder="Enter your gift card code"
                                className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                                disabled={rechargeGiftCardMutation.isPending}
                              />
                              <GradientButton
                                type="button"
                                variant="outline"
                                onClick={handleCheckBalance}
                                disabled={!field.value || checkBalanceMutation.isPending}
                              >
                                {checkBalanceMutation.isPending ? (
                                  <LoadingSpinner size="sm" />
                                ) : (
                                  "Check"
                                )}
                              </GradientButton>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {currentBalance !== null && (
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Current Balance:</span>
                          <span className="text-white font-semibold">${currentBalance.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Recharge Amount</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="1"
                              step="0.01"
                              placeholder="Enter amount to add"
                              className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                              disabled={rechargeGiftCardMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Preset Amounts */}
                    <div className="space-y-2">
                      <Label className="text-white">Quick Amounts</Label>
                      <div className="grid grid-cols-5 gap-2">
                        {PRESET_AMOUNTS.map((amount) => (
                          <GradientButton
                            key={amount}
                            type="button"
                            variant="outline"
                            onClick={() => handlePresetAmount(amount)}
                            className="text-xs"
                          >
                            ${amount}
                          </GradientButton>
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
                          Processing...
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
              </FormContainer>
            </TabsContent>

            <TabsContent value="qr">
              <FormContainer
                title="QR Scanner"
                description="Scan your gift card QR code for quick recharge"
              >
                <div className="space-y-4">
                  <div className="text-center">
                    <GradientButton 
                      onClick={() => setShowQRScanner(true)}
                      className="w-full"
                    >
                      <Scan className="w-4 h-4 mr-2" />
                      Open QR Scanner
                    </GradientButton>
                  </div>
                  
                  {showQRScanner && (
                    <div className="mt-4">
                      <QRScanner 
                        onScan={handleQRScan}
                        onClose={() => setShowQRScanner(false)}
                      />
                    </div>
                  )}
                </div>
              </FormContainer>
            </TabsContent>

            <TabsContent value="saved">
              <FormContainer
                title="Saved Cards"
                description="Select from your previously used gift cards"
              >
                <div className="space-y-4">
                  {userGiftCards && userGiftCards.length > 0 ? (
                    <div className="grid gap-3">
                      {userGiftCards.map((card: any) => (
                        <div
                          key={card.id}
                          className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-colors cursor-pointer"
                          onClick={() => {
                            form.setValue('code', card.code);
                            checkBalanceMutation.mutate(card.code);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-mono text-sm text-white">{card.code}</div>
                              <div className="text-xs text-gray-300">{card.design} • ${card.balance.toFixed(2)}</div>
                            </div>
                            <Badge variant="secondary" className="bg-white/10 text-white">
                              ${card.balance.toFixed(2)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-300">No saved gift cards found</p>
                      <p className="text-sm text-gray-400 mt-2">
                        {isAuthenticated ? "Purchase a gift card to get started" : "Sign in to view your saved cards"}
                      </p>
                    </div>
                  )}
                </div>
              </FormContainer>
            </TabsContent>
          </Tabs>

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
                        Your gift card has been recharged successfully
                      </p>
                    </div>
                    
                    <div className="bg-white/5 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Gift Card Code:</span>
                        <span className="text-white font-mono">{rechargeResult.code}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Amount Added:</span>
                        <span className="text-green-400 font-semibold">+${rechargeResult.rechargedAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">New Balance:</span>
                        <span className="text-white font-semibold">${rechargeResult.newBalance.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <GradientButton 
                      onClick={() => {
                        setRechargeResult(null);
                        form.reset();
                        setCurrentBalance(null);
                      }}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Recharge Another Card
                    </GradientButton>
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