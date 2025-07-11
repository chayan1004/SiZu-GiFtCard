import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function OAuthError() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  useEffect(() => {
    // Get error details from URL params
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error') || 'unknown_error';
    const descParam = params.get('description') || '';
    
    setError(errorParam);
    setDescription(descParam);
  }, []);

  const getErrorMessage = (error: string): string => {
    switch (error) {
      case 'access_denied':
        return 'You cancelled the Square authorization process.';
      case 'invalid_state':
        return 'The authorization session has expired. Please try again.';
      case 'token_exchange_failed':
        return 'Failed to complete the authorization process. Please try again.';
      case 'service_unavailable':
        return 'The OAuth service is temporarily unavailable. Please try again later.';
      case 'storage_failed':
        return 'Failed to save your Square connection. Please contact support.';
      case 'callback_failed':
        return 'An unexpected error occurred during authorization.';
      default:
        return 'An error occurred while connecting your Square account.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-800">
            Connection Failed
          </CardTitle>
          <CardDescription className="text-red-600">
            {getErrorMessage(error)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {description && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {description}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Error Code:</strong> {error}
            </p>
            <p className="text-xs text-gray-500">
              If this problem persists, please contact support with this error code.
            </p>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={() => setLocation('/admin/settings')}
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            
            <Button 
              onClick={() => setLocation('/admin')}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}