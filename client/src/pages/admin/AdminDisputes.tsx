import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { AlertCircle, FileText, Upload, CheckCircle, XCircle, Clock, DollarSign, Calendar, Download } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import SideNavigation from "@/components/SideNavigation";
import { format } from "date-fns";

interface Dispute {
  id: string;
  reason: string;
  status: string;
  state: string;
  disputedAt: string;
  dueBy: string;
  amountMoney: {
    amount: number;
    currency: string;
  };
  evidenceIds?: string[];
  cardBrand?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminDisputes() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [evidenceText, setEvidenceText] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

  // Check if user is admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      window.location.href = "/api/login";
    }
  }, [isAuthenticated, isLoading, user]);

  // Fetch disputes
  const { data: disputes = [], isLoading: disputesLoading } = useQuery<Dispute[]>({
    queryKey: ['/api/disputes'],
    enabled: isAuthenticated && user?.role === 'admin',
    retry: false
  });

  // Accept dispute mutation
  const acceptMutation = useMutation({
    mutationFn: async (disputeId: string) => {
      await apiRequest(`/api/disputes/${disputeId}/accept`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      toast({
        title: "Dispute Accepted",
        description: "The dispute has been accepted successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/disputes'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to accept dispute. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Submit evidence mutation
  const submitEvidenceMutation = useMutation({
    mutationFn: async ({ disputeId, text, file }: { disputeId: string; text?: string; file?: File }) => {
      const formData = new FormData();
      if (text) formData.append('evidenceText', text);
      if (file) formData.append('evidenceFile', file);

      await apiRequest(`/api/disputes/${disputeId}/evidence`, {
        method: 'POST',
        body: formData,
        headers: {} // Let browser set multipart headers
      });
    },
    onSuccess: () => {
      toast({
        title: "Evidence Submitted",
        description: "Your evidence has been submitted successfully."
      });
      setEvidenceText("");
      setEvidenceFile(null);
      queryClient.invalidateQueries({ queryKey: ['/api/disputes'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit evidence. Please try again.",
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

  const getStatusBadge = (status: string, state: string) => {
    const statusMap: { [key: string]: { variant: "default" | "secondary" | "destructive" | "outline", label: string } } = {
      'INQUIRY_EVIDENCE_REQUIRED': { variant: 'destructive', label: 'Evidence Required' },
      'INQUIRY_PROCESSING': { variant: 'secondary', label: 'Processing' },
      'INQUIRY_CLOSED': { variant: 'default', label: 'Closed' },
      'WON': { variant: 'default', label: 'Won' },
      'LOST': { variant: 'destructive', label: 'Lost' },
      'ACCEPTED': { variant: 'secondary', label: 'Accepted' }
    };

    const config = statusMap[state] || { variant: 'outline', label: state };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount / 100);
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
            <h1 className="text-3xl font-bold text-white mb-2">Disputes Management</h1>
            <p className="text-gray-400">Handle payment disputes and chargebacks</p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Active Disputes</p>
                    <p className="text-2xl font-bold text-white">
                      {disputes.filter(d => d.state !== 'WON' && d.state !== 'LOST' && d.state !== 'ACCEPTED').length}
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Evidence Required</p>
                    <p className="text-2xl font-bold text-red-400">
                      {disputes.filter(d => d.state === 'INQUIRY_EVIDENCE_REQUIRED').length}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Won Disputes</p>
                    <p className="text-2xl font-bold text-green-400">
                      {disputes.filter(d => d.state === 'WON').length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Amount</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(
                        disputes.reduce((sum, d) => sum + (d.amountMoney?.amount || 0), 0),
                        'USD'
                      )}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Disputes List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">All Disputes</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage and respond to payment disputes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {disputesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                  </div>
                ) : disputes.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No disputes found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {disputes.map((dispute) => (
                      <div key={dispute.id} className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <h3 className="text-white font-medium">Dispute #{dispute.id.slice(-8)}</h3>
                              {getStatusBadge(dispute.status, dispute.state)}
                              {dispute.cardBrand && (
                                <Badge variant="outline" className="text-gray-300 border-gray-600">
                                  {dispute.cardBrand}
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-400">Amount</p>
                                <p className="text-white font-medium">
                                  {formatCurrency(dispute.amountMoney.amount, dispute.amountMoney.currency)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-400">Reason</p>
                                <p className="text-white">{dispute.reason.replace(/_/g, ' ')}</p>
                              </div>
                              <div>
                                <p className="text-gray-400">Disputed At</p>
                                <p className="text-white">{format(new Date(dispute.disputedAt), 'MMM d, yyyy')}</p>
                              </div>
                              <div>
                                <p className="text-gray-400">Due By</p>
                                <p className="text-white">{format(new Date(dispute.dueBy), 'MMM d, yyyy')}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            {dispute.state === 'INQUIRY_EVIDENCE_REQUIRED' && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    className="bg-purple-600 hover:bg-purple-700"
                                    onClick={() => setSelectedDispute(dispute)}
                                  >
                                    <Upload className="w-4 h-4 mr-1" />
                                    Add Evidence
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-gray-800 border-gray-700">
                                  <DialogHeader>
                                    <DialogTitle className="text-white">Submit Evidence</DialogTitle>
                                    <DialogDescription className="text-gray-400">
                                      Provide evidence to support your case
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 mt-4">
                                    <div>
                                      <label className="text-sm text-gray-300 mb-2 block">Text Evidence</label>
                                      <Textarea
                                        value={evidenceText}
                                        onChange={(e) => setEvidenceText(e.target.value)}
                                        placeholder="Provide details about the transaction..."
                                        className="bg-gray-900 border-gray-700 text-white"
                                        rows={4}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm text-gray-300 mb-2 block">Upload File</label>
                                      <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.pdf"
                                        onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
                                        className="w-full text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                                      />
                                      <p className="text-xs text-gray-500 mt-1">
                                        Supported: JPEG, PNG, PDF (max 10MB)
                                      </p>
                                    </div>
                                    <Button
                                      onClick={() => {
                                        if (selectedDispute && (evidenceText || evidenceFile)) {
                                          submitEvidenceMutation.mutate({
                                            disputeId: selectedDispute.id,
                                            text: evidenceText,
                                            file: evidenceFile || undefined
                                          });
                                        }
                                      }}
                                      disabled={!evidenceText && !evidenceFile}
                                      className="w-full bg-purple-600 hover:bg-purple-700"
                                    >
                                      Submit Evidence
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                            {dispute.state === 'INQUIRY_EVIDENCE_REQUIRED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                onClick={() => acceptMutation.mutate(dispute.id)}
                              >
                                Accept Dispute
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}