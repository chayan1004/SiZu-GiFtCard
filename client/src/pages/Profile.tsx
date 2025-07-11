import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { SavedCardsList } from "@/components/cards/SavedCardsList";
import { AddCardForm } from "@/components/cards/AddCardForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, User, CreditCard, Settings } from "lucide-react";

export default function Profile() {
  const { user, isLoading } = useAuth();
  const [showAddCard, setShowAddCard] = useState(false);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getInitials = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || "U";
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6">
      {/* User Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.profileImageUrl || undefined} />
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl">
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : "User Profile"}
              </CardTitle>
              <CardDescription className="flex items-center space-x-2">
                <span>{user.email}</span>
                {user.role === "admin" && (
                  <Badge variant="secondary">Admin</Badge>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Tabs */}
      <Tabs defaultValue="payment" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Payment</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Your profile information from Replit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="mt-1">{user.email || "Not provided"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">First Name</label>
                <p className="mt-1">{user.firstName || "Not provided"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                <p className="mt-1">{user.lastName || "Not provided"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Role</label>
                <p className="mt-1 capitalize">{user.role}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                <p className="mt-1">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Tab */}
        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>
                    Manage your saved payment cards
                  </CardDescription>
                </div>
                {!showAddCard && (
                  <Button
                    onClick={() => setShowAddCard(true)}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Card
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {showAddCard ? (
                <AddCardForm
                  onSuccess={() => setShowAddCard(false)}
                  onCancel={() => setShowAddCard(false)}
                />
              ) : (
                <SavedCardsList />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 bg-muted/50">
                <h4 className="text-sm font-medium mb-2">Square Integration</h4>
                <p className="text-sm text-muted-foreground">
                  {user.squareCustomerId
                    ? "Your account is connected to Square for secure payment processing."
                    : "Your account will be connected to Square when you add your first payment card."}
                </p>
              </div>
              <div className="rounded-lg border p-4 bg-muted/50">
                <h4 className="text-sm font-medium mb-2">Security</h4>
                <p className="text-sm text-muted-foreground">
                  All payment information is encrypted and securely stored using Square's PCI-compliant infrastructure.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}