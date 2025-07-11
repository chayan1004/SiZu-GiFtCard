import { useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { useLogin } from "@/hooks/useLogin";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react";
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
            title="Check Gift Card Balance"
            subtitle="Enter your gift card code to check your current balance"
          />

          <FormContainer
            title="Balance Check"
            description="This works without signing in - simply enter your gift card code"
          >
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
                  disabled={checkBalanceMutation.isPending}
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                />
              </div>

              <div className="flex gap-2">
                <GradientButton
                  type="submit"
                  disabled={!giftCardCode.trim() || checkBalanceMutation.isPending}
                  className="flex-1"
                >
                  {checkBalanceMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Check Balance
                    </>
                  )}
                </GradientButton>
                
                <GradientButton
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={checkBalanceMutation.isPending}
                >
                  <RefreshCw className="w-4 h-4" />
                </GradientButton>
              </div>
            </form>
          </FormContainer>

          {/* Balance Result */}
          {balanceResult && (
            <div className="mt-8">
              <GlassCard>
                <CardContent className="p-6">
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        Balance Found!
                      </h3>
                      <p className="text-gray-300">
                        Your gift card details
                      </p>
                    </div>
                    
                    <div className="bg-white/5 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Gift Card Code:</span>
                        <span className="text-white font-mono">{balanceResult.code}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Current Balance:</span>
                        <span className="text-green-400 font-semibold text-lg">${balanceResult.balance.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Design:</span>
                        <Badge variant="secondary" className="bg-white/10 text-white">
                          {balanceResult.design}
                        </Badge>
                      </div>
                      {balanceResult.initialAmount && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Original Amount:</span>
                          <span className="text-white">${balanceResult.initialAmount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <GradientButton 
                        onClick={() => window.location.href = '/redeem'}
                        className="flex-1"
                      >
                        Redeem Gift Card
                      </GradientButton>
                      <GradientButton 
                        onClick={() => window.location.href = '/recharge'}
                        variant="outline"
                        className="flex-1"
                      >
                        Recharge Card
                      </GradientButton>
                    </div>
                  </div>
                </CardContent>
              </GlassCard>
            </div>
          )}

          {/* No Balance Result */}
          {!balanceResult && !checkBalanceMutation.isPending && giftCardCode && (
            <div className="mt-8">
              <GlassCard>
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                      <XCircle className="w-8 h-8 text-red-400" />
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        No Balance Found
                      </h3>
                      <p className="text-gray-300">
                        Please check your gift card code and try again
                      </p>
                    </div>
                    
                    <GradientButton 
                      onClick={() => window.location.href = '/shop'}
                      className="w-full"
                    >
                      Buy a Gift Card
                    </GradientButton>
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