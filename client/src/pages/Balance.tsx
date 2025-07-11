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
            title="Check Balance"
            subtitle="Enter your gift card code to check your current balance"
          />

          <FormContainer
            title="Balance Check"
            description="Enter your gift card details below"
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
                  disabled={checkBalanceMutation.isPending}
                />
              </div>
              
              <div className="flex gap-4">
                <GradientButton 
                  onClick={handleSubmit}
                  disabled={checkBalanceMutation.isPending || !giftCardCode.trim()}
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
                
                {(balanceResult || checkBalanceMutation.isError) && (
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
                        <span className="text-white font-mono text-sm">{balanceResult.code}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Status:</span>
                        <span className="text-white">{balanceResult.isActive ? 'Active' : 'Inactive'}</span>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <GradientButton 
                        onClick={() => window.location.href = '/redeem'}
                        disabled={!balanceResult.isActive || balanceResult.balance <= 0}
                        className="flex-1"
                      >
                        Redeem Gift Card
                      </GradientButton>
                      <GradientButton 
                        onClick={handleReset}
                        variant="outline"
                        className="flex-1"
                      >
                        Check Another
                      </GradientButton>
                    </div>
                  </div>
                </CardContent>
              </GlassCard>
            </div>
          )}

          {/* Error State */}
          {checkBalanceMutation.isError && !balanceResult && (
            <div className="mt-8">
              <GlassCard className="border-red-500/20">
                <CardContent className="p-6">
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

                    <GradientButton 
                      onClick={handleReset}
                      variant="outline"
                    >
                      Try Again
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
