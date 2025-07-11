import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, HelpCircle, MessageSquare, Phone, Mail, Send } from "lucide-react";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { useToast } from "@/hooks/use-toast";

export default function UserSupport() {
  const [, setLocation] = useLocation();
  const { user } = useCustomerAuth();
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Support request sent",
      description: "We'll get back to you within 24 hours."
    });
    setSubject("");
    setMessage("");
  };

  const faqs = [
    {
      question: "How do I check my gift card balance?",
      answer: "Go to the Balance page or visit your Wallet to see all your gift cards and their balances."
    },
    {
      question: "Can I transfer my gift card to someone else?",
      answer: "Gift cards are non-transferable once purchased. However, you can share the card code with anyone."
    },
    {
      question: "What happens if my gift card expires?",
      answer: "Gift cards are valid for 1 year from purchase date. Check expiry dates in your Wallet."
    },
    {
      question: "How do I get a refund?",
      answer: "Gift card purchases are final. For issues, please contact our support team."
    }
  ];

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
            <h1 className="text-2xl font-bold">Support Center</h1>
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Contact Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6 text-center">
                <MessageSquare className="h-8 w-8 text-purple-400 mx-auto mb-3" />
                <h3 className="font-medium mb-1">Live Chat</h3>
                <p className="text-sm text-gray-400 mb-3">Chat with our support team</p>
                <Button variant="outline" size="sm" className="w-full">
                  Start Chat
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6 text-center">
                <Mail className="h-8 w-8 text-blue-400 mx-auto mb-3" />
                <h3 className="font-medium mb-1">Email Support</h3>
                <p className="text-sm text-gray-400 mb-3">support@giftcards.com</p>
                <Button variant="outline" size="sm" className="w-full">
                  Send Email
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6 text-center">
                <Phone className="h-8 w-8 text-green-400 mx-auto mb-3" />
                <h3 className="font-medium mb-1">Phone Support</h3>
                <p className="text-sm text-gray-400 mb-3">1-800-GIFTCARD</p>
                <Button variant="outline" size="sm" className="w-full">
                  Call Now
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Send us a message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="What can we help you with?"
                    className="bg-gray-700 border-gray-600"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Please describe your issue in detail..."
                    className="bg-gray-700 border-gray-600 min-h-[120px]"
                    required
                  />
                </div>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* FAQs */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <HelpCircle className="h-5 w-5 text-purple-400" />
                <span>Frequently Asked Questions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="border-b border-gray-700 pb-4 last:border-0">
                    <h3 className="font-medium mb-2">{faq.question}</h3>
                    <p className="text-sm text-gray-400">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}