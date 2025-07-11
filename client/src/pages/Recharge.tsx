import { useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-blue-50">
      <Navigation onLogin={handleLogin} onLogout={handleLogout} />
      
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center p-3 bg-green-100 rounded-full mb-4">
              <Plus className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Recharge Gift Card</h1>
            <p className="text-lg text-gray-600">Add funds to your existing gift card</p>
          </motion.div>

          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="scan">Scan QR</TabsTrigger>
              <TabsTrigger value="saved">My Cards</TabsTrigger>
            </TabsList>

            <TabsContent value="manual">
              <Card>
                <CardHeader>
                  <CardTitle>Enter Gift Card Details</CardTitle>
                  <CardDescription>
                    Enter your gift card code and the amount you want to add
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gift Card Code</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="XXXX-XXXX-XXXX"
                                {...field}
                                onChange={(e) => handleCodeChange(e.target.value)}
                              />
                            </FormControl>
                            {currentBalance !== null && (
                              <p className="text-sm text-muted-foreground mt-2">
                                Current balance: ${currentBalance.toFixed(2)}
                              </p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recharge Amount</FormLabel>
                            <div className="space-y-4">
                              <div className="grid grid-cols-5 gap-2">
                                {PRESET_AMOUNTS.map((preset) => (
                                  <Button
                                    key={preset}
                                    type="button"
                                    variant={field.value === preset.toString() ? "default" : "outline"}
                                    onClick={() => field.onChange(preset.toString())}
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
                                />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={rechargeMutation.isPending}
                      >
                        {rechargeMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
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
                <CardHeader>
                  <CardTitle>Scan QR Code</CardTitle>
                  <CardDescription>
                    Use your camera to scan the gift card QR code
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {showQRScanner ? (
                    <div className="space-y-4">
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
                        className="w-full"
                      >
                        Cancel Scan
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setShowQRScanner(true)}
                      className="w-full"
                      variant="outline"
                    >
                      <Scan className="mr-2 h-4 w-4" />
                      Start Scanner
                    </Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="saved">
              <Card>
                <CardHeader>
                  <CardTitle>Your Gift Cards</CardTitle>
                  <CardDescription>
                    Select a gift card from your collection to recharge
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userGiftCards && userGiftCards.length > 0 ? (
                    <div className="space-y-3">
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
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold">{card.code}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Balance: ${card.balance.toFixed(2)}
                                  </p>
                                </div>
                                <Badge variant={card.design === 'premium' ? 'default' : 'secondary'}>
                                  {card.design}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
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
              className="mt-6"
            >
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                    <h3 className="text-xl font-semibold text-green-900">
                      Recharge Successful!
                    </h3>
                  </div>
                  <div className="space-y-2 text-green-800">
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