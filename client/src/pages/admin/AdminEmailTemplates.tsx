import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { Mail, Code, Eye, Save, RotateCcw, FileText, Send, Gift } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import SideNavigation from "@/components/SideNavigation";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  type: 'purchase' | 'redemption' | 'recharge' | 'gift' | 'otp';
  enabled: boolean;
  variables: string[];
  updatedAt: string;
}

const DEFAULT_TEMPLATES = {
  purchase: {
    name: 'Gift Card Purchase',
    subject: 'Your Gift Card Purchase - {{amount}}',
    variables: ['recipientName', 'amount', 'code', 'senderName', 'message', 'expiryDate'],
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f5f5f5; padding: 30px; }
    .gift-card { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; }
    .code { font-size: 24px; font-weight: bold; color: #764ba2; letter-spacing: 2px; }
    .button { display: inline-block; background: #764ba2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Gift Card Received!</h1>
    </div>
    <div class="content">
      <p>Hi {{recipientName}},</p>
      <p>Great news! You've received a gift card worth <strong>{{amount}}</strong>!</p>
      <div class="gift-card">
        <h2>Your Gift Card Code</h2>
        <div class="code">{{code}}</div>
        <p>Valid until: {{expiryDate}}</p>
      </div>
      {{#if message}}
      <p><strong>Message from {{senderName}}:</strong></p>
      <p style="font-style: italic;">{{message}}</p>
      {{/if}}
      <center>
        <a href="https://sizugiftcard.com/redeem" class="button">Redeem Now</a>
      </center>
    </div>
  </div>
</body>
</html>`,
    textContent: `Gift Card Received!

Hi {{recipientName}},

Great news! You've received a gift card worth {{amount}}!

Your Gift Card Code: {{code}}
Valid until: {{expiryDate}}

{{#if message}}
Message from {{senderName}}:
{{message}}
{{/if}}

Redeem your gift card at: https://sizugiftcard.com/redeem`
  },
  redemption: {
    name: 'Gift Card Redemption',
    subject: 'Gift Card Redeemed - {{amount}}',
    variables: ['recipientName', 'amount', 'remainingBalance', 'code', 'transactionId'],
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4ade80; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f5f5f5; padding: 30px; }
    .transaction { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Redemption Successful!</h1>
    </div>
    <div class="content">
      <p>Hi {{recipientName}},</p>
      <p>Your gift card redemption has been processed successfully.</p>
      <div class="transaction">
        <h3>Transaction Details</h3>
        <p><strong>Amount Redeemed:</strong> {{amount}}</p>
        <p><strong>Remaining Balance:</strong> {{remainingBalance}}</p>
        <p><strong>Gift Card:</strong> {{code}}</p>
        <p><strong>Transaction ID:</strong> {{transactionId}}</p>
      </div>
    </div>
  </div>
</body>
</html>`,
    textContent: `Redemption Successful!

Hi {{recipientName}},

Your gift card redemption has been processed successfully.

Transaction Details:
- Amount Redeemed: {{amount}}
- Remaining Balance: {{remainingBalance}}
- Gift Card: {{code}}
- Transaction ID: {{transactionId}}`
  },
  otp: {
    name: 'OTP Verification',
    subject: 'Your Verification Code: {{otp}}',
    variables: ['otp', 'expiryMinutes'],
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3b82f6; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f5f5f5; padding: 30px; text-align: center; }
    .otp-box { background: white; padding: 30px; border-radius: 10px; margin: 20px 0; }
    .otp-code { font-size: 36px; font-weight: bold; color: #3b82f6; letter-spacing: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Verification Code</h1>
    </div>
    <div class="content">
      <p>Your verification code is:</p>
      <div class="otp-box">
        <div class="otp-code">{{otp}}</div>
      </div>
      <p>This code will expire in {{expiryMinutes}} minutes.</p>
      <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
    </div>
  </div>
</body>
</html>`,
    textContent: `Your verification code is: {{otp}}

This code will expire in {{expiryMinutes}} minutes.

If you didn't request this code, please ignore this email.`
  }
};

export default function AdminEmailTemplates() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [editForm, setEditForm] = useState({
    subject: '',
    htmlContent: '',
    textContent: ''
  });
  const [testEmail, setTestEmail] = useState('');

  // Check if user is admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      window.location.href = "/api/login";
    }
  }, [isAuthenticated, isLoading, user]);

  // Fetch email templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery<EmailTemplate[]>({
    queryKey: ['/api/email-templates'],
    enabled: isAuthenticated && user?.role === 'admin',
    retry: false
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiRequest(`/api/email-templates/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Template Updated",
        description: "The email template has been updated successfully."
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update template. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Toggle template mutation
  const toggleTemplateMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      await apiRequest(`/api/admin/email-templates/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled })
      });
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "The template status has been updated."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-templates'] });
    }
  });

  // Send test email mutation
  const sendTestMutation = useMutation({
    mutationFn: async ({ templateId, email }: { templateId: string; email: string }) => {
      await apiRequest(`/api/admin/email-templates/${templateId}/test`, {
        method: 'POST',
        body: JSON.stringify({ email })
      });
    },
    onSuccess: () => {
      toast({
        title: "Test Email Sent",
        description: `A test email has been sent to ${testEmail}`
      });
      setTestEmail('');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send test email. Please try again.",
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

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditForm({
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent
    });
    setIsEditDialogOpen(true);
  };

  const handleReset = (templateType: string) => {
    const defaultTemplate = DEFAULT_TEMPLATES[templateType as keyof typeof DEFAULT_TEMPLATES];
    if (defaultTemplate && selectedTemplate) {
      setEditForm({
        subject: defaultTemplate.subject,
        htmlContent: defaultTemplate.htmlContent,
        textContent: defaultTemplate.textContent
      });
    }
  };

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'purchase': return <Gift className="w-5 h-5" />;
      case 'redemption': return <FileText className="w-5 h-5" />;
      case 'otp': return <Code className="w-5 h-5" />;
      default: return <Mail className="w-5 h-5" />;
    }
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
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-white mb-2">Email Templates</h1>
            <p className="text-gray-400">Customize email templates for different events</p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Templates</p>
                    <p className="text-2xl font-bold text-white">{templates.length}</p>
                  </div>
                  <Mail className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Active Templates</p>
                    <p className="text-2xl font-bold text-green-400">
                      {templates.filter(t => t.enabled).length}
                    </p>
                  </div>
                  <Send className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Last Updated</p>
                    <p className="text-2xl font-bold text-white">Today</p>
                  </div>
                  <Save className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Templates List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Email Templates</CardTitle>
                <CardDescription className="text-gray-400">
                  Click on a template to edit its content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {templates.map((template) => (
                    <div key={template.id} className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getTemplateIcon(template.type)}
                            <h3 className="text-white font-medium">{template.name}</h3>
                            <Badge variant={template.enabled ? "default" : "secondary"}>
                              {template.enabled ? "Active" : "Disabled"}
                            </Badge>
                          </div>
                          <p className="text-gray-400 text-sm mb-2">Subject: {template.subject}</p>
                          <div className="flex flex-wrap gap-1">
                            {template.variables.map((variable) => (
                              <Badge key={variable} variant="outline" className="text-xs text-gray-300 border-gray-600">
                                {`{{${variable}}}`}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                            onClick={() => handleEdit(template)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className={template.enabled ? "border-yellow-600 text-yellow-400 hover:bg-yellow-900" : "border-green-600 text-green-400 hover:bg-green-900"}
                            onClick={() => toggleTemplateMutation.mutate({
                              id: template.id,
                              enabled: !template.enabled
                            })}
                          >
                            {template.enabled ? 'Disable' : 'Enable'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="bg-gray-800 border-gray-700 max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white">
                  Edit Template: {selectedTemplate?.name}
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  Customize the email template content
                </DialogDescription>
              </DialogHeader>
              {selectedTemplate && (
                <div className="space-y-4 mt-4">
                  <div>
                    <Label className="text-gray-300">Subject</Label>
                    <Input
                      value={editForm.subject}
                      onChange={(e) => setEditForm({...editForm, subject: e.target.value})}
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>
                  <Tabs defaultValue="html" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-gray-700">
                      <TabsTrigger value="html">HTML Content</TabsTrigger>
                      <TabsTrigger value="text">Text Content</TabsTrigger>
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                    </TabsList>
                    <TabsContent value="html">
                      <Textarea
                        value={editForm.htmlContent}
                        onChange={(e) => setEditForm({...editForm, htmlContent: e.target.value})}
                        className="bg-gray-900 border-gray-700 text-white font-mono text-sm"
                        rows={20}
                      />
                    </TabsContent>
                    <TabsContent value="text">
                      <Textarea
                        value={editForm.textContent}
                        onChange={(e) => setEditForm({...editForm, textContent: e.target.value})}
                        className="bg-gray-900 border-gray-700 text-white font-mono text-sm"
                        rows={20}
                      />
                    </TabsContent>
                    <TabsContent value="preview">
                      <div className="bg-white rounded-lg p-4 min-h-[400px]">
                        <div dangerouslySetInnerHTML={{ __html: editForm.htmlContent }} />
                      </div>
                    </TabsContent>
                  </Tabs>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        onClick={() => handleReset(selectedTemplate.type)}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset to Default
                      </Button>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="email"
                          placeholder="test@example.com"
                          value={testEmail}
                          onChange={(e) => setTestEmail(e.target.value)}
                          className="bg-gray-900 border-gray-700 text-white w-48"
                        />
                        <Button
                          variant="outline"
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          onClick={() => {
                            if (testEmail && selectedTemplate) {
                              sendTestMutation.mutate({
                                templateId: selectedTemplate.id,
                                email: testEmail
                              });
                            }
                          }}
                          disabled={!testEmail || sendTestMutation.isPending}
                        >
                          Send Test
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        onClick={() => setIsEditDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => {
                          if (selectedTemplate) {
                            updateTemplateMutation.mutate({
                              id: selectedTemplate.id,
                              data: editForm
                            });
                          }
                        }}
                        disabled={updateTemplateMutation.isPending}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}