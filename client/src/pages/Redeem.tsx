import { useState } from 'react';
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useLogin } from "@/hooks/useLogin";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Scan, CreditCard, Download, RefreshCw, Gift, DollarSign, Sparkles, ArrowRight, TrendingUp, QrCode } from "lucide-react";
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-4000"></div>
      </div>
      
      {/* Floating icons */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          animate={{ 
            x: [0, 30, 0], 
            y: [0, -20, 0],
            rotate: [0, 5, 0]
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute top-20 left-20 text-white/20"
        >
          <Gift className="w-8 h-8" />
        </motion.div>
        
        <motion.div 
          animate={{ 
            x: [0, -25, 0], 
            y: [0, 15, 0],
            rotate: [0, -5, 0]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute top-32 right-32 text-white/20"
        >
          <QrCode className="w-6 h-6" />
        </motion.div>
        
        <motion.div 
          animate={{ 
            x: [0, 20, 0], 
            y: [0, -30, 0],
            rotate: [0, 10, 0]
          }}
          transition={{ 
            duration: 7, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-32 left-32 text-white/20"
        >
          <DollarSign className="w-7 h-7" />
        </motion.div>
        
        <motion.div 
          animate={{ 
            x: [0, -15, 0], 
            y: [0, 25, 0],
            rotate: [0, -8, 0]
          }}
          transition={{ 
            duration: 9, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 3
          }}
          className="absolute bottom-20 right-20 text-white/20"
        >
          <Sparkles className="w-5 h-5" />
        </motion.div>
      </div>

      <Navigation 
        user={user} 
        onLogin={handleLogin}
        onLogout={handleLogout}
        showDashboard={user?.role === 'admin'}
      />
      
      <div className="relative z-10 pt-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 p-4 rounded-2xl shadow-lg">
                  <Gift className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent mb-4">
              Redeem Gift Card
            </h1>
            <p className="text-white/80 text-lg">
              {!isAuthenticated ? "Please log in to redeem your gift card" : "Enter your gift card details to redeem value"}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl shadow-black/20 rounded-2xl p-8">
              {!isAuthenticated && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mb-6"
                >
                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl mb-6">
                    <div className="flex items-center mb-2">
                      <XCircle className="w-5 h-5 text-amber-400 mr-2" />
                      <p className="font-medium text-amber-100 text-sm">Authentication Required</p>
                    </div>
                    <p className="text-amber-200/70 text-sm">
                      You need to log in to redeem gift cards. This ensures secure transaction processing.
                    </p>
                  </div>
                </motion.div>
              )}

              <Tabs defaultValue="manual" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/5 border border-white/20">
                  <TabsTrigger value="manual" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-white text-white/70">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Manual Entry
                  </TabsTrigger>
                  <TabsTrigger value="scan" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-white text-white/70">
                    <QrCode className="w-4 h-4 mr-2" />
                    QR Scanner
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="manual">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="giftCardCode" className="text-white/90 font-medium">Gift Card Code</Label>
                      <div className="relative group">
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60 group-focus-within:text-white/90 transition-colors" />
                        <Input
                          id="giftCardCode"
                          type="text"
                          placeholder="Enter your gift card code"
                          value={giftCardCode}
                          onChange={(e) => setGiftCardCode(e.target.value)}
                          disabled={redeemGiftCardMutation.isPending}
                          className="pl-12 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-white/40 transition-all duration-300"
                        />
                      </div>
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="redeemAmount" className="text-white/90 font-medium">Amount to Redeem</Label>
                      <div className="relative group">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60 group-focus-within:text-white/90 transition-colors" />
                        <Input
                          id="redeemAmount"
                          type="number"
                          placeholder="Enter amount to redeem"
                          value={redeemAmount}
                          onChange={(e) => setRedeemAmount(e.target.value)}
                          disabled={redeemGiftCardMutation.isPending}
                          className="pl-12 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-white/40 transition-all duration-300"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      className="flex gap-3"
                    >
                      <button
                        type="submit"
                        disabled={!isAuthenticated || !giftCardCode.trim() || !redeemAmount.trim() || redeemGiftCardMutation.isPending}
                        className="flex-1 h-12 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {redeemGiftCardMutation.isPending ? (
                          <span className="flex items-center justify-center">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"
                            />
                            Redeeming...
                          </span>
                        ) : !isAuthenticated ? (
                          <span className="flex items-center justify-center" onClick={handleLogin}>
                            <ArrowRight className="mr-3 h-5 w-5" />
                            Login to Redeem
                          </span>
                        ) : (
                          <span className="flex items-center justify-center">
                            <Gift className="mr-3 h-5 w-5" />
                            Redeem Gift Card
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="px-6 h-12 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-all duration-300 font-medium"
                      >
                        Reset
                      </button>
                    </motion.div>
                  </form>
                </TabsContent>

                <TabsContent value="scan">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-6"
                  >
                    <div className="text-center">
                      <div className="bg-white/5 border border-white/10 p-6 rounded-xl mb-4">
                        <QrCode className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                        <p className="text-white/80 text-sm">
                          Use your camera to scan the QR code on your gift card for instant code entry
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowQRScanner(true)}
                        className="w-full h-12 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center justify-center"
                      >
                        <Scan className="w-5 h-5 mr-3" />
                        Start QR Scanner
                      </button>
                    </div>

                    {showQRScanner && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-4 bg-white/5 rounded-xl p-4"
                      >
                        <QRScanner
                          onCodeScanned={handleQRCodeScanned}
                          onClose={() => setShowQRScanner(false)}
                        />
                      </motion.div>
                    )}

                    {giftCardCode && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl"
                      >
                        <div className="flex items-center mb-2">
                          <CheckCircle className="w-5 h-5 text-emerald-400 mr-2" />
                          <p className="font-medium text-emerald-100 text-sm">Code Detected</p>
                        </div>
                        <p className="text-emerald-200/70 text-sm">
                          Gift card code: <span className="font-mono text-white">{giftCardCode}</span>
                        </p>
                        <p className="text-emerald-200/70 text-sm mt-1">
                          Now enter the amount you want to redeem in the Manual Entry tab.
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>

          {/* Redemption Result */}
          {redemptionResult && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8"
            >
              <div className="backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl shadow-black/20 rounded-2xl p-8">
                <div className="text-center space-y-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg"
                  >
                    <CheckCircle className="w-10 h-10 text-white" />
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <h3 className="text-3xl font-bold text-white bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent mb-2">
                      Redemption Successful!
                    </h3>
                    <p className="text-white/70 text-lg">
                      Your gift card has been successfully redeemed
                    </p>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Redeemed Amount:</span>
                      <span className="text-green-400 font-bold text-2xl">
                        ${redemptionResult.redeemedAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Remaining Balance:</span>
                      <span className="text-white font-semibold text-lg">
                        ${redemptionResult.remainingBalance.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Transaction ID:</span>
                      <span className="text-white font-mono text-sm">
                        {redemptionResult.transactionId}
                      </span>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="flex gap-4"
                  >
                    <button
                      onClick={() => window.location.href = '/orders'}
                      className="flex-1 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center justify-center"
                    >
                      <TrendingUp className="mr-2 h-5 w-5" />
                      View Orders
                    </button>
                    <button
                      className="flex-1 h-12 bg-white/10 border border-white/30 text-white hover:bg-white/20 hover:border-white/50 transition-all duration-300 rounded-xl font-medium flex items-center justify-center"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Download Receipt
                    </button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}