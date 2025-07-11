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
import { Loader2, Search, Gift, Calendar, Mail, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const balanceSchema = z.object({
  code: z.string().min(1, "Gift card code is required"),
});

type BalanceFormData = z.infer<typeof balanceSchema>;

export default function PublicBalance() {
  const { toast } = useToast();
  const [cardDetails, setCardDetails] = useState<any>(null);

  const form = useForm<BalanceFormData>({
    resolver: zodResolver(balanceSchema),
    defaultValues: {
      code: "",
    },
  });

  // Check balance mutation
  const checkBalanceMutation = useMutation({
    mutationFn: async (data: BalanceFormData) => {
      return apiRequest("/api/giftcards/check-balance", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: (data) => {
      setCardDetails(data);
      toast({
        title: "Success!",
        description: `Gift card balance: $${data.currentBalance}`,
      });
    },
    onError: (error) => {
      setCardDetails(null);
      toast({
        title: "Error",
        description: error.message || "Failed to check balance",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BalanceFormData) => {
    checkBalanceMutation.mutate(data);
  };

  const getBalancePercentage = () => {
    if (!cardDetails) return 0;
    const current = parseFloat(cardDetails.currentBalance);
    const initial = parseFloat(cardDetails.initialAmount);
    return (current / initial) * 100;
  };

  const getDesignGradient = (design: string) => {
    const gradients: Record<string, string> = {
      classic: "from-gray-500 to-gray-700",
      love: "from-pink-500 to-red-500",
      birthday: "from-purple-500 to-pink-500",
      holiday: "from-green-500 to-red-500",
      thank_you: "from-blue-500 to-purple-500",
      congratulations: "from-yellow-500 to-orange-500",
      premium: "from-purple-600 to-pink-600",
    };
    return gradients[design] || gradients.classic;
  };

  return (
    <div className="min-h-screen from-blue-50 via-cyan-50 to-teal-50 py-12 px-4 bg-[#8249df]">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Search className="h-10 w-10 text-blue-600" />
            Check Gift Card Balance
          </h1>
          <p className="text-lg text-gray-600">Enter your gift card code to view the current balance</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-6 w-6 text-blue-600" />
              Balance Checker
            </CardTitle>
            <CardDescription>
              Keep track of your gift card balance anytime
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
                        <div className="relative">
                          <Input
                            placeholder="Enter your gift card code"
                            {...field}
                            className="uppercase pr-10"
                          />
                          <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={checkBalanceMutation.isPending}
                >
                  {checkBalanceMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Check Balance
                    </>
                  )}
                </Button>
              </form>
            </Form>

            {cardDetails && (
              <div className="mt-8 space-y-6">
                <Card className="overflow-hidden border-0 shadow-lg">
                  <div className={`h-32 bg-gradient-to-br ${getDesignGradient(cardDetails.design)} relative`}>
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="relative p-6 text-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm opacity-90">Gift Card</p>
                          <p className="text-2xl font-bold mt-1">{cardDetails.code}</p>
                        </div>
                        <Badge className="bg-white/20 text-white border-white/40">
                          {cardDetails.design?.toUpperCase() || 'CLASSIC'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      {/* Balance Display */}
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-600 mb-2">Current Balance</p>
                        <p className="text-5xl font-bold text-gray-900">${cardDetails.currentBalance}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          of ${cardDetails.initialAmount} original value
                        </p>
                      </div>

                      {/* Balance Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Balance Status</span>
                          <span className="text-gray-900 font-medium">
                            {getBalancePercentage().toFixed(0)}% Remaining
                          </span>
                        </div>
                        <Progress value={getBalancePercentage()} className="h-3" />
                      </div>

                      {/* Card Details */}
                      <div className="grid grid-cols-2 gap-4 pt-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Created
                          </p>
                          <p className="text-sm font-medium">
                            {new Date(cardDetails.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Gift className="h-4 w-4" />
                            Status
                          </p>
                          <Badge variant={cardDetails.isActive ? "default" : "secondary"}>
                            {cardDetails.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>

                      {/* Personal Details */}
                      {(cardDetails.recipientName || cardDetails.senderName) && (
                        <div className="border-t pt-4 space-y-3">
                          {cardDetails.recipientName && (
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-600">To:</span>
                              <span className="font-medium">{cardDetails.recipientName}</span>
                            </div>
                          )}
                          {cardDetails.senderName && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-600">From:</span>
                              <span className="font-medium">{cardDetails.senderName}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Custom Message */}
                      {cardDetails.customMessage && (
                        <Card className="bg-gray-50 border-gray-200">
                          <CardContent className="pt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Personal Message</p>
                            <p className="text-sm text-gray-600 italic">"{cardDetails.customMessage}"</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.location.href = `/redeem?code=${cardDetails.code}`}
                  >
                    Redeem Now
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.location.href = `/recharge?code=${cardDetails.code}`}
                  >
                    Add Funds
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600 text-center">
                Keep your gift card code safe. Anyone with the code can use the balance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}