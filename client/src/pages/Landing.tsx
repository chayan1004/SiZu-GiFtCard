import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Gift, CreditCard, Scan, Shield, Sparkles, Star, Search, ArrowDownCircle, Plus, History } from "lucide-react";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import GiftCardPreview from "@/components/GiftCardPreview";

export default function Landing() {
  const [activeCard, setActiveCard] = useState(0);
  const [balanceCode, setBalanceCode] = useState('');
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemAmount, setRedeemAmount] = useState('');

  const giftCardDesigns = [
    {
      id: 'sakura-dreams',
      name: 'Sakura Dreams',
      gradient: 'bg-gradient-to-br from-pink-400 via-pink-500 to-purple-600',
      icon: <Sparkles className="w-6 h-6" />,
      amount: 50,
      description: 'Cherry blossoms dancing in moonlight - perfect for anime lovers',
      category: 'anime'
    },
    {
      id: 'neko-paradise',
      name: 'Neko Paradise',
      gradient: 'bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-600',
      icon: <Star className="w-6 h-6" />,
      amount: 100,
      description: 'Kawaii cat spirits bringing joy and fortune',
      category: 'anime'
    },
    {
      id: 'cyber-tokyo',
      name: 'Cyber Tokyo',
      gradient: 'bg-gradient-to-br from-cyan-400 via-teal-500 to-emerald-600',
      icon: <Shield className="w-6 h-6" />,
      amount: 250,
      description: 'Neon-lit streets of futuristic anime metropolis',
      category: 'anime'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % giftCardDesigns.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation onLogin={handleLogin} />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Premium Digital
              <span className="text-gradient block">Gift Cards</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              Send the perfect gift instantly. Powered by Square, secured by blockchain technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => window.location.href = '/shop'}
                className="gradient-primary text-white px-8 py-4 text-lg font-semibold hover:scale-105 transition-transform neon-glow btn-hover-lift"
              >
                Shop Gift Cards
              </Button>
              <Button 
                variant="outline" 
                className="glassmorphism text-white border-white/20 px-8 py-4 text-lg font-semibold hover:scale-105 transition-transform"
                onClick={() => window.location.href = '/balance'}
              >
                Check Balance
              </Button>
            </div>
          </motion.div>
          
          {/* Hero Cards Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {giftCardDesigns.map((design, index) => (
              <motion.div
                key={design.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className={`card-3d relative rounded-2xl border border-white/20 transform hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden ${
                  design.id === 'sakura-dreams' ? 'anime-bg-sakura anime-glow-pink' : 
                  design.id === 'neko-paradise' ? 'anime-bg-neko anime-glow-purple' : 
                  'anime-bg-cyber anime-glow-cyan'
                } ${activeCard === index ? 'animate-pulse-glow' : ''}`}
                onClick={() => setActiveCard(index)}
              >
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
                <div className="relative z-10 p-8">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-4">
                    {design.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">${design.amount}.00</h3>
                  <p className="text-white/90 text-sm drop-shadow-md">{design.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Gift Card Services
            </h2>
            <p className="text-lg text-gray-300">
              Manage your gift cards with our easy-to-use features
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Shop */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              <Card className="glassmorphism border-white/20 hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => window.location.href = '/shop'}>
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-purple-600/20 rounded-2xl flex items-center justify-center">
                    <Gift className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Shop Gift Cards</h3>
                  <p className="text-gray-400 text-sm">Browse and purchase gift cards with AI customization</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Balance Check */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Card className="glassmorphism border-white/20 hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => window.location.href = '/balance'}>
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-600/20 rounded-2xl flex items-center justify-center">
                    <Search className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Check Balance</h3>
                  <p className="text-gray-400 text-sm">Instantly check your gift card balance</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Redeem */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <Card className="glassmorphism border-white/20 hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => window.location.href = '/redeem'}>
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-pink-600/20 rounded-2xl flex items-center justify-center">
                    <ArrowDownCircle className="w-8 h-8 text-pink-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Redeem</h3>
                  <p className="text-gray-400 text-sm">Use your gift card for purchases</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recharge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Card className="glassmorphism border-white/20 hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => window.location.href = '/recharge'}>
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-600/20 rounded-2xl flex items-center justify-center">
                    <Plus className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Recharge</h3>
                  <p className="text-gray-400 text-sm">Add more funds to your gift card</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Order History Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-8 text-center"
          >
            <Button
              variant="outline"
              className="glassmorphism text-white border-white/20 px-6 py-3 hover:scale-105 transition-transform"
              onClick={() => window.location.href = '/order-history'}
            >
              <History className="w-5 h-5 mr-2" />
              View Order History
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Shop Section */}
      <section id="shop" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Gift Card Shop</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">Choose from our premium collection of digital gift cards</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {giftCardDesigns.map((design, index) => (
              <motion.div
                key={design.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="glassmorphism rounded-2xl p-6 hover:scale-105 transition-transform duration-300 card-hover-glow"
              >
                <div className={`aspect-video rounded-xl mb-6 flex items-center justify-center relative overflow-hidden ${
                  design.id === 'sakura-dreams' ? 'anime-bg-sakura anime-glow-pink' : 
                  design.id === 'neko-paradise' ? 'anime-bg-neko anime-glow-purple' : 
                  'anime-bg-cyber anime-glow-cyan'
                }`}>
                  {/* Gift card overlay content */}
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
                  <div className="text-center relative z-10 bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
                    <div className="w-12 h-12 text-white mx-auto mb-2">
                      {design.icon}
                    </div>
                    <p className="text-white font-bold text-lg">SiZu Gift Card</p>
                    <p className="text-white/80 text-sm mt-1">${design.amount}.00</p>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{design.name}</h3>
                <p className="text-gray-300 mb-4">{design.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-white">$25 - $500</span>
                  <Button 
                    onClick={handleLogin}
                    className="gradient-primary text-white px-4 py-2 hover:opacity-90 transition-opacity"
                  >
                    Customize
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Balance Check Section */}
      <section id="balance" className="py-16 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Check Your Balance</h2>
            <p className="text-xl text-gray-300">Enter your gift card code to view your current balance</p>
          </motion.div>
          
          <Card className="glassmorphism border-white/20 max-w-2xl mx-auto">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Gift Card Code</label>
                  <Input 
                    type="text" 
                    placeholder="Enter your gift card code"
                    value={balanceCode}
                    onChange={(e) => setBalanceCode(e.target.value)}
                    className="w-full bg-white/10 border-white/20 text-white placeholder-gray-400"
                  />
                </div>
                
                <Button 
                  onClick={handleLogin}
                  className="w-full gradient-primary text-white py-3 font-semibold hover:opacity-90 transition-opacity"
                >
                  Check Balance
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Redeem Section */}
      <section id="redeem" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Redeem Gift Card</h2>
            <p className="text-xl text-gray-300">Enter your code manually or scan the QR code</p>
          </motion.div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Manual Entry */}
            <Card className="glassmorphism border-white/20">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-white mb-6 text-center">Manual Entry</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Gift Card Code</label>
                    <Input 
                      type="text" 
                      placeholder="Enter your gift card code"
                      value={redeemCode}
                      onChange={(e) => setRedeemCode(e.target.value)}
                      className="w-full bg-white/10 border-white/20 text-white placeholder-gray-400"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Amount to Redeem</label>
                    <Input 
                      type="number" 
                      placeholder="Enter amount"
                      value={redeemAmount}
                      onChange={(e) => setRedeemAmount(e.target.value)}
                      className="w-full bg-white/10 border-white/20 text-white placeholder-gray-400"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleLogin}
                    className="w-full gradient-primary text-white py-3 font-semibold hover:opacity-90 transition-opacity"
                  >
                    Redeem Now
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* QR Code Scanner */}
            <Card className="glassmorphism border-white/20">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-white mb-6 text-center">QR Code Scanner</h3>
                <div className="text-center">
                  <div className="w-64 h-64 bg-white/10 border-2 border-dashed border-white/30 rounded-lg flex items-center justify-center mx-auto mb-6">
                    <div className="text-center">
                      <Scan className="w-16 h-16 text-white mx-auto mb-4" />
                      <p className="text-white">Point camera at QR code</p>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleLogin}
                    className="gradient-primary text-white px-8 py-3 font-semibold hover:opacity-90 transition-opacity"
                  >
                    Start Camera
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Why Choose SiZu GiftCard?</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">Premium features for the ultimate gift card experience</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Secure & Trusted",
                description: "Powered by Square API with bank-level security"
              },
              {
                icon: <Sparkles className="w-8 h-8" />,
                title: "Instant Delivery",
                description: "Digital gift cards delivered instantly via email"
              },
              {
                icon: <Star className="w-8 h-8" />,
                title: "Premium Design",
                description: "Beautiful, customizable designs for any occasion"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="glassmorphism rounded-2xl p-8 text-center hover:scale-105 transition-transform duration-300 card-hover-glow"
              >
                <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">SiZu GiftCard</span>
              </div>
              <p className="text-gray-400 text-sm">Premium digital gift cards powered by Square API</p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#shop" className="hover:text-white transition-colors">Gift Cards</a></li>
                <li><a href="#balance" className="hover:text-white transition-colors">Balance Check</a></li>
                <li><a href="#redeem" className="hover:text-white transition-colors">Redeem</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms & Conditions</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Security</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Fraud Protection</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-white/10 text-center">
            <p className="text-gray-400 text-sm">© 2024 SiZu GiftCard. All rights reserved. Powered by Square.</p>
          </div>
        </div>
      </footer>

      {/* Floating Action Button */}
      <Button 
        onClick={handleLogin}
        className="fixed bottom-8 right-8 w-16 h-16 gradient-primary rounded-full shadow-lg hover:scale-110 transition-transform neon-glow"
      >
        <Gift className="w-8 h-8 text-white" />
      </Button>
    </div>
  );
}
