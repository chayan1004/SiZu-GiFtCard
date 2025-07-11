import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion } from "framer-motion";
import { Settings, Globe, Shield, Mail, Database, CreditCard, AlertCircle, Save, RefreshCw } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import SideNavigation from "@/components/SideNavigation";

interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    contactEmail: string;
    supportEmail: string;
    logoUrl: string;
    timezone: string;
    currency: string;
    dateFormat: string;
  };
  giftCards: {
    minAmount: number;
    maxAmount: number;
    expiryDays: number;
    codeLength: number;
    codePrefix: string;
    allowCustomAmounts: boolean;
    requireRecipientEmail: boolean;
    sendEmailOnPurchase: boolean;
    sendEmailOnRedemption: boolean;
  };
  security: {
    requireEmailVerification: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireNumbers: boolean;
    passwordRequireSpecialChars: boolean;
    enable2FA: boolean;
    allowedDomains: string[];
  };
  payments: {
    acceptCreditCards: boolean;
    acceptApplePay: boolean;
    acceptGooglePay: boolean;
    acceptCashApp: boolean;
    acceptAfterpayClearpay: boolean;
    transactionFeePercent: number;
    transactionFeeFixed: number;
    refundPolicy: string;
    statementDescriptor: string;
  };
  email: {
    fromName: string;
    fromEmail: string;
    replyToEmail: string;
    smtpHost: string;
    smtpPort: number;
    smtpSecure: boolean;
    smtpUsername: string;
    emailFooter: string;
  };
  maintenance: {
    maintenanceMode: boolean;
    maintenanceMessage: string;
    allowedIPs: string[];
    scheduledMaintenanceStart?: string;
    scheduledMaintenanceEnd?: string;
  };
}

const DEFAULT_SETTINGS: SystemSettings = {
  general: {
    siteName: 'Gift Card Platform',
    siteDescription: 'Send digital gift cards instantly',
    contactEmail: 'contact@sizugiftcard.com',
    supportEmail: 'support@sizugiftcard.com',
    logoUrl: '/logo.png',
    timezone: 'America/New_York',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY'
  },
  giftCards: {
    minAmount: 10,
    maxAmount: 1000,
    expiryDays: 365,
    codeLength: 16,
    codePrefix: 'GC',
    allowCustomAmounts: true,
    requireRecipientEmail: false,
    sendEmailOnPurchase: true,
    sendEmailOnRedemption: true
  },
  security: {
    requireEmailVerification: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    lockoutDuration: 30,
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: false,
    enable2FA: false,
    allowedDomains: []
  },
  payments: {
    acceptCreditCards: true,
    acceptApplePay: true,
    acceptGooglePay: true,
    acceptCashApp: true,
    acceptAfterpayClearpay: false,
    transactionFeePercent: 2.9,
    transactionFeeFixed: 0.30,
    refundPolicy: 'Refunds are processed within 5-10 business days.',
    statementDescriptor: 'GIFT CARD'
  },
  email: {
    fromName: 'Gift Card Platform',
    fromEmail: 'noreply@sizugiftcard.com',
    replyToEmail: 'support@sizugiftcard.com',
    smtpHost: 'smtp.mailgun.org',
    smtpPort: 587,
    smtpSecure: false,
    smtpUsername: '',
    emailFooter: '© 2025 Gift Card Platform. All rights reserved.'
  },
  maintenance: {
    maintenanceMode: false,
    maintenanceMessage: 'We are currently performing scheduled maintenance. Please check back soon.',
    allowedIPs: []
  }
};

