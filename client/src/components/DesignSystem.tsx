import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Design System Components based on Landing page

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900", className)}>
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  gradient?: boolean;
}

export function PageHeader({ title, subtitle, children, gradient = true }: PageHeaderProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="text-center mb-8 sm:mb-12"
    >
      <h1 className={cn(
        "text-4xl md:text-6xl font-bold mb-6",
        gradient ? "text-gradient" : "text-white"
      )}>
        {title}
      </h1>
      {subtitle && (
        <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
          {subtitle}
        </p>
      )}
      {children}
    </motion.div>
  );
}

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function GlassCard({ children, className, hover = true, onClick }: GlassCardProps) {
  return (
    <Card 
      className={cn(
        "glassmorphism border-white/20 backdrop-blur-lg",
        hover && "hover:scale-105 transition-transform duration-300 cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </Card>
  );
}

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  iconColor: string;
  onClick?: () => void;
  delay?: number;
}

export function FeatureCard({ icon, title, description, iconColor, onClick, delay = 0 }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay }}
      className="w-full"
    >
      <GlassCard onClick={onClick}>
        <CardContent className="p-6 text-center">
          <div className={cn("w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center", iconColor)}>
            {icon}
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
          <p className="text-gray-400 text-sm">{description}</p>
        </CardContent>
      </GlassCard>
    </motion.div>
  );
}

interface SectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  background?: 'default' | 'transparent' | 'dark';
}

export function Section({ title, subtitle, children, className, background = 'default' }: SectionProps) {
  const bgClass = {
    default: 'py-16 px-4 sm:px-6 lg:px-8',
    transparent: 'py-16 px-4 sm:px-6 lg:px-8',
    dark: 'py-16 px-4 sm:px-6 lg:px-8 bg-black/20'
  }[background];

  return (
    <section className={cn(bgClass, className)}>
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </motion.div>
        {children}
      </div>
    </section>
  );
}

interface AnimatedCardProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function AnimatedCard({ children, delay = 0, className }: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface GradientButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
  disabled?: boolean;
}

export function GradientButton({ children, onClick, variant = 'primary', className, disabled }: GradientButtonProps) {
  const variants = {
    primary: "gradient-primary text-white hover:opacity-90 neon-glow",
    secondary: "gradient-secondary text-white hover:opacity-90",
    outline: "glassmorphism text-white border-white/20 hover:bg-white/10"
  };

  return (
    <Button 
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-8 py-4 text-lg font-semibold hover:scale-105 transition-transform duration-300",
        variants[variant],
        className
      )}
    >
      {children}
    </Button>
  );
}

interface StatCardProps {
  icon: ReactNode;
  title: string;
  value: string;
  subtitle?: string;
  color: string;
  delay?: number;
}

export function StatCard({ icon, title, value, subtitle, color, delay = 0 }: StatCardProps) {
  return (
    <AnimatedCard delay={delay}>
      <GlassCard>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", color)}>
              {icon}
            </div>
            <Badge variant="outline" className="text-gray-300 border-gray-600">
              {title}
            </Badge>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{value}</div>
          {subtitle && <div className="text-sm text-gray-400">{subtitle}</div>}
        </CardContent>
      </GlassCard>
    </AnimatedCard>
  );
}

interface FormContainerProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function FormContainer({ children, title, description }: FormContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="max-w-2xl mx-auto"
    >
      <div className="glassmorphism border-white/20 rounded-xl overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center mr-4">
              <div className="w-5 h-5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{title}</h2>
              {description && (
                <p className="text-sm text-gray-300 mt-1">{description}</p>
              )}
            </div>
          </div>
          <div className="space-y-4">
            {children}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Loading Components
export function LoadingSpinner({ size = 'default' }: { size?: 'sm' | 'default' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    default: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={cn("loading-shimmer rounded-full animate-spin", sizeClasses[size])} />
  );
}

export function LoadingPage() {
  return (
    <PageContainer>
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    </PageContainer>
  );
}

// Empty State Component
interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 bg-gray-600/20 rounded-2xl flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 mb-6">{description}</p>
      {action && (
        <GradientButton onClick={action.onClick}>
          {action.label}
        </GradientButton>
      )}
    </div>
  );
}