import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, Gift, Palette, MessageSquare, ShoppingCart, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const shopSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Please enter a valid amount"),
  design: z.string().min(1, "Please select a design"),
  recipientName: z.string().optional(),
  recipientEmail: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  senderName: z.string().optional(),
  customMessage: z.string().max(500, "Message must be 500 characters or less").optional(),
  occasion: z.string().optional(),
  recipient: z.string().optional(),
  tone: z.string().optional(),
});

type ShopFormData = z.infer<typeof shopSchema>;

const DESIGN_OPTIONS = [
  { value: "classic", label: "Classic", color: "bg-gray-600", description: "Timeless and elegant" },
  { value: "love", label: "Love", color: "bg-pink-600", description: "Perfect for romance" },
  { value: "birthday", label: "Birthday", color: "bg-purple-600", description: "Celebrate special days" },
  { value: "holiday", label: "Holiday", color: "bg-green-600", description: "Seasonal festivities" },
  { value: "thank_you", label: "Thank You", color: "bg-blue-600", description: "Show appreciation" },
  { value: "congratulations", label: "Congratulations", color: "bg-yellow-600", description: "Celebrate achievements" },
  { value: "premium", label: "Premium", color: "bg-gradient-to-r from-purple-600 to-pink-600", description: "Luxury experience" },
];

const PRESET_AMOUNTS = [25, 50, 100, 250, 500];

