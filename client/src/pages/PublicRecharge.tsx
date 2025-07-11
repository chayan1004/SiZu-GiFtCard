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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CreditCard, Gift, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

const rechargeSchema = z.object({
  code: z.string().min(1, "Gift card code is required"),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Please enter a valid amount"),
  paymentMethod: z.string().min(1, "Please select a payment method"),
});

type RechargeFormData = z.infer<typeof rechargeSchema>;

const PRESET_AMOUNTS = [25, 50, 100, 250];

export default function PublicRecharge() {
  const { toast } = useToast();
  const [verifiedCard, setVerifiedCard] = useState<any>(null);

  const form = useForm<RechargeFormData>({
    resolver: zodResolver(rechargeSchema),
    defaultValues: {
      code: "",
      amount: "",
      paymentMethod: "",
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
        description: `Current balance: $${data.currentBalance}`,
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

  // Recharge gift card
  const rechargeMutation = useMutation({
    mutationFn: async (data: RechargeFormData) => {
      return apiRequest("/api/giftcards/recharge", {
        method: "POST",
        body: {
          ...data,
          amount: parseFloat(data.amount),
        },
      });
    },
    onSuccess: (response) => {
      toast({
        title: "Success!",
        description: response.message || "Gift card recharged successfully!",
      });
      form.reset();
      setVerifiedCard(null);
    },
    onError: (error: any) => {
      if (error.message?.includes("payment processing")) {
        toast({
          title: "Payment Setup Required",
          description: "This feature requires payment processing to be configured. Please contact support.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to recharge gift card",
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (data: RechargeFormData) => {
    // Prompt user to login to complete recharge
    toast({
      title: "Login Required",
      description: "Please login or create an account to recharge your gift card.",
    });
    setTimeout(() => {
      window.location.href = "/login";
    }, 1500);
  };

  const handleCodeBlur = () => {
    const code = form.getValues("code");
    if (code && code.length > 0) {
      checkBalanceMutation.mutate(code);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Plus className="h-10 w-10 text-green-600" />
            Recharge Gift Card
          </h1>
          <p className="text-lg text-gray-600">Add more funds to your existing gift card</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-green-600" />
              Recharge Your Card
            </CardTitle>
            <CardDescription>
              Enter your gift card code and the amount you want to add
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rechargeMutation.data?.requiresPaymentSetup && (
              <Alert className="mb-6 bg-yellow-50 border-yellow-200">
                <AlertDescription className="text-yellow-800">
                  Payment processing is currently being set up. This feature will be available soon.
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
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-16 w-16 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center`}>
                            <Gift className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold">{verifiedCard.design?.toUpperCase() || 'CLASSIC'} DESIGN</p>
                            <p className="text-sm text-gray-600">Code: {verifiedCard.code}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Current Balance</p>
                          <p className="text-2xl font-bold text-green-600">${verifiedCard.currentBalance}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recharge Amount</FormLabel>
                      <div className="space-y-3">
                        <div className="grid grid-cols-4 gap-2">
                          {PRESET_AMOUNTS.map((preset) => (
                            <Button
                              key={preset}
                              type="button"
                              variant={field.value === preset.toString() ? "default" : "outline"}
                              onClick={() => field.onChange(preset.toString())}
                              className="w-full"
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
                      {verifiedCard && field.value && (
                        <p className="text-sm text-gray-600 mt-2">
                          New balance will be: <span className="font-semibold">${(parseFloat(verifiedCard.currentBalance) + parseFloat(field.value || "0")).toFixed(2)}</span>
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="credit_card">Credit Card</SelectItem>
                          <SelectItem value="debit_card">Debit Card</SelectItem>
                          <SelectItem value="paypal">PayPal</SelectItem>
                          <SelectItem value="apple_pay">Apple Pay</SelectItem>
                          <SelectItem value="google_pay">Google Pay</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={rechargeMutation.isPending || !verifiedCard}
                >
                  {rechargeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Recharge Gift Card
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600 text-center">
                Need help? Contact our support team at support@giftcards.com
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}