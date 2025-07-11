import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, LogIn } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="w-full max-w-md bg-slate-800/50 backdrop-blur-lg border-slate-700">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/20 p-3 rounded-full">
                <CreditCard className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl text-white">Welcome to Gift Card Platform</CardTitle>
            <CardDescription className="text-gray-300">
              Login to access your dashboard and manage gift cards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleLogin}
              className="w-full bg-primary hover:bg-primary/90 text-white"
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
      </motion.div>
    </div>
  );
}