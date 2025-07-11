import { useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { useLogin } from "@/hooks/useLogin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, CreditCard, Scan, History, CheckCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import QRScanner from "@/components/QRScanner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

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
  });

  // Check balance when code changes
  const checkBalanceMutation = useMutation({
    mutationFn: async (code: string) => {
      return apiRequest("/api/giftcards/check-balance", {
        method: "POST",
        body: { code },
      });
    },
    onSuccess: (data) => {
      setCurrentBalance(data.balance);
      toast({
        title: "Card Verified",
        description: `Current balance: $${data.balance.toFixed(2)}`,
      });
    },
    onError: () => {
      setCurrentBalance(null);
      toast({
        title: "Invalid Code",
        description: "Could not find gift card with this code",
        variant: "destructive",
      });
    },
  });

  // Recharge gift card
  const rechargeMutation = useMutation({
    mutationFn: async (data: RechargeFormData) => {
      return apiRequest("/api/giftcards/recharge", {
        method: "POST",
        body: {
          code: data.code,
          amount: parseFloat(data.amount),
        },
      });
    },
    onSuccess: (data) => {
      setRechargeResult(data);
      toast({
        title: "Recharge Successful!",
        description: `Added $${data.rechargedAmount.toFixed(2)}. New balance: $${data.newBalance.toFixed(2)}`,
      });
      form.reset();
      setCurrentBalance(null);
    },
    onError: (error) => {
      toast({
        title: "Recharge Failed",
        description: error.message || "Unable to recharge gift card",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RechargeFormData) => {
    rechargeMutation.mutate(data);
  };

  const handleCodeChange = (value: string) => {
    form.setValue('code', value);
    if (value.length >= 12) {
      checkBalanceMutation.mutate(value);
    }
  };

  const handleQuickSelect = (card: any) => {
    handleCodeChange(card.code);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-blue-50">
      <Navigation onLogin={handleLogin} onLogout={handleLogout} />
      
      <div className="pt-20 sm:pt-24 pb-12 sm:pb-16 px-3 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-6 sm:mb-8"
          >
            <div className="inline-flex items-center justify-center p-2.5 sm:p-3 bg-green-100 rounded-full mb-3 sm:mb-4">
              <Plus className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1.5 sm:mb-2">Recharge Gift Card</h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600">Add funds to your existing gift card</p>
          </motion.div>

          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="manual" className="text-xs sm:text-sm py-2 sm:py-3">Manual Entry</TabsTrigger>
              <TabsTrigger value="scan" className="text-xs sm:text-sm py-2 sm:py-3">Scan QR</TabsTrigger>
              <TabsTrigger value="saved" className="text-xs sm:text-sm py-2 sm:py-3">My Cards</TabsTrigger>
            </TabsList>

            <TabsContent value="manual">
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">Enter Gift Card Details</CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    Enter your gift card code and the amount you want to add
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm sm:text-base">Gift Card Code</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="XXXX-XXXX-XXXX"
                                {...field}
                                onChange={(e) => handleCodeChange(e.target.value)}
                                className="h-9 sm:h-11 text-sm sm:text-base"
                              />
                            </FormControl>
                            {currentBalance !== null && (
                              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2">
                                Current balance: ${currentBalance.toFixed(2)}
                              </p>
                            )}
                            <FormMessage className="text-xs sm:text-sm" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm sm:text-base">Recharge Amount</FormLabel>
                            <div className="space-y-3 sm:space-y-4">
                              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2">
                                {PRESET_AMOUNTS.map((preset) => (
                                  <Button
                                    key={preset}
                                    type="button"
                                    variant={field.value === preset.toString() ? "default" : "outline"}
                                    onClick={() => field.onChange(preset.toString())}
                                    className="h-8 sm:h-10 text-xs sm:text-sm px-2 sm:px-4"
                                  >
                                    ${preset}
                                  </Button>
                                ))}
                              </div>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="1"
                                  placeholder="Or enter custom amount"
                                  {...field}
                                  className="h-9 sm:h-11 text-sm sm:text-base"
                                />
                              </FormControl>
                            </div>
                            <FormMessage className="text-xs sm:text-sm" />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full h-9 sm:h-11 text-sm sm:text-base"
                        disabled={rechargeMutation.isPending}
                      >
                        {rechargeMutation.isPending ? (
                          <>
                            <Loader2 className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Plus className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                            Recharge Card
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="scan">
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">Scan QR Code</CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    Use your camera to scan the gift card QR code
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  {showQRScanner ? (
                    <div className="space-y-3 sm:space-y-4">
                      <QRScanner 
                        onResult={(result) => {
                          handleCodeChange(result);
                          setShowQRScanner(false);
                          toast({
                            title: "QR Code Scanned",
                            description: "Gift card code detected successfully",
                          });
                        }}
                        onError={(error) => {
                          toast({
                            title: "Scan Error",
                            description: "Could not read QR code. Please try again.",
                            variant: "destructive",
                          });
                        }}
                      />
                      <Button
                        variant="outline"
                        onClick={() => setShowQRScanner(false)}
                        className="w-full h-9 sm:h-11 text-sm sm:text-base"
                      >
                        Cancel Scan
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setShowQRScanner(true)}
                      className="w-full h-9 sm:h-11 text-sm sm:text-base"
                      variant="outline"
                    >
                      <Scan className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      Start Scanner
                    </Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="saved">
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">Your Gift Cards</CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    Select a gift card from your collection to recharge
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  {userGiftCards && userGiftCards.length > 0 ? (
                    <div className="space-y-2.5 sm:space-y-3">
                      {userGiftCards.map((card: any) => (
                        <motion.div
                          key={card.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Card 
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => handleQuickSelect(card)}
                          >
                            <CardContent className="p-3 sm:p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold text-sm sm:text-base">{card.code}</p>
                                  <p className="text-xs sm:text-sm text-muted-foreground">
                                    Balance: ${card.balance.toFixed(2)}
                                  </p>
                                </div>
                                <Badge variant={card.design === 'premium' ? 'default' : 'secondary'} className="text-xs sm:text-sm">
                                  {card.design}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-6 sm:py-8 text-sm sm:text-base">
                      No gift cards found in your account
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {rechargeResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 sm:mt-6"
            >
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center mb-3 sm:mb-4">
                    <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mr-2 sm:mr-3" />
                    <h3 className="text-base sm:text-xl font-semibold text-green-900">
                      Recharge Successful!
                    </h3>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2 text-green-800 text-sm sm:text-base">
                    <p>Card: {rechargeResult.code}</p>
                    <p>Amount Added: ${rechargeResult.rechargedAmount.toFixed(2)}</p>
                    <p className="font-semibold">New Balance: ${rechargeResult.newBalance.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}