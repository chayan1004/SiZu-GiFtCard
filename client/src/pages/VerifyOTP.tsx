import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { CheckCircle, CreditCard, RefreshCw, Shield } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be exactly 6 digits").regex(/^\d+$/, "OTP must contain only numbers"),
});

type OTPFormData = z.infer<typeof otpSchema>;

interface VerifyOTPPageProps {
  email?: string;
}

export default function VerifyOTP() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState<string>("");
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
    watch
  } = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
    mode: "onChange"
  });

  const otpValue = watch("otp");

  useEffect(() => {
    // Get email from localStorage (set during registration)
    const storedEmail = localStorage.getItem('verificationEmail');
    if (!storedEmail) {
      setLocation('/register');
    } else {
      setEmail(storedEmail);
    }
  }, [setLocation]);

  useEffect(() => {
    // Auto-focus on OTP input
    const otpInput = document.getElementById('otp');
    if (otpInput) {
      otpInput.focus();
    }
  }, []);

  useEffect(() => {
    // Handle resend timer
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const onSubmit = async (data: OTPFormData) => {
    setIsVerifying(true);
    try {
      const res = await apiRequest('POST', '/api/auth/verify-otp', {
        email,
        otp: data.otp
      });
      const response = await res.json();

      toast({
        title: "Email verified!",
        description: "Your account has been successfully verified.",
      });

      // Clear stored email
      localStorage.removeItem('verificationEmail');

      // Redirect to login page after successful verification
      setLocation('/login');
    } catch (error: any) {
      setError("otp", {
        message: error.message || "Invalid verification code"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    try {
      await apiRequest('POST', '/api/auth/resend-otp', { email });
      
      toast({
        title: "Code resent!",
        description: "A new verification code has been sent to your email.",
      });
      
      // Set 60 second timer before allowing another resend
      setResendTimer(60);
      
      // Clear the OTP input
      setValue('otp', '');
    } catch (error: any) {
      toast({
        title: "Resend failed",
        description: error.message || "Failed to resend verification code",
        variant: "destructive"
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card className="border-gray-200 shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-full relative">
                <Shield className="w-8 h-8 text-white" />
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
            <CardDescription>
              We've sent a 6-digit verification code to
              <br />
              <span className="font-semibold text-purple-600">{email}</span>
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-center block">
                  Enter Verification Code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-2xl font-bold tracking-widest"
                  autoComplete="one-time-code"
                  {...register("otp")}
                />
                {errors.otp && (
                  <p className="text-sm text-red-500 text-center">{errors.otp.message}</p>
                )}
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-700">
                <p className="font-medium mb-1">Didn't receive the code?</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Check your spam folder</li>
                  <li>Make sure you entered the correct email</li>
                  <li>Wait a few moments and try resending</li>
                </ul>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                disabled={isVerifying || otpValue?.length !== 6}
              >
                {isVerifying ? "Verifying..." : "Verify Email"}
              </Button>

              <div className="flex items-center justify-between w-full">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResendOTP}
                  disabled={isResending || resendTimer > 0}
                  className="text-purple-600 hover:text-purple-700"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isResending ? 'animate-spin' : ''}`} />
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
                </Button>

                <Link href="/register">
                  <Button type="button" variant="ghost" className="text-gray-600 hover:text-gray-700">
                    Change Email
                  </Button>
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}