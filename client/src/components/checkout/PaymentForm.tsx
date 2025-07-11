
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CreditCard, Smartphone, Building, DollarSign, Lock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Square Web Payments SDK types (would be imported from @square/web-payments-sdk)
declare global {
  interface Window {
    Square?: any;
  }
}

const paymentSchema = z.object({
  amount: z.number().min(1).max(500),
  paymentMethod: z.enum(['card', 'ach', 'google_pay', 'apple_pay', 'cash_app_pay']),
  email: z.string().email().optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  billingAddress: z.object({
    addressLine1: z.string().min(1, 'Address is required'),
    addressLine2: z.string().optional(),
    locality: z.string().min(1, 'City is required'),
    administrativeDistrictLevel1: z.string().min(2, 'State is required'),
    postalCode: z.string().min(5, 'ZIP code is required'),
    country: z.string().default('US'),
  }).optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentFormProps {
  amount: number;
  giftCardId: string;
  recipientEmail?: string;
  recipientName?: string;
  message?: string;
  designType?: string;
  onPaymentSuccess: (paymentResult: any) => void;
  onPaymentError: (error: string) => void;
  isLoading?: boolean;
}

export default function PaymentForm({ 
  amount,
  giftCardId,
  recipientEmail = '',
  recipientName = '',
  message = '',
  designType = 'Standard',
  onPaymentSuccess, 
  onPaymentError, 
  isLoading = false 
}: PaymentFormProps) {
  const [squareLoaded, setSquareLoaded] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any>({});
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card');
  const [processing, setProcessing] = useState(false);
  const [paymentForm, setPaymentForm] = useState<any>(null);
  const [achToken, setAchToken] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount,
      paymentMethod: 'card',
      billingAddress: {
        country: 'US',
      },
    },
  });

  // Load Square Web Payments SDK
  useEffect(() => {
    const loadSquareSDK = async () => {
      if (window.Square) {
        await initializeSquarePayments();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://web.squarecdn.com/v1/square.js';
      script.async = true;
      script.onload = async () => {
        await initializeSquarePayments();
      };
      script.onerror = () => {
        onPaymentError('Failed to load payment processor');
      };
      document.head.appendChild(script);
    };

    loadSquareSDK();
  }, []);

  const initializeSquarePayments = async () => {
    try {
      if (!window.Square) {
        throw new Error('Square SDK not loaded');
      }

      // Fetch Square configuration from backend
      const configResponse = await fetch('/api/payments/config');
      if (!configResponse.ok) {
        throw new Error('Failed to fetch payment configuration');
      }
      
      const config = await configResponse.json();
      const { applicationId, locationId, environment } = config;

      if (!applicationId || !locationId) {
        throw new Error('Square configuration missing');
      }

      const payments = window.Square.payments(applicationId, locationId);
      
      // Initialize payment methods
      const paymentMethodsConfig: any = {};

      // Card payment method
      try {
        const card = await payments.card();
        await card.attach('#card-container');
        paymentMethodsConfig.card = card;
      } catch (error) {
        console.error('Card payment method failed to initialize:', error);
      }

      // Google Pay
      try {
        const googlePay = await payments.googlePay({
          buttonColor: 'black',
          buttonSizeMode: 'fill',
          buttonType: 'pay',
        });
        await googlePay.attach('#google-pay-button');
        paymentMethodsConfig.google_pay = googlePay;
      } catch (error) {
        console.error('Google Pay failed to initialize:', error);
      }

      // Apple Pay
      try {
        const applePay = await payments.applePay({
          buttonColor: 'black',
          buttonSizeMode: 'static',
          buttonType: 'pay',
        });
        await applePay.attach('#apple-pay-button');
        paymentMethodsConfig.apple_pay = applePay;
      } catch (error) {
        console.error('Apple Pay failed to initialize:', error);
      }

      // ACH Bank Transfer
      try {
        const ach = await payments.ach({
          redirectURI: window.location.href,
          transactionId: `ach-${giftCardId}-${Date.now()}`,
        });
        paymentMethodsConfig.ach = ach;
        
        // Listen for ACH tokenization events
        ach.addEventListener('ontokenization', (event: any) => {
          const { tokenResult, error } = event.detail;
          if (error) {
            console.error('ACH tokenization error:', error);
            toast({
              title: 'Bank Connection Error',
              description: error.message || 'Failed to connect to bank',
              variant: 'destructive',
            });
            setProcessing(false);
          } else if (tokenResult?.status === 'OK') {
            console.log('ACH tokenization successful, token:', tokenResult.token);
            setAchToken(tokenResult.token);
            
            // Automatically submit the form with the ACH token
            if (tokenResult.token) {
              form.handleSubmit((data) => {
                handlePayment(data, tokenResult.token);
              })();
            }
          }
        });
      } catch (error) {
        console.error('ACH payment method failed to initialize:', error);
      }

      // Cash App Pay
      try {
        const cashAppPay = await payments.cashAppPay({
          redirectURL: window.location.href,
          referenceId: `gift-card-${Date.now()}`,
        });
        await cashAppPay.attach('#cash-app-pay-button');
        paymentMethodsConfig.cash_app_pay = cashAppPay;
      } catch (error) {
        console.error('Cash App Pay failed to initialize:', error);
      }



      setPaymentMethods(paymentMethodsConfig);
      setSquareLoaded(true);
    } catch (error) {
      console.error('Failed to initialize Square payments:', error);
      onPaymentError('Payment system initialization failed');
    }
  };

  const handlePayment = async (data: PaymentFormData, achTokenFromEvent?: string) => {
    // For ACH payments with token from event listener
    if (selectedPaymentMethod === 'ach' && achTokenFromEvent) {
      setProcessing(true);
      try {
        await processPayment(data, achTokenFromEvent);
      } catch (error: any) {
        console.error('ACH payment processing error:', error);
        onPaymentError(error.message || 'Payment processing failed');
        toast({
          title: 'Payment Failed',
          description: error.message || 'Please check your payment information and try again.',
          variant: 'destructive',
        });
      } finally {
        setProcessing(false);
        setAchToken(null);
      }
      return;
    }

    if (!squareLoaded || !paymentMethods[selectedPaymentMethod]) {
      onPaymentError('Payment system not ready');
      return;
    }

    setProcessing(true);

    try {
      const paymentMethod = paymentMethods[selectedPaymentMethod];
      
      // For ACH, tokenization is triggered by button click, not form submission
      if (selectedPaymentMethod === 'ach') {
        toast({
          title: 'Connect Bank Account',
          description: 'Please click "Connect Bank Account" button to proceed with ACH payment.',
        });
        setProcessing(false);
        return;
      }
      
      // Other payment methods use standard tokenization
      const tokenResult = await paymentMethod.tokenize();
      
      if (tokenResult.status === 'OK') {
        await processPayment(data, tokenResult.token);
      } else {
        throw new Error(tokenResult.errors?.[0]?.message || 'Payment tokenization failed');
      }
    } catch (error: any) {
      console.error('Payment processing error:', error);
      onPaymentError(error.message || 'Payment processing failed');
      toast({
        title: 'Payment Failed',
        description: error.message || 'Please check your payment information and try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const processPayment = async (data: PaymentFormData, token: string) => {
    try {
      let verificationToken: string | undefined;
      
      // For card payments, perform 3D Secure verification when required
      if (selectedPaymentMethod === 'card' && window.Square?.payments) {
        try {
          // Get payments instance from Square
          const configResponse = await fetch('/api/payments/config');
          const config = await configResponse.json();
          const payments = window.Square.payments(config.applicationId, config.locationId);
          
          // Prepare buyer details for verification
          const verificationDetails = {
            amount: String(data.amount),
            billingContact: {
              givenName: data.firstName,
              familyName: data.lastName,
              email: data.email,
              country: data.billingAddress?.country || 'US',
              addressLines: data.billingAddress?.addressLine1 ? [data.billingAddress.addressLine1] : [],
              city: data.billingAddress?.locality || '',
              state: data.billingAddress?.administrativeDistrictLevel1 || '',
              postalCode: data.billingAddress?.postalCode || '',
            },
            currencyCode: 'USD',
            intent: 'CHARGE'
          };
          
          // Perform buyer verification (3D Secure/SCA)
          const verificationResult = await payments.verifyBuyer(
            token,
            verificationDetails
          );
          
          // Store verification token if successful
          if (verificationResult?.token) {
            verificationToken = verificationResult.token;
          }
        } catch (verifyError) {
          // Log verification error but continue - verification might not be required
          console.log('Buyer verification error (may not be required):', verifyError);
        }
      }
      
      // Process payment on backend with verification token
      const paymentRequest = {
        sourceId: token,
        amount: data.amount,
        giftCardId,
        recipientEmail: recipientEmail || data.email,
        recipientName: recipientName || `${data.firstName} ${data.lastName}`,
        message: message || 'Thank you for your purchase!',
        designType,
        verificationToken, // Include verification token for 3D Secure
        buyerEmailAddress: data.email, // Include buyer email for receipts
        paymentType: selectedPaymentMethod === 'ach' ? 'ACH' : undefined // Mark ACH payments
      };

      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentRequest),
      });

      const result = await response.json();

      if (result.success) {
        onPaymentSuccess(result);
        
        if (selectedPaymentMethod === 'ach') {
          toast({
            title: 'ACH Payment Initiated!',
            description: `Your ACH payment of $${data.amount} has been initiated. It will process in 3-5 business days.`,
          });
        } else {
          toast({
            title: 'Payment Successful!',
            description: `Your payment of $${data.amount} has been processed.`,
          });
        }
      } else {
        throw new Error(result.errorMessage || 'Payment failed');
      }
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Secure Payment - ${amount.toFixed(2)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handlePayment)} className="space-y-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Customer Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address (Optional)</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Payment Methods */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Payment Method</h3>
              
              <Tabs value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="card" className="text-xs">
                    <CreditCard className="w-4 h-4" />
                  </TabsTrigger>
                  <TabsTrigger value="google_pay" className="text-xs">
                    Google Pay
                  </TabsTrigger>
                  <TabsTrigger value="apple_pay" className="text-xs">
                    Apple Pay
                  </TabsTrigger>
                  <TabsTrigger value="cash_app_pay" className="text-xs">
                    Cash App
                  </TabsTrigger>
                  <TabsTrigger value="ach" className="text-xs">
                    <Building className="w-4 h-4" />
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="card" className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <Label className="text-sm font-medium mb-2 block">Card Information</Label>
                    <div id="card-container" className="min-h-[120px]">
                      {!squareLoaded && (
                        <div className="flex items-center justify-center h-20">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span className="ml-2">Loading secure card form...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="google_pay">
                  <div className="space-y-4">
                    <div id="google-pay-button" className="min-h-[48px]">
                      {!squareLoaded && (
                        <div className="flex items-center justify-center h-12 border rounded">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Loading Google Pay...
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="apple_pay">
                  <div className="space-y-4">
                    <div id="apple-pay-button" className="min-h-[48px]">
                      {!squareLoaded && (
                        <div className="flex items-center justify-center h-12 border rounded">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Loading Apple Pay...
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="cash_app_pay">
                  <div className="space-y-4">
                    <div id="cash-app-pay-button" className="min-h-[48px]">
                      {!squareLoaded && (
                        <div className="flex items-center justify-center h-12 border rounded">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Loading Cash App Pay...
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="ach" className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      ACH bank transfers typically take 3-5 business days to process.
                      Your gift card will be activated once payment is confirmed.
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Click the button below to securely connect your bank account through Plaid.
                      1% processing fee (minimum $1).
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={!squareLoaded || processing}
                      onClick={async (e) => {
                        e.preventDefault();
                        
                        // Validate form first
                        const isValid = await form.trigger();
                        if (!isValid) {
                          toast({
                            title: 'Form Validation Error',
                            description: 'Please fill in all required fields before connecting your bank account.',
                            variant: 'destructive',
                          });
                          return;
                        }
                        
                        if (paymentMethods.ach) {
                          try {
                            setProcessing(true);
                            const firstName = form.getValues('firstName');
                            const lastName = form.getValues('lastName');
                            const accountHolderName = `${firstName} ${lastName}`;
                            
                            await paymentMethods.ach.tokenize({
                              accountHolderName,
                              intent: 'CHARGE',
                              amount: String(amount),
                              currency: 'USD'
                            });
                          } catch (error) {
                            setProcessing(false);
                            console.error('ACH tokenization error:', error);
                            toast({
                              title: 'Bank Connection Error',
                              description: 'Failed to connect to your bank. Please try again.',
                              variant: 'destructive',
                            });
                          }
                        }
                      }}
                    >
                      <Building className="w-4 h-4 mr-2" />
                      Connect Bank Account
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Only show manual submit for card and ACH */}
            {(selectedPaymentMethod === 'card' || selectedPaymentMethod === 'ach') && (
              <Button
                type="submit"
                className="w-full"
                disabled={processing || isLoading || !squareLoaded}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Pay ${amount.toFixed(2)}
                  </>
                )}
              </Button>
            )}

            {/* Security badges */}
            <div className="flex items-center justify-center space-x-4 pt-4">
              <Badge variant="outline" className="text-xs">
                <Lock className="w-3 h-3 mr-1" />
                SSL Secured
              </Badge>
              <Badge variant="outline" className="text-xs">
                PCI Compliant
              </Badge>
              <Badge variant="outline" className="text-xs">
                256-bit Encryption
              </Badge>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
