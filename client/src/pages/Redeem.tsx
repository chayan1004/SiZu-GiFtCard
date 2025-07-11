import { useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Loader2, Scan, CreditCard, Download, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import QRScanner from "@/components/QRScanner";

export default function Redeem() {
  const { user, isAuthenticated } = useAuth();
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation 
        user={user} 
        onLogin={handleLogin}
        onLogout={handleLogout}
        showDashboard={user?.role === 'admin'}
      />
      
      <div className="pt-20 sm:pt-24 pb-12 sm:pb-16 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header - Responsive */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 sm:mb-12"
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">Redeem Gift Card</h1>
            <p className="text-sm sm:text-lg lg:text-xl text-gray-300 px-4">
              Enter your code manually or scan the QR code
            </p>
          </motion.div>

          {/* Redemption Methods */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <Tabs defaultValue="manual" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-6 sm:mb-8 bg-white/10 border-white/20">
                <TabsTrigger value="manual" className="text-white data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm">
                  <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Manual Entry
                </TabsTrigger>
                <TabsTrigger value="qr" className="text-white data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm">
                  <Scan className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  QR Scanner
                </TabsTrigger>
              </TabsList>

              <TabsContent value="manual">
                <Card className="glassmorphism border-white/20">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-white text-lg sm:text-xl">Manual Entry</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0 space-y-4 sm:space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                      <div>
                        <Label htmlFor="giftCardCode" className="text-white text-sm sm:text-base">Gift Card Code</Label>
                        <Input
                          id="giftCardCode"
                          type="text"
                          value={giftCardCode}
                          onChange={(e) => setGiftCardCode(e.target.value)}
                          placeholder="Enter your gift card code"
                          className="bg-white/10 border-white/20 text-white placeholder-gray-400 text-sm sm:text-base h-9 sm:h-11"
                          disabled={redeemGiftCardMutation.isPending}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="redeemAmount" className="text-white text-sm sm:text-base">Amount to Redeem</Label>
                        <Input
                          id="redeemAmount"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={redeemAmount}
                          onChange={(e) => setRedeemAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="bg-white/10 border-white/20 text-white placeholder-gray-400 text-sm sm:text-base h-9 sm:h-11"
                          disabled={redeemGiftCardMutation.isPending}
                        />
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <Button 
                          type="submit"
                          disabled={redeemGiftCardMutation.isPending || !giftCardCode.trim() || !redeemAmount.trim()}
                          className="flex-1 gradient-primary text-white hover:opacity-90 transition-opacity h-9 sm:h-11 text-sm sm:text-base"
                        >
                          {redeemGiftCardMutation.isPending ? (
                            <>
                              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" />
                              Redeeming...
                            </>
                          ) : (
                            'Redeem Now'
                          )}
                        </Button>
                        
                        {(redemptionResult || redeemGiftCardMutation.isError) && (
                          <Button 
                            type="button"
                            variant="outline"
                            onClick={handleReset}
                            className="border-white/20 text-white hover:bg-white/10 h-9 sm:h-11 text-sm sm:text-base"
                          >
                            <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                            Reset
                          </Button>
                        )}
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="qr">
                <Card className="glassmorphism border-white/20">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-white text-lg sm:text-xl">QR Code Scanner</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0 space-y-4 sm:space-y-6">
                    <div className="text-center">
                      {showQRScanner ? (
                        <div className="space-y-3 sm:space-y-4">
                          <QRScanner onResult={handleQRScan} />
                          <Button 
                            onClick={() => setShowQRScanner(false)}
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10 h-9 sm:h-11 text-sm sm:text-base px-4 sm:px-6"
                          >
                            Close Scanner
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3 sm:space-y-4">
                          <div className="w-48 h-48 sm:w-64 sm:h-64 bg-white/10 border-2 border-dashed border-white/30 rounded-lg flex items-center justify-center mx-auto">
                            <div className="text-center">
                              <Scan className="w-12 h-12 sm:w-16 sm:h-16 text-white mx-auto mb-3 sm:mb-4" />
                              <p className="text-white text-sm sm:text-base">Point camera at QR code</p>
                            </div>
                          </div>
                          
                          <Button 
                            onClick={() => setShowQRScanner(true)}
                            className="gradient-primary text-white px-6 sm:px-8 py-2.5 sm:py-3 font-semibold hover:opacity-90 transition-opacity h-9 sm:h-11 text-sm sm:text-base"
                          >
                            Start Camera
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Manual entry form for QR tab - Responsive */}
                    <div className="border-t border-white/20 pt-4 sm:pt-6">
                      <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Or enter manually:</h4>
                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <Label htmlFor="qrGiftCardCode" className="text-white text-sm sm:text-base">Gift Card Code</Label>
                          <Input
                            id="qrGiftCardCode"
                            type="text"
                            value={giftCardCode}
                            onChange={(e) => setGiftCardCode(e.target.value)}
                            placeholder="Enter your gift card code"
                            className="bg-white/10 border-white/20 text-white placeholder-gray-400 text-sm sm:text-base h-9 sm:h-11"
                            disabled={redeemGiftCardMutation.isPending}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="qrRedeemAmount" className="text-white text-sm sm:text-base">Amount to Redeem</Label>
                          <Input
                            id="qrRedeemAmount"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={redeemAmount}
                            onChange={(e) => setRedeemAmount(e.target.value)}
                            placeholder="Enter amount"
                            className="bg-white/10 border-white/20 text-white placeholder-gray-400 text-sm sm:text-base h-9 sm:h-11"
                            disabled={redeemGiftCardMutation.isPending}
                          />
                        </div>
                        
                        <Button 
                          onClick={handleSubmit}
                          disabled={redeemGiftCardMutation.isPending || !giftCardCode.trim() || !redeemAmount.trim()}
                          className="w-full gradient-primary text-white hover:opacity-90 transition-opacity h-9 sm:h-11 text-sm sm:text-base"
                        >
                          {redeemGiftCardMutation.isPending ? (
                            <>
                              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" />
                              Redeeming...
                            </>
                          ) : (
                            'Redeem Now'
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Success Result - Responsive */}
          {redemptionResult && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-6 sm:mt-8 max-w-2xl mx-auto"
            >
              <Card className="glassmorphism border-white/20">
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  <div className="text-center space-y-4 sm:space-y-6">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
                    </div>
                    
                    <div>
                      <h3 className="text-lg sm:text-2xl font-bold text-white mb-1 sm:mb-2">Redemption Successful!</h3>
                      <p className="text-gray-300 text-sm sm:text-base">
                        Your gift card has been successfully redeemed.
                      </p>
                    </div>
                    
                    <div className="bg-white/10 rounded-lg p-3 sm:p-4 lg:p-6 space-y-2 sm:space-y-3 lg:space-y-4">
                      <div className="flex justify-between items-center text-sm sm:text-base">
                        <span className="text-gray-300">Redeemed Amount:</span>
                        <span className="text-green-400 font-bold text-base sm:text-lg lg:text-xl">
                          ${redemptionResult.redeemedAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm sm:text-base">
                        <span className="text-gray-300">Remaining Balance:</span>
                        <span className="text-white font-bold">
                          ${redemptionResult.remainingBalance.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm sm:text-base">
                        <span className="text-gray-300">Transaction ID:</span>
                        <span className="text-white font-mono text-xs sm:text-sm break-all">
                          {redemptionResult.transactionId}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <Button 
                        onClick={() => window.open(redemptionResult.receiptUrl, '_blank')}
                        className="flex-1 gradient-primary text-white hover:opacity-90 transition-opacity h-9 sm:h-11 text-sm sm:text-base"
                      >
                        <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                        Download Receipt
                      </Button>
                      <Button 
                        onClick={handleReset}
                        variant="outline"
                        className="flex-1 border-white/20 text-white hover:bg-white/10 h-9 sm:h-11 text-sm sm:text-base"
                      >
                        Redeem Another
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Error State - Responsive */}
          {redeemGiftCardMutation.isError && !redemptionResult && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-6 sm:mt-8 max-w-2xl mx-auto"
            >
              <Card className="glassmorphism border-red-500/20">
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  <div className="text-center space-y-4 sm:space-y-6">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                      <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" />
                    </div>
                    
                    <div>
                      <h3 className="text-lg sm:text-2xl font-bold text-white mb-1 sm:mb-2">Redemption Failed</h3>
                      <p className="text-gray-300 text-sm sm:text-base px-2">
                        Unable to redeem your gift card. Please check your code and amount.
                      </p>
                    </div>
                    
                    <div className="bg-red-500/20 rounded-lg p-3 sm:p-4">
                      <p className="text-red-400 text-xs sm:text-sm">
                        Common issues: Invalid gift card code, insufficient balance, or gift card is not active.
                      </p>
                    </div>

                    <Button 
                      onClick={handleReset}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10 h-9 sm:h-11 text-sm sm:text-base px-4 sm:px-6"
                    >
                      Try Again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Help Section - Responsive */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-8 sm:mt-12 max-w-4xl mx-auto"
          >
            <Card className="glassmorphism border-white/20">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-white text-lg sm:text-xl">Redemption Help</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6 pt-0">
                <div className="space-y-1.5 sm:space-y-2">
                  <h4 className="font-semibold text-white text-sm sm:text-base">QR Code Scanning</h4>
                  <p className="text-gray-300 text-xs sm:text-sm">
                    Point your camera at the QR code on your gift card to automatically fill in the code.
                  </p>
                </div>
                
                <div className="space-y-1.5 sm:space-y-2">
                  <h4 className="font-semibold text-white text-sm sm:text-base">Partial Redemption</h4>
                  <p className="text-gray-300 text-xs sm:text-sm">
                    You can redeem any amount up to your gift card balance. The remaining balance stays on the card.
                  </p>
                </div>
                
                <div className="space-y-1.5 sm:space-y-2">
                  <h4 className="font-semibold text-white text-sm sm:text-base">Receipt Download</h4>
                  <p className="text-gray-300 text-xs sm:text-sm">
                    After redemption, you'll receive a receipt that you can download and save for your records.
                  </p>
                </div>
                
                <div className="space-y-1.5 sm:space-y-2">
                  <h4 className="font-semibold text-white text-sm sm:text-base">Need Support?</h4>
                  <p className="text-gray-300 text-xs sm:text-sm">
                    If you're having issues redeeming your gift card, contact our support team for assistance.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
