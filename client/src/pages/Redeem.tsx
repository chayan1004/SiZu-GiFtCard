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
    
    if (!giftCardCode.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a gift card code.",
        variant: "destructive",
      });
      return;
    }

    if (!redeemAmount.trim() || parseFloat(redeemAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to redeem.",
        variant: "destructive",
      });
      return;
    }

    redeemGiftCardMutation.mutate({
      code: giftCardCode.trim(),
      amount: parseFloat(redeemAmount)
    });
  };

  const handleReset = () => {
    setGiftCardCode('');
    setRedeemAmount('');
    setRedemptionResult(null);
  };

  const handleQRScan = (result: string) => {
    setShowQRScanner(false);
    
    // Try to extract gift card code from QR result
    try {
      // First check if it's a URL
      if (result.startsWith('http://') || result.startsWith('https://')) {
        const url = new URL(result);
        
        // Check if it's a receipt page URL
        if (url.pathname.startsWith('/receipt-view/')) {
          // Extract token and redirect to receipt page
          const token = url.pathname.split('/receipt-view/')[1];
          if (token) {
            toast({
              title: "Receipt QR Code Detected",
              description: "Redirecting to receipt page...",
            });
            setTimeout(() => {
              window.location.href = `/receipt-view/${token}`;
            }, 1000);
            return;
          }
        }
        
        // Check if it's a redeem URL with code parameter
        const code = url.searchParams.get('code');
        if (code) {
          setGiftCardCode(code);
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
        setGiftCardCode(result);
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
            subtitle="Enter your code manually or scan the QR code"
          />

          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8 bg-white/10 border-white/20">
              <TabsTrigger value="manual" className="text-white data-[state=active]:bg-primary data-[state=active]:text-white">
                <CreditCard className="w-4 h-4 mr-2" />
                Manual Entry
              </TabsTrigger>
              <TabsTrigger value="qr" className="text-white data-[state=active]:bg-primary data-[state=active]:text-white">
                <Scan className="w-4 h-4 mr-2" />
                QR Scanner
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual">
              <FormContainer
                title="Manual Entry"
                description="Enter your gift card code and amount to redeem"
              >
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="giftCardCode" className="text-white">Gift Card Code</Label>
                    <Input
                      id="giftCardCode"
                      type="text"
                      value={giftCardCode}
                      onChange={(e) => setGiftCardCode(e.target.value)}
                      placeholder="Enter your gift card code"
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                      disabled={redeemGiftCardMutation.isPending}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="redeemAmount" className="text-white">Amount to Redeem</Label>
                    <Input
                      id="redeemAmount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={redeemAmount}
                      onChange={(e) => setRedeemAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                      disabled={redeemGiftCardMutation.isPending}
                    />
                  </div>
                  
                  <div className="flex gap-4">
                    <GradientButton 
                      onClick={() => {
                        if (!giftCardCode.trim()) {
                          toast({
                            title: "Invalid Input",
                            description: "Please enter a gift card code.",
                            variant: "destructive",
                          });
                          return;
                        }
                        
                        if (!redeemAmount.trim() || parseFloat(redeemAmount) <= 0) {
                          toast({
                            title: "Invalid Amount",
                            description: "Please enter a valid amount to redeem.",
                            variant: "destructive",
                          });
                          return;
                        }
                        
                        redeemGiftCardMutation.mutate({
                          code: giftCardCode.trim(),
                          amount: parseFloat(redeemAmount)
                        });
                      }}
                      disabled={redeemGiftCardMutation.isPending || !giftCardCode.trim() || !redeemAmount.trim()}
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
                          Redeem Now
                        </>
                      )}
                    </GradientButton>
                    
                    {(redemptionResult || redeemGiftCardMutation.isError) && (
                      <GradientButton 
                        variant="outline"
                        onClick={handleReset}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reset
                      </GradientButton>
                    )}
                  </div>
                </form>
              </FormContainer>
            </TabsContent>

            <TabsContent value="qr">
              <FormContainer
                title="QR Scanner"
                description="Scan your gift card QR code for quick redemption"
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
          </Tabs>

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
                        Your gift card has been redeemed successfully
                      </p>
                    </div>
                    
                    <div className="bg-white/5 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Gift Card Code:</span>
                        <span className="text-white font-mono">{redemptionResult.code}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Amount Redeemed:</span>
                        <span className="text-green-400 font-semibold">${redemptionResult.redeemedAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Remaining Balance:</span>
                        <span className="text-white font-semibold">${redemptionResult.remainingBalance.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <GradientButton 
                        onClick={() => window.open(`${redemptionResult.receiptUrl}/pdf`, '_blank')}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Receipt
                      </GradientButton>
                      <GradientButton 
                        variant="outline"
                        onClick={handleReset}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        New Redemption
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