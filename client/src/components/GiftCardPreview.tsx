import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Heart, Sparkles } from "lucide-react";

interface GiftCardPreviewProps {
  design: string;
  amount: number;
  customMessage?: string;
  recipientName?: string;
  senderName?: string;
}

export default function GiftCardPreview({ 
  design, 
  amount, 
  customMessage, 
  recipientName, 
  senderName 
}: GiftCardPreviewProps) {
  const getDesignConfig = (design: string) => {
    switch (design) {
      case 'love':
        return {
          gradient: 'from-emerald-500 to-blue-500',
          icon: <Heart className="w-6 h-6" />,
          name: 'Love Edition'
        };
      case 'premium':
        return {
          gradient: 'from-purple-500 to-pink-500',
          icon: <Sparkles className="w-6 h-6" />,
          name: 'Premium Edition'
        };
      default:
        return {
          gradient: 'from-purple-500 to-blue-500',
          icon: <CreditCard className="w-6 h-6" />,
          name: 'Classic Design'
        };
    }
  };

  const config = getDesignConfig(design);

  return (
    <Card className="relative overflow-hidden">
      <div className={`h-64 bg-gradient-to-br ${config.gradient} p-6 flex flex-col justify-between text-white`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {config.icon}
            <span className="font-semibold">SiZu GiftCard</span>
          </div>
          <div className="text-right">
            <div className="text-xs opacity-80">{config.name}</div>
          </div>
        </div>

        {/* Amount */}
        <div className="text-center">
          <div className="text-4xl font-bold mb-2">
            ${amount.toFixed(2)}
          </div>
          <div className="text-sm opacity-80">Gift Card Value</div>
        </div>

        {/* Footer */}
        <div className="space-y-2">
          {customMessage && (
            <div className="text-sm text-center italic opacity-90">
              "{customMessage}"
            </div>
          )}
          <div className="flex justify-between text-sm">
            {recipientName && (
              <div>
                <span className="opacity-80">To: </span>
                <span className="font-semibold">{recipientName}</span>
              </div>
            )}
            {senderName && (
              <div>
                <span className="opacity-80">From: </span>
                <span className="font-semibold">{senderName}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
