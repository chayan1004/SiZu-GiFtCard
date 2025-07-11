import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Check, Store, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OAuthSuccess() {
  const [, setLocation] = useLocation();
  const [merchantId, setMerchantId] = useState<string>("");

  useEffect(() => {
    // Get merchant ID from URL params
    const params = new URLSearchParams(window.location.search);
    const id = params.get('merchant_id');
    if (id) {
      setMerchantId(id);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-800">
            Square Account Connected!
          </CardTitle>
          <CardDescription className="text-green-600">
            Your Square account has been successfully connected to the gift card platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {merchantId && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Store className="w-4 h-4" />
                <span>Merchant ID: {merchantId}</span>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <Button 
              onClick={() => setLocation('/admin/settings')}
              className="w-full"
            >
              Go to Settings
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            
            <Button 
              onClick={() => setLocation('/admin')}
              variant="outline"
              className="w-full"
            >
              Back to Dashboard
            </Button>
          </div>
          
          <div className="text-sm text-gray-500 text-center pt-4">
            You can now process payments, manage gift cards, and handle transactions through your connected Square account.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}