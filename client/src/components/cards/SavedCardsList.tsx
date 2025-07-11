import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Star, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface SavedCard {
  id: string;
  cardBrand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  cardholderName?: string;
  nickname?: string;
  isDefault: boolean;
}

export function SavedCardsList() {
  const { toast } = useToast();

  const { data: cards, isLoading, error } = useQuery<SavedCard[]>({
    queryKey: ["/api/cards"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (cardId: string) => {
      await apiRequest(`/api/cards/${cardId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cards"] });
      toast({
        title: "Card deleted",
        description: "Your saved card has been removed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete card",
        variant: "destructive",
      });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (cardId: string) => {
      await apiRequest(`/api/cards/${cardId}/default`, { method: "PUT" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cards"] });
      toast({
        title: "Default card updated",
        description: "Your default payment card has been changed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update default card",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-sm text-muted-foreground">
            Failed to load saved cards
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!cards || cards.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 space-y-2">
          <CreditCard className="h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No saved cards yet
          </p>
          <p className="text-xs text-muted-foreground">
            Add a card to make future purchases faster
          </p>
        </CardContent>
      </Card>
    );
  }

  const getCardIcon = (brand: string) => {
    // In a real app, you'd have specific icons for each brand
    return <CreditCard className="h-4 w-4" />;
  };

  const formatExpiry = (month: number, year: number) => {
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
  };

  return (
    <div className="space-y-4">
      {cards.map((card) => (
        <Card key={card.id} className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                {getCardIcon(card.cardBrand)}
                <CardTitle className="text-lg">
                  {card.nickname || `${card.cardBrand} •••• ${card.last4}`}
                </CardTitle>
              </div>
              <div className="flex items-center space-x-2">
                {card.isDefault && (
                  <Badge variant="secondary" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Default
                  </Badge>
                )}
              </div>
            </div>
            <CardDescription>
              {card.cardBrand} ending in {card.last4} • Expires {formatExpiry(card.expMonth, card.expYear)}
              {card.cardholderName && ` • ${card.cardholderName}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-between items-center pt-3">
            <div className="flex space-x-2">
              {!card.isDefault && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDefaultMutation.mutate(card.id)}
                  disabled={setDefaultMutation.isPending}
                >
                  Set as default
                </Button>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm("Are you sure you want to delete this card?")) {
                  deleteMutation.mutate(card.id);
                }
              }}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}