import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Gift, ArrowDownCircle, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

const redeemSchema = z.object({
  code: z.string().min(1, "Gift card code is required"),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Please enter a valid amount"),
});

type RedeemFormData = z.infer<typeof redeemSchema>;

export default function PublicRedeem() {
  const { toast } = useToast();
  const [verifiedCard, setVerifiedCard] = useState<any>(null);
  const [redemptionComplete, setRedemptionComplete] = useState(false);

  const form = useForm<RedeemFormData>({
    resolver: zodResolver(redeemSchema),
    defaultValues: {
      code: "",
      amount: "",
    },
  });

  // Check balance to verify card
  const checkBalanceMutation = useMutation({
    mutationFn: async (code: string) => {
      return apiRequest("/api/giftcards/check-balance", {
        method: "POST",
        body: { code },
      });
    },
    onSuccess: (data) => {
      setVerifiedCard(data);
      toast({
        title: "Card Verified",
        description: `Available balance: $${data.currentBalance}`,
      });
    },
    onError: (error) => {
      setVerifiedCard(null);
      toast({
        title: "Error",
        description: error.message || "Gift card not found",
        variant: "destructive",
      });
    },
  });

  // Redeem gift card
  const redeemMutation = useMutation({
    mutationFn: async (data: RedeemFormData) => {
      return apiRequest("/api/giftcards/redeem", {
        method: "POST",
        body: {
          ...data,
          amount: parseFloat(data.amount),
        },
      });
    },
    onSuccess: (response) => {
      setRedemptionComplete(true);
      toast({
        title: "Success!",
        description: `Successfully redeemed $${response.redeemedAmount}. Remaining balance: $${response.remainingBalance}`,
      });
      // Update verified card balance
      setVerifiedCard({
        ...verifiedCard,
        currentBalance: response.remainingBalance,
      });
      form.setValue("amount", "");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to redeem gift card",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RedeemFormData) => {
    // Prompt user to login to complete redemption
    toast({
      title: "Login Required",
      description: "Please login or create an account to redeem your gift card.",
    });
    setTimeout(() => {
      window.location.href = "/login";
    }, 1500);
  };

  const handleCodeBlur = () => {
    const code = form.getValues("code");
    if (code && code.length > 0) {
      checkBalanceMutation.mutate(code);
      setRedemptionComplete(false);
    }
  };

  const getBalancePercentage = () => {
    if (!verifiedCard) return 0;
    const current = parseFloat(verifiedCard.currentBalance);
    const initial = parseFloat(verifiedCard.initialAmount);
    return (current / initial) * 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <ArrowDownCircle className="h-10 w-10 text-purple-600" />
            Redeem Gift Card
          </h1>
          <p className="text-lg text-gray-600">Use your gift card balance for purchases</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-6 w-6 text-purple-600" />
              Redeem Your Card
            </CardTitle>
            <CardDescription>
              Enter your gift card code and the amount you want to redeem
            </CardDescription>
          </CardHeader>
          <CardContent>
            {redemptionComplete && (
              <Alert className="mb-6 bg-green-50 border-green-200">
                <Check className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Redemption successful! You can continue using your remaining balance.
                </AlertDescription>
              </Alert>
            )}

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
                          placeholder="Enter your gift card code"
                          {...field}
                          onBlur={() => {
                            field.onBlur();
                            handleCodeBlur();
                          }}
                          className="uppercase"
                        />
                      </FormControl>
                      <FormMessage />
                      {checkBalanceMutation.isPending && (
                        <p className="text-sm text-gray-500 flex items-center gap-2 mt-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Verifying card...
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                {verifiedCard && (
                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`h-16 w-16 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center`}>
                              <Gift className="h-8 w-8 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold">{verifiedCard.design?.toUpperCase() || 'CLASSIC'} DESIGN</p>
                              <p className="text-sm text-gray-600">Code: {verifiedCard.code}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Available Balance</p>
                            <p className="text-2xl font-bold text-purple-600">${verifiedCard.currentBalance}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Balance Usage</span>
                            <span className="text-gray-600">
                              ${verifiedCard.currentBalance} / ${verifiedCard.initialAmount}
                            </span>
                          </div>
                          <Progress value={getBalancePercentage()} className="h-2" />
                        </div>

                        {verifiedCard.customMessage && (
                          <div className="bg-white/50 rounded-lg p-3">
                            <p className="text-sm font-medium text-gray-700 mb-1">Personal Message:</p>
                            <p className="text-sm text-gray-600 italic">"{verifiedCard.customMessage}"</p>
                            {verifiedCard.senderName && (
                              <p className="text-sm text-gray-500 mt-1">- {verifiedCard.senderName}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Redemption Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max={verifiedCard ? parseFloat(verifiedCard.currentBalance) : undefined}
                          placeholder="Enter amount to redeem"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                      {verifiedCard && field.value && (
                        <p className="text-sm text-gray-600 mt-2">
                          Remaining balance after redemption: <span className="font-semibold">
                            ${Math.max(0, parseFloat(verifiedCard.currentBalance) - parseFloat(field.value || "0")).toFixed(2)}
                          </span>
                        </p>
                      )}
                      {verifiedCard && (
                        <div className="flex gap-2 mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => field.onChange(verifiedCard.currentBalance)}
                          >
                            Use Full Balance
                          </Button>
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={redeemMutation.isPending || !verifiedCard || parseFloat(form.watch("amount") || "0") <= 0}
                >
                  {redeemMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ArrowDownCircle className="mr-2 h-4 w-4" />
                      Redeem Gift Card
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600 text-center">
                Your redemption will be processed instantly. Receipt available after completion.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}