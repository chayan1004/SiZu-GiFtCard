import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard } from "lucide-react";

const addCardSchema = z.object({
  cardNumber: z.string().min(13).max(19).regex(/^\d+$/, "Card number must contain only digits"),
  expMonth: z.string().regex(/^(0[1-9]|1[0-2])$/, "Invalid month"),
  expYear: z.string().regex(/^\d{2}$/, "Invalid year"),
  cvv: z.string().regex(/^\d{3,4}$/, "Invalid CVV"),
  cardholderName: z.string().min(1, "Cardholder name is required"),
  nickname: z.string().optional(),
  isDefault: z.boolean().default(false),
});

type AddCardFormData = z.infer<typeof addCardSchema>;

interface AddCardFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddCardForm({ onSuccess, onCancel }: AddCardFormProps) {
  const { toast } = useToast();
  const [isTokenizing, setIsTokenizing] = useState(false);

  const form = useForm<AddCardFormData>({
    resolver: zodResolver(addCardSchema),
    defaultValues: {
      cardNumber: "",
      expMonth: "",
      expYear: "",
      cvv: "",
      cardholderName: "",
      nickname: "",
      isDefault: false,
    },
  });

  const addCardMutation = useMutation({
    mutationFn: async (data: { sourceId: string; nickname?: string; isDefault: boolean }) => {
      return await apiRequest("/api/cards", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cards"] });
      toast({
        title: "Card added",
        description: "Your card has been saved successfully.",
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add card",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: AddCardFormData) => {
    try {
      setIsTokenizing(true);
      
      // In a real implementation, you would use Square Web Payments SDK here
      // to tokenize the card and get a secure nonce
      // For now, we'll show a message about Square integration
      
      toast({
        title: "Square Integration Required",
        description: "Square Web Payments SDK needs to be integrated on the frontend to securely tokenize cards.",
        variant: "destructive",
      });
      
      // Example of how it would work with Square SDK:
      // const paymentToken = await squarePayments.tokenize({
      //   card: {
      //     cardNumber: data.cardNumber,
      //     expirationDate: `${data.expMonth}/${data.expYear}`,
      //     cvv: data.cvv,
      //     cardholderName: data.cardholderName,
      //   }
      // });
      
      // addCardMutation.mutate({
      //   sourceId: paymentToken.token,
      //   nickname: data.nickname,
      //   isDefault: data.isDefault,
      // });
      
    } catch (error) {
      console.error("Tokenization error:", error);
      toast({
        title: "Error",
        description: "Failed to process card information",
        variant: "destructive",
      });
    } finally {
      setIsTokenizing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Payment Card</CardTitle>
        <CardDescription>
          Your card information is encrypted and stored securely
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cardNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Card Number</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="1234 5678 9012 3456"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\s/g, '');
                          field.onChange(value);
                        }}
                      />
                      <CreditCard className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="expMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Month</FormLabel>
                    <FormControl>
                      <Input placeholder="MM" maxLength={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Year</FormLabel>
                    <FormControl>
                      <Input placeholder="YY" maxLength={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="cvv"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CVV</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="123"
                      maxLength={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    3 or 4 digit security code
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cardholderName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cardholder Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nickname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Card Nickname (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Personal Card" {...field} />
                  </FormControl>
                  <FormDescription>
                    Give your card a friendly name for easy identification
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Set as default payment method
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={addCardMutation.isPending || isTokenizing}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={addCardMutation.isPending || isTokenizing}
              >
                {(addCardMutation.isPending || isTokenizing) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add Card
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}