import { motion } from 'framer-motion';
import { Gift, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GiftCardPreviewProps {
  amount: number;
  design: string;
  recipientName?: string;
  senderName?: string;
  customMessage?: string;
  code?: string;
  primaryColor?: string;
  secondaryColor?: string;
  pattern?: string;
  animation?: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showCode?: boolean;
}

// Design configurations
const designConfigs: Record<string, { gradient: string; icon?: any; features?: string[] }> = {
  'classic': {
    gradient: 'from-green-400 to-blue-500',
    features: ['Timeless design', 'Universal appeal']
  },
  'love': {
    gradient: 'from-pink-500 to-red-500',
    features: ['Perfect for couples', 'Romantic theme']
  },
  'premium': {
    gradient: 'from-purple-600 to-pink-600',
    features: ['Luxury experience', 'VIP treatment']
  },
  'modern-gradient': {
    gradient: 'from-purple-600 to-pink-600',
    features: ['Contemporary style', 'Vibrant colors']
  },
  'love-romance': {
    gradient: 'from-pink-500 to-red-500',
    features: ['Heart designs', 'Love messages']
  },
  'elegant-gold': {
    gradient: 'from-yellow-600 to-amber-500',
    features: ['Gold accents', 'Premium feel']
  },
  'cosmic-night': {
    gradient: 'from-indigo-600 to-purple-800',
    features: ['Space theme', 'Mystical design']
  },
  'nature-green': {
    gradient: 'from-green-500 to-emerald-600',
    features: ['Eco-friendly', 'Natural vibes']
  },
  'ocean-blue': {
    gradient: 'from-blue-500 to-cyan-600',
    features: ['Ocean waves', 'Calming effect']
  },
  'sunset-orange': {
    gradient: 'from-orange-500 to-red-600',
    features: ['Warm colors', 'Sunset theme']
  }
};

export default function GiftCardPreview({
  amount,
  design = 'classic',
  recipientName,
  senderName,
  customMessage,
  code,
  primaryColor,
  secondaryColor,
  pattern = 'none',
  animation = 'none',
  className = '',
  size = 'medium',
  showCode = true
}: GiftCardPreviewProps) {
  
  // Size configurations
  const sizeClasses = {
    small: 'w-64 h-40',
    medium: 'w-80 h-48',
    large: 'w-96 h-56'
  };

  const fontSizes = {
    small: {
      amount: 'text-2xl',
      title: 'text-xs',
      message: 'text-xs',
      code: 'text-xs'
    },
    medium: {
      amount: 'text-3xl',
      title: 'text-sm',
      message: 'text-sm',
      code: 'text-sm'
    },
    large: {
      amount: 'text-4xl',
      title: 'text-base',
      message: 'text-base',
      code: 'text-base'
    }
  };

  const designConfig = designConfigs[design] || designConfigs['classic'];
  const hasCustomColors = primaryColor && secondaryColor;
  
  // Build gradient style
  const gradientStyle = hasCustomColors
    ? { background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }
    : {};

  // Animation classes
  const animationClasses = {
    'float': 'animate-float',
    'pulse': 'animate-pulse',
    'shimmer': 'animate-shimmer',
    'glow': 'animate-glow',
    'bounce': 'animate-bounce',
    'wave': 'animate-wave',
    'twinkle': 'animate-twinkle',
    'rotate': 'animate-rotate-slow',
    'none': ''
  };

  // Pattern classes
  const patternClasses = {
    'dots': 'pattern-dots',
    'lines': 'pattern-lines',
    'waves': 'pattern-waves',
    'hearts': 'pattern-hearts',
    'stars': 'pattern-stars',
    'confetti': 'pattern-confetti',
    'gradient': '',
    'none': ''
  };

  const animationClass = animationClasses[animation] || '';
  const patternClass = patternClasses[pattern] || '';

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={cn(
        'relative rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300',
        sizeClasses[size],
        animationClass,
        className
      )}
    >
      {/* Background with pattern */}
      <div 
        className={cn(
          'absolute inset-0 bg-gradient-to-br',
          !hasCustomColors && designConfig.gradient,
          patternClass
        )}
        style={gradientStyle}
      />

      {/* Glossy overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      
      {/* Content */}
      <div className="relative z-10 p-6 h-full flex flex-col justify-between text-white">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className={cn('font-bold uppercase tracking-wider opacity-80', fontSizes[size].title)}>
              Gift Card
            </h3>
            <p className={cn('font-bold mt-1', fontSizes[size].amount)}>
              ${amount.toFixed(2)}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Gift className="w-5 h-5 opacity-80" />
            <Sparkles className="w-4 h-4 opacity-60" />
          </div>
        </div>

        {/* Middle section with recipient/message */}
        {(recipientName || customMessage) && (
          <div className="my-4">
            {recipientName && (
              <p className={cn('opacity-90', fontSizes[size].message)}>
                To: {recipientName}
              </p>
            )}
            {senderName && (
              <p className={cn('opacity-80', fontSizes[size].message)}>
                From: {senderName}
              </p>
            )}
            {customMessage && (
              <div className="mt-2 p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                <p className={cn('', fontSizes[size].message)}>
                  {customMessage}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer with code */}
        {showCode && (
          <div className="flex justify-between items-end">
            <div>
              <p className={cn('opacity-60', fontSizes[size].code)}>
                Gift Card Code
              </p>
              <p className={cn('font-mono', fontSizes[size].code)}>
                {code || 'XXXX-XXXX-XXXX'}
              </p>
            </div>
            <div className="text-right">
              <p className={cn('opacity-60', fontSizes[size].code)}>
                Valid Until
              </p>
              <p className={fontSizes[size].code}>No Expiry</p>
            </div>
          </div>
        )}
      </div>

      {/* Shine effect on hover */}
      <div className="absolute inset-0 opacity-0 hover:opacity-20 transition-opacity duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent -skew-x-12 animate-shimmer" />
      </div>
    </motion.div>
  );
}