export default function AdminSystemSettings() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      window.location.href = "/api/login";
    }
  }, [isAuthenticated, isLoading, user]);

  // Fetch settings
  const { data: fetchedSettings, isLoading: settingsLoading } = useQuery<SystemSettings>({
    queryKey: ['/api/system-settings'],
    enabled: isAuthenticated && user?.role === 'admin',
    retry: false
  });

  useEffect(() => {
    if (fetchedSettings) {
      setSettings(fetchedSettings);
    }
  }, [fetchedSettings]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('/api/system-settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "System settings have been updated successfully."
      });
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['/api/system-settings'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Test email mutation
  const testEmailMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('/api/admin/settings/test-email', {
        method: 'POST',
        body: JSON.stringify({
          email: user?.email || settings.general.contactEmail
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Test Email Sent",
        description: "A test email has been sent to your email address."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send test email. Please check your SMTP settings.",
        variant: "destructive"
      });
    }
  });

  const handleLogout = () => {
    toast({
      title: "Logging out...",
      description: "You will be redirected to the login page.",
    });
    setTimeout(() => {
      window.location.href = '/api/logout';
    }, 1000);
  };

  const updateSettings = (section: keyof SystemSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <div className="w-64 flex-shrink-0">
        <SideNavigation user={user} onLogout={handleLogout} isAdmin={true} />
      </div>
      
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 flex justify-between items-center"
          >
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">System Settings</h1>
              <p className="text-gray-400">Configure global platform settings</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                onClick={resetSettings}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset to Default
              </Button>
              <Button
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => saveSettingsMutation.mutate()}
                disabled={!hasChanges || saveSettingsMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {saveSettingsMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </motion.div>

          {hasChanges && (
            <Alert className="mb-6 bg-yellow-900 border-yellow-700">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-200">
                You have unsaved changes. Don't forget to save before leaving this page.
              </AlertDescription>
            </Alert>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Tabs defaultValue="general" className="space-y-6">
              <TabsList className="bg-gray-800 border-gray-700">
                <TabsTrigger value="general" className="data-[state=active]:bg-purple-600">
                  <Globe className="w-4 h-4 mr-2" />
                  General
                </TabsTrigger>
                <TabsTrigger value="giftcards" className="data-[state=active]:bg-purple-600">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Gift Cards
                </TabsTrigger>
                <TabsTrigger value="security" className="data-[state=active]:bg-purple-600">
                  <Shield className="w-4 h-4 mr-2" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="payments" className="data-[state=active]:bg-purple-600">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Payments
                </TabsTrigger>
                <TabsTrigger value="email" className="data-[state=active]:bg-purple-600">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="maintenance" className="data-[state=active]:bg-purple-600">
                  <Settings className="w-4 h-4 mr-2" />
                  Maintenance
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">General Settings</CardTitle>
                    <CardDescription className="text-gray-400">
                      Basic platform configuration
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">Site Name</Label>
                        <Input
                          value={settings.general.siteName}
                          onChange={(e) => updateSettings('general', 'siteName', e.target.value)}
                          className="bg-gray-900 border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Contact Email</Label>
                        <Input
                          type="email"
                          value={settings.general.contactEmail}
                          onChange={(e) => updateSettings('general', 'contactEmail', e.target.value)}
                          className="bg-gray-900 border-gray-700 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-300">Site Description</Label>
                      <Textarea
                        value={settings.general.siteDescription}
                        onChange={(e) => updateSettings('general', 'siteDescription', e.target.value)}
                        className="bg-gray-900 border-gray-700 text-white"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">Support Email</Label>
                        <Input
                          type="email"
                          value={settings.general.supportEmail}
                          onChange={(e) => updateSettings('general', 'supportEmail', e.target.value)}
                          className="bg-gray-900 border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Logo URL</Label>
                        <Input
                          value={settings.general.logoUrl}
                          onChange={(e) => updateSettings('general', 'logoUrl', e.target.value)}
                          className="bg-gray-900 border-gray-700 text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-gray-300">Timezone</Label>
                        <Select 
                          value={settings.general.timezone} 
                          onValueChange={(v) => updateSettings('general', 'timezone', v)}
                        >
                          <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="America/New_York">Eastern Time</SelectItem>
                            <SelectItem value="America/Chicago">Central Time</SelectItem>
                            <SelectItem value="America/Denver">Mountain Time</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                            <SelectItem value="UTC">UTC</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-gray-300">Currency</Label>
                        <Select 
                          value={settings.general.currency} 
                          onValueChange={(v) => updateSettings('general', 'currency', v)}
                        >
                          <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                            <SelectItem value="CAD">CAD ($)</SelectItem>
                            <SelectItem value="AUD">AUD ($)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-gray-300">Date Format</Label>
                        <Select 
                          value={settings.general.dateFormat} 
                          onValueChange={(v) => updateSettings('general', 'dateFormat', v)}
                        >
                          <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                            <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                            <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="giftcards">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Gift Card Settings</CardTitle>
                    <CardDescription className="text-gray-400">
                      Configure gift card behavior and limits
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">Minimum Amount</Label>
                        <Input
                          type="number"
                          value={settings.giftCards.minAmount}
                          onChange={(e) => updateSettings('giftCards', 'minAmount', parseInt(e.target.value) || 10)}
                          className="bg-gray-900 border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Maximum Amount</Label>
                        <Input
                          type="number"
                          value={settings.giftCards.maxAmount}
                          onChange={(e) => updateSettings('giftCards', 'maxAmount', parseInt(e.target.value) || 1000)}
                          className="bg-gray-900 border-gray-700 text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-gray-300">Expiry Days</Label>
                        <Input
                          type="number"
                          value={settings.giftCards.expiryDays}
                          onChange={(e) => updateSettings('giftCards', 'expiryDays', parseInt(e.target.value) || 365)}
                          className="bg-gray-900 border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Code Length</Label>
                        <Input
                          type="number"
                          value={settings.giftCards.codeLength}
                          onChange={(e) => updateSettings('giftCards', 'codeLength', parseInt(e.target.value) || 16)}
                          className="bg-gray-900 border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Code Prefix</Label>
                        <Input
                          value={settings.giftCards.codePrefix}
                          onChange={(e) => updateSettings('giftCards', 'codePrefix', e.target.value)}
                          className="bg-gray-900 border-gray-700 text-white"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-300">Allow Custom Amounts</Label>
                        <Switch
                          checked={settings.giftCards.allowCustomAmounts}
                          onCheckedChange={(checked) => updateSettings('giftCards', 'allowCustomAmounts', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-300">Require Recipient Email</Label>
                        <Switch
                          checked={settings.giftCards.requireRecipientEmail}
                          onCheckedChange={(checked) => updateSettings('giftCards', 'requireRecipientEmail', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-300">Send Email on Purchase</Label>
                        <Switch
                          checked={settings.giftCards.sendEmailOnPurchase}
                          onCheckedChange={(checked) => updateSettings('giftCards', 'sendEmailOnPurchase', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-300">Send Email on Redemption</Label>
                        <Switch
                          checked={settings.giftCards.sendEmailOnRedemption}
                          onCheckedChange={(checked) => updateSettings('giftCards', 'sendEmailOnRedemption', checked)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Security Settings</CardTitle>
                    <CardDescription className="text-gray-400">
                      Configure security and authentication options
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">Session Timeout (minutes)</Label>
                        <Input
                          type="number"
                          value={settings.security.sessionTimeout}
                          onChange={(e) => updateSettings('security', 'sessionTimeout', parseInt(e.target.value) || 30)}
                          className="bg-gray-900 border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Max Login Attempts</Label>
                        <Input
                          type="number"
                          value={settings.security.maxLoginAttempts}
                          onChange={(e) => updateSettings('security', 'maxLoginAttempts', parseInt(e.target.value) || 5)}
                          className="bg-gray-900 border-gray-700 text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">Lockout Duration (minutes)</Label>
                        <Input
                          type="number"
                          value={settings.security.lockoutDuration}
                          onChange={(e) => updateSettings('security', 'lockoutDuration', parseInt(e.target.value) || 30)}
                          className="bg-gray-900 border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Password Min Length</Label>
                        <Input
                          type="number"
                          value={settings.security.passwordMinLength}
                          onChange={(e) => updateSettings('security', 'passwordMinLength', parseInt(e.target.value) || 8)}
                          className="bg-gray-900 border-gray-700 text-white"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-300">Require Email Verification</Label>
                        <Switch
                          checked={settings.security.requireEmailVerification}
                          onCheckedChange={(checked) => updateSettings('security', 'requireEmailVerification', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-300">Password Require Uppercase</Label>
                        <Switch
                          checked={settings.security.passwordRequireUppercase}
                          onCheckedChange={(checked) => updateSettings('security', 'passwordRequireUppercase', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-300">Password Require Numbers</Label>
                        <Switch
                          checked={settings.security.passwordRequireNumbers}
                          onCheckedChange={(checked) => updateSettings('security', 'passwordRequireNumbers', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-300">Password Require Special Characters</Label>
                        <Switch
                          checked={settings.security.passwordRequireSpecialChars}
                          onCheckedChange={(checked) => updateSettings('security', 'passwordRequireSpecialChars', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-300">Enable Two-Factor Authentication</Label>
                        <Switch
                          checked={settings.security.enable2FA}
                          onCheckedChange={(checked) => updateSettings('security', 'enable2FA', checked)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payments">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Payment Settings</CardTitle>
                    <CardDescription className="text-gray-400">
                      Configure payment methods and fees
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-white font-medium">Accepted Payment Methods</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-gray-300">Credit/Debit Cards</Label>
                          <Switch
                            checked={settings.payments.acceptCreditCards}
                            onCheckedChange={(checked) => updateSettings('payments', 'acceptCreditCards', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-gray-300">Apple Pay</Label>
                          <Switch
                            checked={settings.payments.acceptApplePay}
                            onCheckedChange={(checked) => updateSettings('payments', 'acceptApplePay', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-gray-300">Google Pay</Label>
                          <Switch
                            checked={settings.payments.acceptGooglePay}
                            onCheckedChange={(checked) => updateSettings('payments', 'acceptGooglePay', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-gray-300">Cash App</Label>
                          <Switch
                            checked={settings.payments.acceptCashApp}
                            onCheckedChange={(checked) => updateSettings('payments', 'acceptCashApp', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-gray-300">Afterpay/Clearpay</Label>
                          <Switch
                            checked={settings.payments.acceptAfterpayClearpay}
                            onCheckedChange={(checked) => updateSettings('payments', 'acceptAfterpayClearpay', checked)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">Transaction Fee (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={settings.payments.transactionFeePercent}
                          onChange={(e) => updateSettings('payments', 'transactionFeePercent', parseFloat(e.target.value) || 0)}
                          className="bg-gray-900 border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Fixed Fee ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={settings.payments.transactionFeeFixed}
                          onChange={(e) => updateSettings('payments', 'transactionFeeFixed', parseFloat(e.target.value) || 0)}
                          className="bg-gray-900 border-gray-700 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-300">Statement Descriptor</Label>
                      <Input
                        value={settings.payments.statementDescriptor}
                        onChange={(e) => updateSettings('payments', 'statementDescriptor', e.target.value)}
                        className="bg-gray-900 border-gray-700 text-white"
                        maxLength={22}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This appears on customer's bank statements (max 22 characters)
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-300">Refund Policy</Label>
                      <Textarea
                        value={settings.payments.refundPolicy}
                        onChange={(e) => updateSettings('payments', 'refundPolicy', e.target.value)}
                        className="bg-gray-900 border-gray-700 text-white"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="email">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Email Settings</CardTitle>
                    <CardDescription className="text-gray-400">
                      Configure email delivery settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">From Name</Label>
                        <Input
                          value={settings.email.fromName}
                          onChange={(e) => updateSettings('email', 'fromName', e.target.value)}
                          className="bg-gray-900 border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">From Email</Label>
                        <Input
                          type="email"
                          value={settings.email.fromEmail}
                          onChange={(e) => updateSettings('email', 'fromEmail', e.target.value)}
                          className="bg-gray-900 border-gray-700 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-300">Reply-To Email</Label>
                      <Input
                        type="email"
                        value={settings.email.replyToEmail}
                        onChange={(e) => updateSettings('email', 'replyToEmail', e.target.value)}
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">SMTP Host</Label>
                        <Input
                          value={settings.email.smtpHost}
                          onChange={(e) => updateSettings('email', 'smtpHost', e.target.value)}
                          className="bg-gray-900 border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">SMTP Port</Label>
                        <Input
                          type="number"
                          value={settings.email.smtpPort}
                          onChange={(e) => updateSettings('email', 'smtpPort', parseInt(e.target.value) || 587)}
                          className="bg-gray-900 border-gray-700 text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">SMTP Username</Label>
                        <Input
                          value={settings.email.smtpUsername}
                          onChange={(e) => updateSettings('email', 'smtpUsername', e.target.value)}
                          className="bg-gray-900 border-gray-700 text-white"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={settings.email.smtpSecure}
                            onCheckedChange={(checked) => updateSettings('email', 'smtpSecure', checked)}
                          />
                          <Label className="text-gray-300">Use TLS/SSL</Label>
                        </div>
                        <Button
                          variant="outline"
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          onClick={() => testEmailMutation.mutate()}
                          disabled={testEmailMutation.isPending}
                        >
                          Test Email
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-300">Email Footer</Label>
                      <Textarea
                        value={settings.email.emailFooter}
                        onChange={(e) => updateSettings('email', 'emailFooter', e.target.value)}
                        className="bg-gray-900 border-gray-700 text-white"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="maintenance">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Maintenance Mode</CardTitle>
                    <CardDescription className="text-gray-400">
                      Configure maintenance mode settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert className={settings.maintenance.maintenanceMode ? "bg-yellow-900 border-yellow-700" : "bg-gray-700 border-gray-600"}>
                      <AlertCircle className={`h-4 w-4 ${settings.maintenance.maintenanceMode ? "text-yellow-400" : "text-gray-400"}`} />
                      <AlertDescription className={settings.maintenance.maintenanceMode ? "text-yellow-200" : "text-gray-300"}>
                        {settings.maintenance.maintenanceMode 
                          ? "Maintenance mode is currently ACTIVE. Only allowed IPs can access the site."
                          : "Maintenance mode is currently INACTIVE. The site is accessible to all users."
                        }
                      </AlertDescription>
                    </Alert>
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-300">Enable Maintenance Mode</Label>
                      <Switch
                        checked={settings.maintenance.maintenanceMode}
                        onCheckedChange={(checked) => updateSettings('maintenance', 'maintenanceMode', checked)}
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Maintenance Message</Label>
                      <Textarea
                        value={settings.maintenance.maintenanceMessage}
                        onChange={(e) => updateSettings('maintenance', 'maintenanceMessage', e.target.value)}
                        className="bg-gray-900 border-gray-700 text-white"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Allowed IP Addresses</Label>
                      <Textarea
                        value={settings.maintenance.allowedIPs?.join('\n') || ''}
                        onChange={(e) => updateSettings('maintenance', 'allowedIPs', e.target.value.split('\n').filter(ip => ip.trim()))}
                        className="bg-gray-900 border-gray-700 text-white font-mono text-sm"
                        placeholder="One IP address per line"
                        rows={4}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter IP addresses that can access the site during maintenance (one per line)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </div>
  );
}