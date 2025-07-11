import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, LogIn, UserPlus, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerFirstName, setRegisterFirstName] = useState("");
  const [registerLastName, setRegisterLastName] = useState("");
  
  const { login, register, isLoading } = useCustomerAuth();
  const { toast } = useToast();

  const handleAdminLogin = () => {
    window.location.href = '/api/login';
  };

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(loginEmail, loginPassword);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(registerEmail, registerPassword, registerFirstName, registerLastName);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Tabs defaultValue="customer" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="customer">Customer Login</TabsTrigger>
            <TabsTrigger value="admin">Admin Login</TabsTrigger>
          </TabsList>
          
          <TabsContent value="customer">
            <Card className="bg-slate-800/50 backdrop-blur-lg border-slate-700">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-primary/20 p-3 rounded-full">
                    <CreditCard className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl text-white">Customer Portal</CardTitle>
                <CardDescription className="text-gray-300">
                  Access your gift cards and orders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login">
                    <form onSubmit={handleCustomerLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-white">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                          className="bg-slate-700 border-slate-600 text-white"
                          placeholder="Enter your email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-white">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                          className="bg-slate-700 border-slate-600 text-white"
                          placeholder="Enter your password"
                        />
                      </div>
                      <Button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-primary/90 text-white"
                      >
                        <LogIn className="mr-2 h-4 w-4" />
                        {isLoading ? "Logging in..." : "Login"}
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="register">
                    <form onSubmit={handleCustomerRegister} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-white">First Name</Label>
                          <Input
                            id="firstName"
                            value={registerFirstName}
                            onChange={(e) => setRegisterFirstName(e.target.value)}
                            required
                            className="bg-slate-700 border-slate-600 text-white"
                            placeholder="First name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-white">Last Name</Label>
                          <Input
                            id="lastName"
                            value={registerLastName}
                            onChange={(e) => setRegisterLastName(e.target.value)}
                            required
                            className="bg-slate-700 border-slate-600 text-white"
                            placeholder="Last name"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="registerEmail" className="text-white">Email</Label>
                        <Input
                          id="registerEmail"
                          type="email"
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          required
                          className="bg-slate-700 border-slate-600 text-white"
                          placeholder="Enter your email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="registerPassword" className="text-white">Password</Label>
                        <Input
                          id="registerPassword"
                          type="password"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          required
                          className="bg-slate-700 border-slate-600 text-white"
                          placeholder="Create a password"
                        />
                      </div>
                      <Button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        {isLoading ? "Creating account..." : "Create Account"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="admin">
            <Card className="bg-slate-800/50 backdrop-blur-lg border-slate-700">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-orange-500/20 p-3 rounded-full">
                    <Shield className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
                <CardTitle className="text-2xl text-white">Admin Portal</CardTitle>
                <CardDescription className="text-gray-300">
                  Secure access for platform administration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleAdminLogin}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  size="lg"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Login with Replit
                </Button>
                <p className="text-center text-sm text-gray-400 mt-4">
                  Secure authentication powered by Replit
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}