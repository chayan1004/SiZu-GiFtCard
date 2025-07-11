import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { loginSchema, LoginFormData } from "@/schemas/auth";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CreditCard, Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";

export default function CustomerLogin() {
  const { login, isLoading } = useCustomerAuth();
  const [showPassword, setShowPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur"
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
    } catch (error: any) {
      setError("root", {
        message: error.message || "Invalid email or password"
      });
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
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-full">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>
              Login to your account to manage your gift cards
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10"
                    {...register("email")}
                    aria-invalid={errors.email ? "true" : "false"}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    {...register("password")}
                    aria-invalid={errors.password ? "true" : "false"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {errors.root && (
                <p className="text-sm text-red-500 text-center" role="alert">
                  {errors.root.message}
                </p>
              )}

              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-sm text-purple-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting || isLoading ? (
                  <span className="flex items-center">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </span>
                )}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <Link href="/register">
                  <a className="text-purple-600 hover:underline font-medium">
                    Create one
                  </a>
                </Link>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or</span>
                </div>
              </div>

              <Link href="/">
                <Button variant="outline" className="w-full">
                  Continue as Guest
                </Button>
              </Link>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}