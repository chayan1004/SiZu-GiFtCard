import { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Star, Sparkles, Download, Mail, Copy, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function ReceiptView() {
  const [, params] = useRoute('/receipt-view/:token');
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showContent, setShowContent] = useState(false);

  const { data: receipt, isLoading, error } = useQuery({
    queryKey: [`/api/receipts/${params?.token}`],
    enabled: !!params?.token,
  });

  useEffect(() => {
    if (receipt) {
      setTimeout(() => setShowContent(true), 500);
    }
  }, [receipt]);

  const handleCopyCode = () => {
    if (receipt?.receiptData?.giftCardCode) {
      navigator.clipboard.writeText(receipt.receiptData.giftCardCode);
      setCopied(true);
      toast({
        title: "Code Copied!",
        description: "Gift card code copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadReceipt = () => {
    window.open(`/api/receipts/${params?.token}/pdf`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-12 h-12 text-white" />
        </motion.div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-white mb-4">Receipt Not Found</h1>
          <p className="text-gray-300">This receipt may have expired or doesn't exist.</p>
        </motion.div>
      </div>
    );
  }

  const { receiptData } = receipt;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            initial={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              scale: 0,
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          >
            <Sparkles className="w-4 h-4 text-white/20" />
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <AnimatePresence>
          {showContent && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-2xl mx-auto"
            >
              {/* Logo and Brand */}
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="text-center mb-8"
              >
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Gift className="w-10 h-10 text-white" />
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    SiZu GiftCard
                  </h1>
                </div>
                <p className="text-gray-300">Premium Digital Gift Experience</p>
              </motion.div>

              {/* Main Receipt Card */}
              <motion.div
                initial={{ rotateY: 90 }}
                animate={{ rotateY: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
                  <CardContent className="p-8">
                    {/* Gift Card Design Preview */}
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className={`rounded-2xl p-8 mb-8 relative overflow-hidden ${
                        receiptData.design === 'premium' 
                          ? 'bg-gradient-to-br from-purple-600 to-pink-600'
                          : receiptData.design === 'love'
                          ? 'bg-gradient-to-br from-red-500 to-pink-500'
                          : 'bg-gradient-to-br from-blue-600 to-cyan-600'
                      }`}
                    >
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-white/20 text-white border-white/40">
                          {receiptData.design.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="text-white space-y-4">
                        <div className="flex items-center gap-2">
                          <Gift className="w-8 h-8" />
                          <span className="text-2xl font-bold">Digital Gift Card</span>
                        </div>
                        
                        <div className="text-5xl font-bold">
                          ${parseFloat(receiptData.amount).toFixed(2)}
                        </div>
                        
                        {receiptData.customMessage && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="italic text-white/90"
                          >
                            "{receiptData.customMessage}"
                          </motion.div>
                        )}
                      </div>

                      {/* Animated stars */}
                      <div className="absolute -top-4 -right-4 opacity-20">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        >
                          <Star className="w-32 h-32" />
                        </motion.div>
                      </div>
                    </motion.div>

                    {/* Gift Card Details */}
                    <div className="space-y-6">
                      <motion.div
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="bg-white/5 rounded-lg p-6 space-y-4"
                      >
                        <h3 className="text-xl font-bold text-white mb-4">Gift Card Details</h3>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Code:</span>
                          <div className="flex items-center gap-2">
                            <Badge 
                              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-mono text-lg px-4 py-2 cursor-pointer"
                              onClick={handleCopyCode}
                            >
                              {receiptData.giftCardCode}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCopyCode}
                              className="text-white hover:bg-white/10"
                            >
                              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>

                        {receiptData.recipientName && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">To:</span>
                            <span className="text-white font-semibold">{receiptData.recipientName}</span>
                          </div>
                        )}

                        {receiptData.senderName && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">From:</span>
                            <span className="text-white font-semibold">{receiptData.senderName}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Date:</span>
                          <span className="text-white">
                            {new Date(receiptData.timestamp).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </motion.div>

                      {/* QR Code */}
                      {receipt.qrCode && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", delay: 1 }}
                          className="flex justify-center"
                        >
                          <div className="bg-white p-4 rounded-xl shadow-2xl">
                            <img 
                              src={receipt.qrCode} 
                              alt="QR Code" 
                              className="w-40 h-40"
                            />
                            <p className="text-gray-600 text-sm mt-2 text-center">Scan for digital receipt</p>
                          </div>
                        </motion.div>
                      )}

                      {/* Actions */}
                      <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        className="flex gap-4"
                      >
                        <Button 
                          onClick={handleDownloadReceipt}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 transition-opacity"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF Receipt
                        </Button>
                        
                        {receiptData.recipientEmail && (
                          <Button 
                            variant="outline"
                            className="flex-1 border-white/20 text-white hover:bg-white/10"
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Email Sent
                          </Button>
                        )}
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
                className="text-center mt-8 text-gray-400"
              >
                <p>Thank you for choosing SiZu GiftCard</p>
                <p className="text-sm mt-2">Your premium gift experience</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}