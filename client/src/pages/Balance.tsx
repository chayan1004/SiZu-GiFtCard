import { useState } from 'react';
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useLogin } from "@/hooks/useLogin";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle, XCircle, Loader2, RefreshCw, Wallet, QrCode, Sparkles, TrendingUp, ArrowRight } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { 
  PageContainer, 
  PageHeader, 
  FormContainer, 
  GradientButton,
  GlassCard,
  LoadingSpinner 
} from "@/components/DesignSystem";
import { CardContent } from "@/components/ui/card";

export default function Balance() {
  const { user, isAuthenticated } = useAuth();
  const { handleLogin } = useLogin();
  const { toast } = useToast();
  const [giftCardCode, setGiftCardCode] = useState('');
  const [balanceResult, setBalanceResult] = useState<any>(null);

  const checkBalanceMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest('POST', '/api/giftcards/balance', { code });
      return response.json();
    },
    onSuccess: (data) => {
      setBalanceResult(data);
      toast({
        title: "Balance Retrieved",
        description: `Balance: $${data.balance.toFixed(2)}`,
      });
    },
    onError: (error) => {
      setBalanceResult(null);
      toast({
        title: "Error",
        description: "Gift card not found or invalid code. Please check and try again.",
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
    if (giftCardCode.trim()) {
      checkBalanceMutation.mutate(giftCardCode.trim());
    }
  };

  const handleReset = () => {
    setGiftCardCode('');
    setBalanceResult(null);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-4000"></div>
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
          <Wallet className="w-8 h-8" />
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
          <CreditCard className="w-7 h-7" />
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
                <div className="bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 p-4 rounded-2xl shadow-lg">
                  <Wallet className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent mb-4">
              Check Gift Card Balance
            </h1>
            <p className="text-white/80 text-lg">
              Enter your gift card code to check your current balance instantly
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl shadow-black/20 rounded-2xl p-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-6"
              >
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl mb-6">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="w-5 h-5 text-green-300 mr-2" />
                    <p className="font-medium text-white/90 text-sm">No Account Required</p>
                  </div>
                  <p className="text-white/70 text-sm">
                    This feature works without signing in - simply enter your gift card code to check the balance
                  </p>
                </div>
              </motion.div>

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
                      disabled={checkBalanceMutation.isPending}
                      className="pl-12 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-white/40 transition-all duration-300"
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="flex gap-3"
                >
                  <button
                    type="submit"
                    disabled={!giftCardCode.trim() || checkBalanceMutation.isPending}
                    className="flex-1 h-12 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {checkBalanceMutation.isPending ? (
                      <span className="flex items-center justify-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"
                        />
                        Checking Balance...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <Wallet className="mr-3 h-5 w-5" />
                        Check Balance
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
            </div>
          </motion.div>

          {/* Balance Result */}
          {balanceResult && (
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
                      Balance Retrieved!
                    </h3>
                    <p className="text-white/70 text-lg">
                      Your gift card details and current balance
                    </p>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Gift Card Code:</span>
                      <span className="text-white font-mono text-lg">{balanceResult.code}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Current Balance:</span>
                      <span className="text-green-400 font-bold text-2xl">${balanceResult.balance.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Design:</span>
                      <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0">
                        {balanceResult.design}
                      </Badge>
                    </div>
                    {balanceResult.initialAmount && (
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Original Amount:</span>
                        <span className="text-white font-semibold">${balanceResult.initialAmount.toFixed(2)}</span>
                      </div>
                    )}
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="flex gap-4"
                  >
                    <button
                      onClick={() => window.location.href = '/redeem'}
                      className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center justify-center"
                    >
                      <Gift className="mr-2 h-5 w-5" />
                      Redeem Gift Card
                    </button>
                    <button
                      onClick={() => window.location.href = '/recharge'}
                      className="flex-1 h-12 bg-white/10 border border-white/30 text-white hover:bg-white/20 hover:border-white/50 transition-all duration-300 rounded-xl font-medium flex items-center justify-center"
                    >
                      <TrendingUp className="mr-2 h-5 w-5" />
                      Recharge Card
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