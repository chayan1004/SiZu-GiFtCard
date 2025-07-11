import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, Bell, Check, Clock, Info, Gift } from "lucide-react";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { format } from "date-fns";

interface Notification {
  id: string;
  type: 'purchase' | 'redemption' | 'expiry' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export default function UserNotifications() {
  const [, setLocation] = useLocation();
  const { user } = useCustomerAuth();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  // Mock notifications - replace with real data
  const notifications: Notification[] = [
    {
      id: '1',
      type: 'purchase',
      title: 'Gift Card Purchase Successful',
      message: 'Your $50 Premium Gift Card has been successfully purchased.',
      read: false,
      createdAt: new Date()
    },
    {
      id: '2',
      type: 'expiry',
      title: 'Gift Card Expiring Soon',
      message: 'Your Birthday Gift Card (ending in 4567) will expire in 30 days.',
      read: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
    }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'purchase': return <Gift className="h-4 w-4" />;
      case 'redemption': return <Check className="h-4 w-4" />;
      case 'expiry': return <Clock className="h-4 w-4" />;
      case 'system': return <Info className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'purchase': return 'text-green-400';
      case 'redemption': return 'text-blue-400';
      case 'expiry': return 'text-yellow-400';
      case 'system': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-950 border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setLocation('/dashboard/user')}
              variant="ghost"
              size="icon"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Notifications</h1>
          </div>
          <Button variant="outline" size="sm">
            Mark All Read
          </Button>
        </div>
      </header>

      <main className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Notification Settings */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-400">Receive updates via email</p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-gray-400">Receive updates via text message</p>
                </div>
                <Switch
                  checked={smsNotifications}
                  onCheckedChange={setSmsNotifications}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notifications List */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border ${
                        notification.read ? 'bg-gray-900 border-gray-700' : 'bg-gray-800 border-gray-600'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg bg-gray-700 ${getColor(notification.type)}`}>
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium">{notification.title}</h3>
                            {!notification.read && (
                              <Badge variant="default" className="text-xs">New</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 mb-2">{notification.message}</p>
                          <p className="text-xs text-gray-500">
                            {format(notification.createdAt, 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}