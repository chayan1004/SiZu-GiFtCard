import { useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";

export default function Balance() {
  const { user, isAuthenticated } = useAuth();
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

    checkBalanceMutation.mutate(giftCardCode.trim());
  };

  const handleReset = () => {
    setGiftCardCode('');
    setBalanceResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation 
        user={user} 
        onLogin={handleLogin}
        onLogout={handleLogout}
        showDashboard={user?.role === 'admin'}
      />
      
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Check Your Balance</h1>
            <p className="text-xl text-gray-300">
              Enter your gift card code to view your current balance
            </p>
          </motion.div>

          {/* Balance Check Form */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="glassmorphism border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Gift Card Balance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="giftCardCode" className="text-white">Gift Card Code</Label>
                    <Input
                      id="giftCardCode"
                      type="text"
                      value={giftCardCode}
                      onChange={(e) => setGiftCardCode(e.target.value)}
                      placeholder="Enter your gift card code (e.g., GC123456789)"
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                      disabled={checkBalanceMutation.isPending}
                    />
                  </div>
                  
                  <div className="flex gap-4">
                    <Button 
                      type="submit"
                      disabled={checkBalanceMutation.isPending || !giftCardCode.trim()}
                      className="flex-1 gradient-primary text-white hover:opacity-90 transition-opacity"
                    >
                      {checkBalanceMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        'Check Balance'
                      )}
                    </Button>
                    
                    {(balanceResult || checkBalanceMutation.isError) && (
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={handleReset}
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reset
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Balance Result */}
          {balanceResult && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-8 max-w-2xl mx-auto"
            >
              <Card className="glassmorphism border-white/20">
                <CardContent className="p-8">
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">Current Balance</h3>
                      <p className="text-5xl font-bold text-green-400 mb-4">
                        ${balanceResult.balance.toFixed(2)}
                      </p>
                      <Badge 
                        variant={balanceResult.isActive ? "default" : "destructive"}
                        className={`${balanceResult.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}
                      >
                        {balanceResult.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <div className="bg-white/10 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Gift Card Code:</span>
                        <span className="text-white font-mono">{balanceResult.code}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Status:</span>
                        <span className="text-white">{balanceResult.isActive ? 'Active' : 'Inactive'}</span>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button 
                        onClick={() => window.location.href = '/redeem'}
                        className="flex-1 gradient-primary text-white hover:opacity-90 transition-opacity"
                        disabled={!balanceResult.isActive || balanceResult.balance <= 0}
                      >
                        Redeem Gift Card
                      </Button>
                      <Button 
                        onClick={handleReset}
                        variant="outline"
                        className="flex-1 border-white/20 text-white hover:bg-white/10"
                      >
                        Check Another
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Error State */}
          {checkBalanceMutation.isError && !balanceResult && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-8 max-w-2xl mx-auto"
            >
              <Card className="glassmorphism border-red-500/20">
                <CardContent className="p-8">
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                      <XCircle className="w-8 h-8 text-red-400" />
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">Gift Card Not Found</h3>
                      <p className="text-gray-300">
                        The gift card code you entered was not found. Please check the code and try again.
                      </p>
                    </div>
                    
                    <div className="bg-red-500/20 rounded-lg p-4">
                      <p className="text-red-400 text-sm">
                        Make sure you've entered the complete gift card code exactly as shown on your gift card.
                      </p>
                    </div>

                    <Button 
                      onClick={handleReset}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Try Again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Help Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-12 max-w-2xl mx-auto"
          >
            <Card className="glassmorphism border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-white">Gift Card Code Format</h4>
                  <p className="text-gray-300 text-sm">
                    Gift card codes typically start with "GC" followed by 10-12 characters (e.g., GC123456789ABC).
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-white">Can't Find Your Code?</h4>
                  <p className="text-gray-300 text-sm">
                    Check your email for the gift card receipt or PDF. The code should be clearly displayed there.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-white">Still Having Issues?</h4>
                  <p className="text-gray-300 text-sm">
                    Contact our support team if you continue to have problems accessing your gift card balance.
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
