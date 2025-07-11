import { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { useLogin } from "@/hooks/useLogin";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Phone, Calendar, CreditCard, Settings, Save, Edit, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";
import { 
  PageContainer, 
  PageHeader, 
  FormContainer, 
  GradientButton,
  GlassCard,
  LoadingSpinner 
} from "@/components/DesignSystem";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Profile() {
  const { user, isAuthenticated } = useAuth();
  const { handleLogin } = useLogin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  // Fetch user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['/api/user/profile'],
    enabled: isAuthenticated,
    retry: false,
  });

  // Fetch saved cards
  const { data: savedCards } = useQuery({
    queryKey: ['/api/user/saved-cards'],
    enabled: isAuthenticated,
    retry: false,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      handleLogin();
      return;
    }
  }, [isAuthenticated, handleLogin]);

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PUT', '/api/user/profile', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Update Failed",
        description: "Unable to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: async (cardId: string) => {
      const response = await apiRequest('DELETE', `/api/user/saved-cards/${cardId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/saved-cards'] });
      toast({
        title: "Card Removed",
        description: "Payment method has been removed.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Unable to remove payment method.",
        variant: "destructive",
      });
    },
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

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleDeleteCard = (cardId: string) => {
    deleteCardMutation.mutate(cardId);
  };

  if (!isAuthenticated) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Navigation 
        user={user} 
        onLogin={handleLogin}
        onLogout={handleLogout}
        showDashboard={user?.role === 'admin'}
      />
      
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <PageHeader
            title="Profile Settings"
            subtitle="Manage your account information and preferences"
          />

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="payment">Payment Methods</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-6">
                <GlassCard>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-20 h-20">
                          <AvatarImage src={user?.profileImageUrl} />
                          <AvatarFallback className="bg-purple-600 text-white text-xl">
                            {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-white text-xl">
                            {user?.firstName} {user?.lastName}
                          </CardTitle>
                          <p className="text-gray-300">{user?.email}</p>
                        </div>
                      </div>
                      <GradientButton
                        variant="outline"
                        onClick={() => setIsEditing(!isEditing)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        {isEditing ? 'Cancel' : 'Edit'}
                      </GradientButton>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-white">First Name</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                          disabled={!isEditing}
                          className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-white">Last Name</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                          disabled={!isEditing}
                          className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-white">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          disabled={!isEditing}
                          className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-white">Phone</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          disabled={!isEditing}
                          className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                        />
                      </div>
                    </div>
                    
                    {isEditing && (
                      <div className="flex justify-end space-x-2">
                        <GradientButton
                          onClick={handleSaveProfile}
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? (
                            <>
                              <LoadingSpinner size="sm" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </GradientButton>
                      </div>
                    )}
                  </CardContent>
                </GlassCard>
              </TabsContent>

              <TabsContent value="payment" className="space-y-6">
                <GlassCard>
                  <CardHeader>
                    <CardTitle className="text-white">Payment Methods</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {savedCards && savedCards.length > 0 ? (
                      <div className="space-y-4">
                        {savedCards.map((card: any) => (
                          <div key={card.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                                <CreditCard className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <p className="text-white font-medium">
                                  **** **** **** {card.last4}
                                </p>
                                <p className="text-gray-300 text-sm">
                                  {card.brand} • Expires {card.expiryMonth}/{card.expiryYear}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {card.isDefault && (
                                <Badge variant="secondary">Default</Badge>
                              )}
                              <GradientButton
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteCard(card.id)}
                                disabled={deleteCardMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </GradientButton>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No Payment Methods</h3>
                        <p className="text-gray-300 mb-4">Add a payment method to make purchases easier</p>
                        <GradientButton>
                          Add Payment Method
                        </GradientButton>
                      </div>
                    )}
                  </CardContent>
                </GlassCard>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </PageContainer>
  );
}