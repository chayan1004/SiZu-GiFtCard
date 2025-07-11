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
import { CreditCard, Mail, Lock, Eye, EyeOff, LogIn, Gift, Sparkles, ShieldCheck } from "lucide-react";

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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-4000"></div>
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
          <Sparkles className="w-6 h-6" />
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
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            duration: 0.8, 
            ease: "easeOut",
            type: "spring",
            damping: 20
          }}
          className="w-full max-w-md"
        >
          {/* Glassmorphism card */}
          <Card className="backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl shadow-black/20">
            <CardHeader className="space-y-6 text-center pb-6">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  delay: 0.3, 
                  type: "spring", 
                  stiffness: 200 
                }}
                className="flex justify-center"
              >
                <div className="relative">
                  <div className="bg-gradient-to-br from-purple-400 via-pink-400 to-indigo-400 p-4 rounded-2xl shadow-lg">
                    <CreditCard className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 bg-green-400 rounded-full p-1">
                    <ShieldCheck className="w-4 h-4 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <CardTitle className="text-3xl font-bold text-white bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  Welcome Back
                </CardTitle>
                <CardDescription className="text-white/80 text-base mt-2">
                  Access your premium gift card collection
                </CardDescription>
              </motion.div>
            </CardHeader>

            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-2"
                >
                  <Label htmlFor="email" className="text-white/90 font-medium">Email Address</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60 group-focus-within:text-white/90 transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      className="pl-12 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-white/40 transition-all duration-300"
                      {...register("email")}
                      aria-invalid={errors.email ? "true" : "false"}
                    />
                  </div>
                  {errors.email && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-300" 
                      role="alert"
                    >
                      {errors.email.message}
                    </motion.p>
                  )}
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  className="space-y-2"
                >
                  <Label htmlFor="password" className="text-white/90 font-medium">Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60 group-focus-within:text-white/90 transition-colors" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="pl-12 pr-12 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-white/40 transition-all duration-300"
                      {...register("password")}
                      aria-invalid={errors.password ? "true" : "false"}
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/90 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </motion.button>
                  </div>
                  {errors.password && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-300" 
                      role="alert"
                    >
                      {errors.password.message}
                    </motion.p>
                  )}
                </motion.div>

                {errors.root && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-red-500/20 border border-red-300/30 rounded-lg p-3 text-center"
                  >
                    <p className="text-sm text-red-200" role="alert">
                      {errors.root.message}
                    </p>
                  </motion.div>
                )}

                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="flex justify-end"
                >
                  <Link href="/forgot-password" className="text-sm text-purple-300 hover:text-white transition-colors cursor-pointer">
                    Forgot password?
                  </Link>
                </motion.div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4 pt-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="w-full"
                >
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 hover:from-purple-600 hover:via-pink-600 hover:to-indigo-600 text-white font-semibold rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
                    disabled={isSubmitting || isLoading}
                  >
                    {isSubmitting || isLoading ? (
                      <span className="flex items-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"
                        />
                        Signing you in...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <LogIn className="mr-3 h-5 w-5" />
                        Sign In to Your Account
                      </span>
                    )}
                  </Button>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.0 }}
                  className="text-center text-sm text-white/80"
                >
                  New to our platform?{" "}
                  <Link href="/register" className="text-purple-300 hover:text-white font-medium transition-colors cursor-pointer">
                    Create your account
                  </Link>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1 }}
                  className="relative w-full"
                >
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent px-4 text-white/60 font-medium">Or explore without account</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="w-full"
                >
                  <Link 
                    href="/"
                    className="block w-full h-12 bg-white/10 border border-white/30 text-white hover:bg-white/20 hover:border-white/50 transition-all duration-300 rounded-xl font-medium flex items-center justify-center"
                  >
                    Browse as Guest
                  </Link>
                </motion.div>
              </CardFooter>
            </form>
          </Card>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            className="mt-6 flex justify-center items-center space-x-6 text-white/60 text-xs"
          >
            <div className="flex items-center space-x-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Secure Login</span>
            </div>
            <div className="flex items-center space-x-1">
              <Sparkles className="w-4 h-4" />
              <span>Premium Experience</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}