export default function PublicShop() {
  const { toast } = useToast();
  const [aiMode, setAiMode] = useState<"design" | "message">("design");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [suggestedDesign, setSuggestedDesign] = useState("");

  const form = useForm<ShopFormData>({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      amount: "",
      design: "",
      recipientName: "",
      recipientEmail: "",
      senderName: "",
      customMessage: "",
      occasion: "",
      recipient: "",
      tone: "friendly",
    },
  });

  // Fetch active fees
  const { data: fees } = useQuery({
    queryKey: ["/api/fees/active"],
  });

  // AI Design Suggestion
  const aiDesignMutation = useMutation({
    mutationFn: async (prompt: string) => {
      return apiRequest("/api/ai/suggest-design", {
        method: "POST",
        body: { prompt },
      });
    },
    onSuccess: (response) => {
      setSuggestedDesign(response.design);
      form.setValue("design", response.design);
      toast({
        title: "AI Design Suggestion",
        description: response.explanation,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate design suggestion",
        variant: "destructive",
      });
    },
  });

  // AI Message Generation
  const aiMessageMutation = useMutation({
    mutationFn: async (data: {
      occasion: string;
      recipient: string;
      tone: string;
      senderName?: string;
    }) => {
      return apiRequest("/api/ai/generate-message", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: (response) => {
      setGeneratedMessage(response.message);
      form.setValue("customMessage", response.message);
      toast({
        title: "Message Generated",
        description: "AI has created a personalized message for you!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate message",
        variant: "destructive",
      });
    },
  });

  // Purchase Gift Card
  const purchaseMutation = useMutation({
    mutationFn: async (data: ShopFormData) => {
      return apiRequest("/api/giftcards/purchase", {
        method: "POST",
        body: {
          ...data,
          amount: parseFloat(data.amount),
        },
      });
    },
    onSuccess: (response) => {
      toast({
        title: "Success!",
        description: `Gift card purchased successfully! Code: ${response.code}`,
      });
      form.reset();
      // Optionally redirect to order confirmation
      window.location.href = `/order-confirmation?code=${response.code}`;
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to purchase gift card",
        variant: "destructive",
      });
    },
  });

  const calculateTotal = () => {
    const amount = parseFloat(form.watch("amount") || "0");
    const design = form.watch("design");
    if (!amount || !fees) return amount;

    let total = amount;
    fees.forEach((fee: any) => {
      if (fee.isActive) {
        if (design === "premium" && fee.feeType === "premium") {
          total += parseFloat(fee.feeAmount);
        } else if (design !== "premium" && fee.feeType === "standard") {
          total += parseFloat(fee.feeAmount);
        }
      }
    });
    return total.toFixed(2);
  };

  const onSubmit = (data: ShopFormData) => {
    // Prompt user to login to complete purchase
    toast({
      title: "Login Required",
      description: "Please login or create an account to complete your purchase.",
    });
    setTimeout(() => {
      window.location.href = "/login";
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Gift Card Shop</h1>
          <p className="text-xl text-gray-600 mb-2">Create the perfect gift with AI-powered customization</p>
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <span className="text-sm text-purple-600 font-medium">Powered by AI</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-6 w-6 text-purple-600" />
                  Create Your Gift Card
                </CardTitle>
                <CardDescription>
                  Choose a design, add a personal touch, and send joy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="basic" className="mb-6">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="design">Design & AI</TabsTrigger>
                    <TabsTrigger value="message">Message</TabsTrigger>
                  </TabsList>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <TabsContent value="basic" className="space-y-6">
                        {/* Amount Selection */}
                        <FormField
                          control={form.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gift Card Amount</FormLabel>
                              <div className="space-y-4">
                                <div className="grid grid-cols-5 gap-2">
                                  {PRESET_AMOUNTS.map((preset) => (
                                    <Button
                                      key={preset}
                                      type="button"
                                      variant={field.value === preset.toString() ? "default" : "outline"}
                                      onClick={() => field.onChange(preset.toString())}
                                    >
                                      ${preset}
                                    </Button>
                                  ))}
                                </div>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="1"
                                    placeholder="Or enter custom amount"
                                    {...field}
                                  />
                                </FormControl>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Recipient Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="recipientName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Recipient Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="recipientEmail"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Recipient Email</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="john@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="senderName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Your Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Jane Smith" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>

                      <TabsContent value="design" className="space-y-6">
                        {/* AI Design Assistant */}
                        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <Wand2 className="h-5 w-5 text-purple-600" />
                              AI Design Assistant
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <Label>Describe the occasion or recipient</Label>
                              <Textarea
                                placeholder="e.g., My mom's 60th birthday, she loves gardening and classical music"
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                rows={3}
                                className="mt-2"
                              />
                            </div>
                            <Button
                              type="button"
                              onClick={() => aiDesignMutation.mutate(aiPrompt)}
                              disabled={!aiPrompt || aiDesignMutation.isPending}
                              className="w-full"
                            >
                              {aiDesignMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="mr-2 h-4 w-4" />
                                  Get AI Design Suggestion
                                </>
                              )}
                            </Button>
                          </CardContent>
                        </Card>

                        {/* Design Selection */}
                        <FormField
                          control={form.control}
                          name="design"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Choose Design</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                >
                                  {DESIGN_OPTIONS.map((design) => (
                                    <Label
                                      key={design.value}
                                      htmlFor={design.value}
                                      className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                                        field.value === design.value
                                          ? "border-purple-600 bg-purple-50"
                                          : "border-gray-200 hover:border-gray-300"
                                      }`}
                                    >
                                      <RadioGroupItem
                                        value={design.value}
                                        id={design.value}
                                        className="sr-only"
                                      />
                                      <div className="flex items-center gap-3">
                                        <div className={`h-12 w-12 rounded ${design.color}`} />
                                        <div>
                                          <p className="font-medium">{design.label}</p>
                                          <p className="text-sm text-gray-600">{design.description}</p>
                                        </div>
                                        {suggestedDesign === design.value && (
                                          <Badge className="ml-auto" variant="secondary">
                                            AI Pick
                                          </Badge>
                                        )}
                                      </div>
                                    </Label>
                                  ))}
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>

                      <TabsContent value="message" className="space-y-6">
                        {/* AI Message Generator */}
                        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <MessageSquare className="h-5 w-5 text-blue-600" />
                              AI Message Generator
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="occasion"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Occasion</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select occasion" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="birthday">Birthday</SelectItem>
                                        <SelectItem value="anniversary">Anniversary</SelectItem>
                                        <SelectItem value="graduation">Graduation</SelectItem>
                                        <SelectItem value="wedding">Wedding</SelectItem>
                                        <SelectItem value="holiday">Holiday</SelectItem>
                                        <SelectItem value="thank_you">Thank You</SelectItem>
                                        <SelectItem value="just_because">Just Because</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="tone"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Tone</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select tone" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="friendly">Friendly</SelectItem>
                                        <SelectItem value="formal">Formal</SelectItem>
                                        <SelectItem value="funny">Funny</SelectItem>
                                        <SelectItem value="romantic">Romantic</SelectItem>
                                        <SelectItem value="professional">Professional</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={form.control}
                              name="recipient"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Recipient Relationship</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g., Best friend, Mom, Colleague"
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <Button
                              type="button"
                              onClick={() => {
                                const occasion = form.getValues("occasion");
                                const recipient = form.getValues("recipient");
                                const tone = form.getValues("tone");
                                const senderName = form.getValues("senderName");
                                
                                if (!occasion || !recipient) {
                                  toast({
                                    title: "Missing Information",
                                    description: "Please fill in occasion and recipient relationship",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                
                                aiMessageMutation.mutate({
                                  occasion,
                                  recipient,
                                  tone: tone || "friendly",
                                  senderName,
                                });
                              }}
                              disabled={aiMessageMutation.isPending}
                              className="w-full"
                            >
                              {aiMessageMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="mr-2 h-4 w-4" />
                                  Generate Message with AI
                                </>
                              )}
                            </Button>
                          </CardContent>
                        </Card>

                        {/* Custom Message */}
                        <FormField
                          control={form.control}
                          name="customMessage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Personal Message</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Write your personal message here..."
                                  {...field}
                                  rows={5}
                                />
                              </FormControl>
                              <FormMessage />
                              <p className="text-sm text-gray-600">
                                {field.value?.length || 0}/500 characters
                              </p>
                            </FormItem>
                          )}
                        />
                      </TabsContent>
                    </form>
                  </Form>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="shadow-xl sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Gift Card Amount</span>
                    <span className="font-medium">${form.watch("amount") || "0.00"}</span>
                  </div>
                  
                  {fees && form.watch("design") && (
                    <>
                      {fees.filter((fee: any) => {
                        if (!fee.isActive) return false;
                        const design = form.watch("design");
                        if (design === "premium" && fee.feeType === "premium") return true;
                        if (design !== "premium" && fee.feeType === "standard") return true;
                        return false;
                      }).map((fee: any) => (
                        <div key={fee.id} className="flex justify-between text-sm">
                          <span className="text-gray-600">{fee.feeName}</span>
                          <span className="text-gray-600">+${fee.feeAmount}</span>
                        </div>
                      ))}
                    </>
                  )}
                  
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span>${calculateTotal()}</span>
                    </div>
                  </div>
                </div>

                {form.watch("design") && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Selected Design</p>
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-8 w-8 rounded ${
                          DESIGN_OPTIONS.find((d) => d.value === form.watch("design"))?.color
                        }`}
                      />
                      <span className="font-medium">
                        {DESIGN_OPTIONS.find((d) => d.value === form.watch("design"))?.label}
                      </span>
                    </div>
                  </div>
                )}

                {form.watch("recipientName") && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Recipient</p>
                    <p className="text-sm text-gray-600">{form.watch("recipientName")}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={purchaseMutation.isPending}
                  onClick={form.handleSubmit(onSubmit)}
                >
                  {purchaseMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Purchase Gift Card
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-gray-500">
                  Secure payment powered by Square
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}