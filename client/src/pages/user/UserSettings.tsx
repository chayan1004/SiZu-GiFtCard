import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Settings, User, Shield, Bell, Palette, Globe } from "lucide-react";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { useToast } from "@/hooks/use-toast";

export default function UserSettings() {
  const [, setLocation] = useLocation();
  const { user } = useCustomerAuth();
  const { toast } = useToast();
  
  // Profile settings
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email, setEmail] = useState(user?.email || "");
  
  // Security settings
  const [twoFactor, setTwoFactor] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);
  
  // Preferences
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState("en");
  const [currency, setCurrency] = useState("USD");

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Profile updated",
      description: "Your profile has been successfully updated."
    });
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Password changed",
      description: "Your password has been successfully updated."
    });
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
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="bg-gray-800">
              <TabsTrigger value="profile" className="data-[state=active]:bg-gray-700">
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-gray-700">
                <Shield className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-gray-700">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="preferences" className="data-[state=active]:bg-gray-700">
                <Palette className="h-4 w-4 mr-2" />
                Preferences
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="bg-gray-700 border-gray-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="bg-gray-700 border-gray-600"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-gray-700 border-gray-600"
                        disabled
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Email cannot be changed
                      </p>
                    </div>
                    <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                      Save Changes
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-4">Change Password</h3>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div>
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          className="bg-gray-700 border-gray-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          className="bg-gray-700 border-gray-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          className="bg-gray-700 border-gray-600"
                        />
                      </div>
                      <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                        Update Password
                      </Button>
                    </form>
                  </div>

                  <div className="border-t border-gray-700 pt-6">
                    <h3 className="font-medium mb-4">Security Options</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Two-Factor Authentication</p>
                          <p className="text-sm text-gray-400">
                            Add an extra layer of security to your account
                          </p>
                        </div>
                        <Switch
                          checked={twoFactor}
                          onCheckedChange={setTwoFactor}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Login Alerts</p>
                          <p className="text-sm text-gray-400">
                            Get notified of new login attempts
                          </p>
                        </div>
                        <Switch
                          checked={loginAlerts}
                          onCheckedChange={setLoginAlerts}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Purchase Confirmations</p>
                        <p className="text-sm text-gray-400">
                          Receive emails when you purchase gift cards
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Balance Alerts</p>
                        <p className="text-sm text-gray-400">
                          Get notified when balance is low
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Expiry Reminders</p>
                        <p className="text-sm text-gray-400">
                          Remind me before gift cards expire
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Promotional Offers</p>
                        <p className="text-sm text-gray-400">
                          Receive special offers and discounts
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Display Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <select
                      id="language"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-gray-700 border-gray-600 rounded-md px-3 py-2 mt-1"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <select
                      id="currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-gray-700 border-gray-600 rounded-md px-3 py-2 mt-1"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CAD">CAD ($)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Dark Mode</p>
                      <p className="text-sm text-gray-400">
                        Use dark theme across the platform
                      </p>
                    </div>
                    <Switch
                      checked={darkMode}
                      onCheckedChange={setDarkMode}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}