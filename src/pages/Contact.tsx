import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, Clock, Facebook, ExternalLink, Loader2, MessageCircle, Youtube, Linkedin } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { checkRateLimit } from "@/lib/rate-limit";
import volunteerJourneyPath from "@/assets/volunteer-journey-path.jpg";

export default function Contact() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Check rate limit
      const rateLimitResult = await checkRateLimit(formData.email, 'contact_messages');
      if (!rateLimitResult.allowed) {
        toast({
          title: "Too many submissions",
          description: rateLimitResult.message,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.from("contact_messages").insert({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        message: formData.message.trim(),
      });

      if (error) throw error;

      toast({
        title: "Message Sent!",
        description: "Thank you for reaching out. We'll get back to you soon."
      });
      setFormData({
        name: "",
        email: "",
        phone: "",
        message: ""
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return <Layout>
      {/* Hero */}
      <section className="relative py-20 lg:py-32 overflow-hidden" style={{
      backgroundImage: `url(${volunteerJourneyPath})`,
      backgroundAttachment: 'fixed',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover'
    }}>
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
              <MessageCircle className="h-4 w-4" />
              Get in Touch
            </div>
            <h1 className="font-serif text-4xl lg:text-6xl font-bold text-primary-foreground drop-shadow-lg">
              Contact Us
            </h1>
            <p className="text-lg lg:text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              We'd love to hear from you. Reach out with questions, partnerships, or to learn more.
            </p>
          </div>
        </div>
        
        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0 -mb-px">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>

      {/* Contact Info & Form */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Information */}
              <div className="space-y-8">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-foreground mb-6">
                    Get in Touch
                  </h2>
                  <p className="text-muted-foreground mb-8">
                    Whether you have questions about our programs, want to partner with us, 
                    or need assistance for a senior citizen, we're here to help.
                  </p>
                </div>

                <div className="space-y-6">
                  <Card className="border-border">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Phone className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">Phone</h3>
                          <a href="tel:7811009309" className="text-muted-foreground hover:text-primary transition-colors">
                            7811009309
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Mail className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">Email</h3>
                          <a className="text-muted-foreground hover:text-primary transition-colors break-all" href="mailto:shraddhawelfareassociation@gmail.com">
                            shraddhawelfareassociation@gmail.com
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">Address</h3>
                          <p className="text-muted-foreground">
                            Bishnupur, West Bengal
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            <span className="font-medium">Expanding to:</span> Kolkata, Delhi, Mumbai
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">Hours</h3>
                          <p className="text-muted-foreground">
                            Monday - Saturday: 9:00 AM - 6:00 PM
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Emergency helpline available 24/7
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="pt-4">
                  <h3 className="font-semibold text-foreground mb-4">Follow Us</h3>
                  <div className="flex flex-wrap gap-4">
                    <a href="https://www.facebook.com/shraddhawelfareassociation" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                      <Facebook className="h-5 w-5" />
                      Facebook
                    </a>
                    <a href="https://www.youtube.com/@hoslaextendedfamily" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                      <Youtube className="h-5 w-5" />
                      YouTube
                    </a>
                    <a href="https://x.com/FamilyHosla" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      X
                    </a>
                    <a href="https://www.linkedin.com/in/hosla-extendedfamily-507155229/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                      <Linkedin className="h-5 w-5" />
                      LinkedIn
                    </a>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <Card className="border-border h-fit">
                <CardContent className="p-6">
                  <h2 className="font-serif text-2xl font-bold text-foreground mb-6">
                    Send a Message
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input id="name" required value={formData.name} onChange={e => setFormData({
                      ...formData,
                      name: e.target.value
                    })} placeholder="Your name" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" type="email" required value={formData.email} onChange={e => setFormData({
                      ...formData,
                      email: e.target.value
                    })} placeholder="your.email@example.com" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" type="tel" value={formData.phone} onChange={e => setFormData({
                      ...formData,
                      phone: e.target.value
                    })} placeholder="+91 XXXXX XXXXX" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea id="message" required value={formData.message} onChange={e => setFormData({
                      ...formData,
                      message: e.target.value
                    })} placeholder="How can we help you?" className="min-h-[150px]" />
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </> : "Send Message"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Map Section */}
            <div className="mt-12">
              <h2 className="font-serif text-2xl font-bold text-foreground mb-6 text-center">
                Find Us
              </h2>
              <Card className="border-border overflow-hidden">
                <CardContent className="p-0">
                  <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d917.7285522239911!2d87.32033586954546!3d23.06360663260785!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f79338f0cb31ff%3A0x84a8fe05e09a8fb0!2sHosla%20Senior%20Citizen%20Care%20Organization!5e0!3m2!1sen!2sin!4v1769021265056!5m2!1sen!2sin" width="100%" height="400" style={{
                  border: 0
                }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Hosla Senior Citizen Care Organization - Bishnupur, West Bengal" className="w-full" />
                </CardContent>
              </Card>
              <div className="mt-4 text-center">
                <a href="https://maps.app.goo.gl/AvHRcYgNFcLRo88FA" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline">
                  <MapPin className="h-4 w-4" />
                  Open in Google Maps
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>;
}