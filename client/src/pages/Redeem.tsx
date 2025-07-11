import { useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { useLogin } from "@/hooks/useLogin";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Scan, CreditCard, Download, RefreshCw } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import QRScanner from "@/components/QRScanner";
import { 
  PageContainer, 
  PageHeader, 
  FormContainer, 
  GradientButton,
  GlassCard,
  LoadingSpinner 
} from "@/components/DesignSystem";
import { CardContent } from "@/components/ui/card";

export default function Redeem() {
  const { user, isAuthenticated } = useAuth();
  const { handleLogin } = useLogin();
  const { toast } = useToast();
  const [giftCardCode, setGiftCardCode] = useState('');
  const [redeemAmount, setRedeemAmount] = useState('');
  const [redemptionResult, setRedemptionResult] = useState<any>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);

  const redeemGiftCardMutation = useMutation({
    mutationFn: async (data: { code: string; amount: number }) => {
      const response = await apiRequest('POST', '/api/giftcards/redeem', data);
      return response.json();
    },
    onSuccess: (data) => {
      setRedemptionResult(data);
      toast({
        title: "Redemption Successful!",
        description: `Redeemed $${data.redeemedAmount.toFixed(2)}. Remaining balance: $${data.remainingBalance.toFixed(2)}`,
      });
    },
    onError: (error) => {
      setRedemptionResult(null);
      toast({
        title: "Redemption Failed",
        description: "Unable to redeem gift card. Please check your code and amount.",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      handleLogin();
      return;
    }
    
    if (giftCardCode.trim() && redeemAmount.trim()) {
      const amount = parseFloat(redeemAmount);
      if (amount > 0) {
        redeemGiftCardMutation.mutate({
          code: giftCardCode.trim(),
          amount: amount,
        });
      }
    }
  };

  const handleQRCodeScanned = (code: string) => {
    setGiftCardCode(code);
    setShowQRScanner(false);
    toast({
      title: "QR Code Scanned!",
      description: "Gift card code has been filled in.",
    });
  };

  const handleReset = () => {
    setGiftCardCode('');
    setRedeemAmount('');
    setRedemptionResult(null);
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
            title="Redeem Gift Card"
            subtitle="Enter your gift card code and amount to redeem"
          />

          <FormContainer
            title="Gift Card Redemption"
            description={!isAuthenticated ? "Please log in to redeem your gift card" : "Enter your gift card details below"}
          >
            <Tabs defaultValue="manual" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                <TabsTrigger value="scan">QR Scanner</TabsTrigger>
              </TabsList>
              
              <TabsContent value="manual">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="giftCardCode" className="text-white">
                      Gift Card Code
                    </Label>
                    <Input
                      id="giftCardCode"
                      type="text"
                      placeholder="Enter your gift card code"
                      value={giftCardCode}
                      onChange={(e) => setGiftCardCode(e.target.value)}
                      disabled={redeemGiftCardMutation.isPending}
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="redeemAmount" className="text-white">
                      Amount to Redeem
                    </Label>
                    <Input
                      id="redeemAmount"
                      type="number"
                      placeholder="Enter amount to redeem"
                      value={redeemAmount}
                      onChange={(e) => setRedeemAmount(e.target.value)}
                      disabled={redeemGiftCardMutation.isPending}
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                      step="0.01"
                      min="0"
                    />
                  </div>

                  <div className="flex gap-2">
                    <GradientButton
                      type="submit"
                      disabled={!giftCardCode.trim() || !redeemAmount.trim() || redeemGiftCardMutation.isPending}
                      className="flex-1"
                    >
                      {redeemGiftCardMutation.isPending ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Redeeming...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Redeem Gift Card
                        </>
                      )}
                    </GradientButton>
                    
                    <GradientButton
                      type="button"
                      variant="outline"
                      onClick={handleReset}
                      disabled={redeemGiftCardMutation.isPending}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </GradientButton>
                  </div>
                </form>
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
            </Tabs>
          </FormContainer>

          {/* Redemption Result */}
          {redemptionResult && (
            <div className="mt-8">
              <GlassCard>
                <CardContent className="p-6">
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        Redemption Successful!
                      </h3>
                      <p className="text-gray-300">
                        Your gift card has been redeemed
                      </p>
                    </div>
                    
                    <div className="bg-white/5 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Redeemed Amount:</span>
                        <span className="text-green-400 font-semibold text-lg">
                          ${redemptionResult.redeemedAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Remaining Balance:</span>
                        <span className="text-white font-semibold">
                          ${redemptionResult.remainingBalance.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Transaction ID:</span>
                        <span className="text-white font-mono text-sm">
                          {redemptionResult.transactionId}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <GradientButton 
                        onClick={() => window.location.href = '/orders'}
                        className="flex-1"
                      >
                        View Orders
                      </GradientButton>
                      <GradientButton 
                        variant="outline"
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Receipt
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