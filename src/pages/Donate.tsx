import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Heart, Facebook, CreditCard, Building, Smartphone, ExternalLink, Copy, Check, Info } from "lucide-react";
import { WallOfThanks } from "@/components/donate/WallOfThanks";
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { checkRateLimit } from "@/lib/rate-limit";
import confetti from "canvas-confetti";
import upiQrCode from "@/assets/upi-qr-code.png";
import volunteerJourneyPath from "@/assets/volunteer-journey-path.jpg";
import announcementIcon from "@/assets/announcement-icon.svg";

export default function Donate() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [consentToPublish, setConsentToPublish] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    panCard: "",
    amount: "",
  });

  // Fetch consented donors for Wall of Thanks
  const { data: consentedDonors } = useQuery({
    queryKey: ["consented-donors"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_consented_donors");
      if (error) throw error;
      return data as { name: string; donated_at: string }[];
    },
  });

  const triggerConfetti = useCallback(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Left side burst
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#4A9D8E', '#2D5A4A', '#78B5A8', '#FFD700', '#FF6B6B'],
      });
      // Right side burst
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#4A9D8E', '#2D5A4A', '#78B5A8', '#FFD700', '#FF6B6B'],
      });
    }, 250);
  }, []);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({
        title: "Copied!",
        description: `${field} copied to clipboard`,
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy manually",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Check rate limit
      const rateLimitResult = await checkRateLimit(formData.email, 'donations');
      if (!rateLimitResult.allowed) {
        toast({
          title: "Too many submissions",
          description: rateLimitResult.message,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Store donation in database
      const { error: dbError } = await supabase
        .from('donations')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          pan_card: formData.panCard || null,
          amount: formData.amount,
          consent_to_publish: consentToPublish,
        });

      if (dbError) {
        console.error("Database error:", dbError);
        // Continue even if db fails - email is more important
      }

      // Send confirmation email
      const { error } = await supabase.functions.invoke('send-donation-confirmation', {
        body: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          panCard: formData.panCard || undefined,
          amount: formData.amount,
        },
      });

      if (error) throw error;

      // Trigger confetti celebration!
      triggerConfetti();

      toast({
        title: "Thank You! 🙏",
        description: "Your donation intent has been recorded. We've sent payment details to your email.",
      });

      setFormData({ name: "", email: "", phone: "", panCard: "", amount: "" });
      setConsentToPublish(false);
    } catch (error: any) {
      console.error("Error sending confirmation:", error);
      toast({
        title: "Error",
        description: "Failed to send confirmation. Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const impactCards = [
    { amount: "₹500", impact: "Provides a senior with one month of companion calls" },
    { amount: "₹2,000", impact: "Funds a legal awareness session for 10 seniors" },
    { amount: "₹5,000", impact: "Supports a senior's wellness program for 3 months" },
    { amount: "₹10,000", impact: "Enables comprehensive support for one senior for a year" },
  ];

  return (
    <Layout>
      {/* Hero */}
      <section 
        className="relative py-20 lg:py-32 overflow-hidden"
        style={{
          backgroundImage: `url(${volunteerJourneyPath})`,
          backgroundAttachment: 'fixed',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/85 via-primary/75 to-primary/90" />
        
        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 border-2 border-primary-foreground/20 rounded-full animate-float-bounce" />
        <div className="absolute bottom-16 right-16 w-32 h-32 border-2 border-primary-foreground/10 rounded-full" />
        <div className="absolute top-1/4 right-10 w-4 h-4 bg-primary-foreground/30 rounded-full animate-pulse" />
        <div className="absolute bottom-1/3 left-16 w-6 h-6 bg-primary-foreground/20 rounded-full animate-pulse" />
        <div className="absolute top-20 right-1/4 w-16 h-16 border border-primary-foreground/15 rotate-45" />
        <div className="absolute bottom-10 left-1/4 w-12 h-12 border border-primary-foreground/10 rotate-12 rounded-lg" />
        
        {/* Content */}
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm text-primary-foreground px-4 py-2 rounded-full text-sm font-medium border border-primary-foreground/20">
              <Heart className="h-4 w-4" />
              Make a Difference
            </div>
            <h1 className="font-serif text-4xl lg:text-6xl font-bold text-primary-foreground drop-shadow-lg">
              Support Our Mission
            </h1>
            <p className="text-lg lg:text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              Your donation helps us protect and support senior citizens across India.
            </p>
          </div>
        </div>
        
        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0 -mb-px">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))"/>
          </svg>
        </div>
      </section>

      {/* Donation Form */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Form */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="font-serif">Donor Information</CardTitle>
                  <CardDescription>
                    Fill in your details for tax exemption certificate (80G)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="your.email@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 XXXXX XXXXX"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="panCard">PAN Card Number</Label>
                      <Input
                        id="panCard"
                        value={formData.panCard}
                        onChange={(e) => setFormData({ ...formData, panCard: e.target.value })}
                        placeholder="For 80G tax exemption"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">Donation Amount (₹) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        required
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="Enter amount"
                      />
                    </div>

                    <div className="flex items-start space-x-3 p-3 bg-accent/50 rounded-lg">
                      <Checkbox
                        id="consent"
                        checked={consentToPublish}
                        onCheckedChange={(checked) => setConsentToPublish(checked === true)}
                        className="mt-0.5"
                      />
                      <div className="space-y-1">
                        <Label htmlFor="consent" className="text-sm font-medium cursor-pointer">
                          I consent to be recognized as a donor
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Allow Shraddha to publicly acknowledge my contribution (name only, no amount)
                        </p>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? "Sending..." : "Get Payment Details"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Payment Options */}
              <div className="space-y-6">
                {/* Important Disclaimer */}
                <Alert className="border-primary/30 bg-primary/5">
                  <Info className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-sm">
                    <strong>Important:</strong> To receive a confirmation receipt and be visible to our team as a donor, 
                    please fill out the form before making your payment. If you pay directly via QR or bank transfer 
                    without submitting the form, we won't be able to track or acknowledge your contribution.
                  </AlertDescription>
                </Alert>
                <Card className="border-border">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5 text-primary" />
                      <CardTitle className="font-serif">UPI Payment</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="max-w-[250px] mx-auto rounded-lg overflow-hidden">
                      <img 
                        src={upiQrCode} 
                        alt="UPI QR Code for Shraddha Welfare Association" 
                        className="w-full h-auto"
                      />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Scan to pay via any UPI app
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          UPI ID: <span className="text-primary">shraddhango@ucobank</span>
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard("shraddhango@ucobank", "UPI ID")}
                        >
                          {copiedField === "UPI ID" ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-primary" />
                      <CardTitle className="font-serif">Bank Transfer</CardTitle>
                    </div>
                  </CardHeader>
                <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Account Name:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">SHRADDHA WELFARE ASSOCIATION</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard("SHRADDHA WELFARE ASSOCIATION", "Account Name")}
                          >
                            {copiedField === "Account Name" ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Account Number:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">22890110076118</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard("22890110076118", "Account Number")}
                          >
                            {copiedField === "Account Number" ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">IFSC Code:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">UCBA0002289</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard("UCBA0002289", "IFSC Code")}
                          >
                            {copiedField === "IFSC Code" ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Bank:</span>
                        <span className="font-medium text-foreground">UCO Bank</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <CardTitle className="font-serif">Online Payment</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full" disabled>
                      Coming Soon
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Credit/Debit card payments will be available soon
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Transparency Pledge */}
      <section className="py-12 bg-background">
        <div className="container">
          <Card className="max-w-4xl mx-auto border-primary/20">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <img src={announcementIcon} alt="Announcement" className="h-16 w-16 flex-shrink-0" />
                <div className="text-center md:text-left space-y-3">
                  <h2 className="font-serif text-2xl font-bold text-foreground">
                    Our Transparency Pledge
                  </h2>
                  <p className="text-muted-foreground">
                    Every rupee you donate goes directly to supporting seniors. We maintain complete 
                    transparency in our operations and regularly share impact updates with our donors.
                  </p>
                  <a 
                    href="https://www.facebook.com/shraddhawelfareassociation" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    <Facebook className="h-4 w-4" />
                    Follow our journey on Facebook
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Impact Cards */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Your Impact
            </h2>
            <p className="text-muted-foreground">
              See how your donation makes a difference.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {impactCards.map((card, index) => (
              <Card key={index} className="text-center border-border hover:border-primary/50 transition-colors">
                <CardContent className="p-6 space-y-3">
                  <div className="text-3xl font-bold text-primary">{card.amount}</div>
                  <p className="text-sm text-muted-foreground">{card.impact}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Wall of Thanks */}
      {consentedDonors && consentedDonors.length > 0 && (
        <WallOfThanks donors={consentedDonors} />
      )}

      {/* CTA */}
      <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
        <div className="container text-center space-y-6">
          <h2 className="font-serif text-3xl lg:text-4xl font-bold">
            Questions About Donating?
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto">
            We're happy to assist you with any questions about donations, 
            tax exemptions, or how your contribution will be used.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild variant="secondary" size="lg">
              <a href="mailto:shraddhawelfareassociation@gmail.com">
                Email Us
              </a>
            </Button>
            <Button asChild variant="heroOutline" size="lg">
              <a href="tel:7811009309">
                Call Us
              </a>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
