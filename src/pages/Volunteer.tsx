import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Users, Clock, MapPin, CheckCircle, Loader2, HandHeart, Phone, BookOpen, LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { checkRateLimit } from "@/lib/rate-limit";
import volunteerHeroBg from "@/assets/volunteer-hero-bg.jpg";
import elderCareAnimation from "@/assets/elder-care-animation.gif";
import companionCallsImg from "@/assets/volunteer-companion-calls.png";
import homeVisitsImg from "@/assets/volunteer-home-visits.jpg";
import legalAwarenessImg from "@/assets/volunteer-legal-awareness.jpg";
import wellnessImg from "@/assets/volunteer-wellness.jpg";
import volunteerPatternHearts from "@/assets/volunteer-pattern-hearts.jpg";
import volunteerHandsWatercolor from "@/assets/volunteer-hands-watercolor.jpg";

import volunteerJourneyPath from "@/assets/volunteer-journey-path.jpg";

export default function Volunteer() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    motivation: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Check rate limit
      const rateLimitResult = await checkRateLimit(formData.email, 'volunteer_applications');
      if (!rateLimitResult.allowed) {
        toast({
          title: "Too many submissions",
          description: rateLimitResult.message,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const applicationId = crypto.randomUUID();
      const { error } = await supabase
        .from("volunteer_applications")
        .insert({
          id: applicationId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          city: formData.city,
          motivation: formData.motivation,
        });

      if (error) throw error;

      // Trigger email notification
      try {
        await supabase.functions.invoke("send-notification", {
          body: { 
            type: "volunteer_application", 
            applicationId: applicationId,
            email: formData.email, 
            name: formData.name 
          },
        });
      } catch (emailError) {
        console.error("Email notification error:", emailError);
      }

      setSubmitted(true);
      toast({
        title: "Application Submitted!",
        description: "Thank you for your interest. We'll be in touch soon!",
      });
    } catch (error) {
      console.error("Error submitting application:", error);
      toast({
        title: "Error",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activities: { icon: LucideIcon; title: string; description: string; hoverImage: string }[] = [
    {
      icon: Phone,
      title: "Companion Calls",
      description: "Regular phone calls to seniors to combat loneliness and provide emotional support.",
      hoverImage: companionCallsImg
    },
    {
      icon: Users,
      title: "Home Visits",
      description: "In-person visits to seniors in your area, bringing companionship and checking on their well-being.",
      hoverImage: homeVisitsImg
    },
    {
      icon: BookOpen,
      title: "Legal Awareness Camps",
      description: "Help organize and conduct camps to educate seniors about their legal rights.",
      hoverImage: legalAwarenessImg
    },
    {
      icon: HandHeart,
      title: "Wellness Programs",
      description: "Assist with organizing health camps, yoga sessions, and recreational activities.",
      hoverImage: wellnessImg
    }
  ];

  return (
    <Layout>
      {/* Hero */}
      <section 
        className="relative py-20 lg:py-32 overflow-hidden"
        style={{
          backgroundImage: `url(${volunteerHeroBg})`,
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
              Volunteer With Us
            </h1>
            <p className="text-lg lg:text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              Join our community of caring individuals making a difference in the lives of seniors.
            </p>
          </div>
        </div>
        
        {/* Bottom Wave */}
        <div className="absolute -bottom-px left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))"/>
          </svg>
        </div>
      </section>

      {/* Why Volunteer */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Why Volunteer with Shraddha?
              </h2>
              <p className="text-muted-foreground mb-8">
                Your time and compassion can transform the life of a senior citizen.
              </p>
              <div className="flex justify-center">
                <img 
                  src={elderCareAnimation} 
                  alt="Elder care illustration" 
                  className="w-64 h-64 lg:w-80 lg:h-80 object-contain rounded-2xl shadow-lg border border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card className="text-center border-border">
                <CardContent className="p-6 space-y-4">
                  <Heart className="h-10 w-10 text-primary mx-auto" />
                  <h3 className="font-semibold text-foreground">Make Real Impact</h3>
                  <p className="text-sm text-muted-foreground">
                    Your visits and calls become highlights in seniors' days. Small gestures mean everything.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-border">
                <CardContent className="p-6 space-y-4">
                  <Clock className="h-10 w-10 text-primary mx-auto" />
                  <h3 className="font-semibold text-foreground">Flexible Commitment</h3>
                  <p className="text-sm text-muted-foreground">
                    Give as little as 2 hours a week. We work around your schedule.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-border">
                <CardContent className="p-6 space-y-4">
                  <MapPin className="h-10 w-10 text-primary mx-auto" />
                  <h3 className="font-semibold text-foreground">Local Opportunities</h3>
                  <p className="text-sm text-muted-foreground">
                    Volunteer in your own neighborhood or even from home through calls.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Volunteer Activities */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
                What You'll Do
              </h2>
              <p className="text-muted-foreground">
                Various ways you can contribute based on your skills and availability.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activities.map((activity, index) => (
                <Card 
                  key={index} 
                  className="group relative overflow-hidden border-border hover:border-primary/50 transition-all duration-300 cursor-pointer"
                >
                  {/* Background Image with Hover Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <img 
                      src={activity.hoverImage} 
                      alt={activity.title}
                      className="w-full h-full object-cover"
                    />
                    {/* Dark overlay */}
                    <div className="absolute inset-0 bg-foreground/60" />
                    {/* Gradient overlay from bottom */}
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent" />
                  </div>
                  
                  <CardHeader className="relative z-10">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 group-hover:bg-primary-foreground/20 flex items-center justify-center mb-4 transition-colors duration-300">
                      <activity.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                    </div>
                    <CardTitle className="font-serif group-hover:text-primary-foreground transition-colors duration-300">
                      {activity.title}
                    </CardTitle>
                    <CardDescription className="group-hover:text-primary-foreground/90 transition-colors duration-300">
                      {activity.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Signup Form */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Parallax Background - Pattern Hearts Image */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${volunteerPatternHearts})`,
            backgroundAttachment: 'fixed',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
          }}
        />
        
        {/* Dark Overlay with Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/85 to-background/90" />
        
        {/* Animated Gradient Orbs */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-secondary/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/4 w-40 h-40 bg-accent/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Rotating Hand Image on Axis */}
        <div className="absolute top-32 right-4 w-20 h-20 sm:w-28 sm:h-28 md:top-36 md:right-8 md:w-36 md:h-36 lg:top-40 lg:right-16 lg:w-48 lg:h-48 rounded-full overflow-hidden shadow-2xl opacity-50 sm:opacity-60 hover:opacity-90 transition-opacity duration-500 border-2 sm:border-4 border-primary/20"
          style={{
            animation: 'spin-slow 20s linear infinite',
          }}
        >
          <img src={volunteerHandsWatercolor} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/30" />
        </div>
        
        {/* CSS for slow spin on axis */}
        <style>{`
          @keyframes spin-slow {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
        
        {/* Floating Decorative Elements */}
        <div className="absolute top-16 right-20 w-16 h-16 border-2 border-primary/20 rounded-full animate-float-bounce" />
        <div className="absolute bottom-24 left-16 w-20 h-20 border-2 border-primary/15 rotate-45 animate-float-bounce" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-1/3 right-1/4 w-4 h-4 bg-primary/30 rounded-full animate-pulse" />
        <div className="absolute bottom-1/3 left-1/3 w-6 h-6 bg-primary/20 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-24 left-1/3 w-12 h-12 border border-primary/10 rounded-lg rotate-12 animate-wiggle" />
        
        {/* Hearts floating animation */}
        <div className="absolute top-1/4 right-16 text-primary/20 animate-float-bounce">
          <Heart className="h-8 w-8" />
        </div>
        <div className="absolute bottom-1/4 left-20 text-primary/15 animate-float-bounce" style={{ animationDelay: '1s' }}>
          <Heart className="h-6 w-6" />
        </div>
        
        {/* Top Wave */}
        <div className="absolute top-0 left-0 right-0 rotate-180">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--card))"/>
          </svg>
        </div>
        
        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
            <path d="M0 60L48 55C96 50 192 40 288 45C384 50 480 70 576 75C672 80 768 70 864 60C960 50 1056 40 1152 45C1248 50 1344 70 1392 80L1440 90V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0Z" fill="hsl(var(--card))"/>
          </svg>
        </div>
        
        <div className="container relative z-10">
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm text-primary px-4 py-2 rounded-full text-sm font-medium border border-primary/20 mb-6">
                <Heart className="h-4 w-4" />
                Be Part of the Change
              </div>
              <h2 className="font-serif text-3xl lg:text-5xl font-bold text-foreground mb-4">
                Join Our Team
              </h2>
              <p className="text-muted-foreground text-lg">
                Fill out the form below and we'll get in touch with next steps.
              </p>
            </div>

            {submitted ? (
              <Card className="border-primary bg-background/80 backdrop-blur-sm shadow-xl">
                <CardContent className="p-8 text-center space-y-4">
                  <CheckCircle className="h-16 w-16 text-primary mx-auto" />
                  <h3 className="font-serif text-2xl font-bold text-foreground">
                    Application Received!
                  </h3>
                  <p className="text-muted-foreground">
                    Thank you for your interest in volunteering with Shraddha. 
                    Our team will review your application and contact you within 48 hours.
                  </p>
                  <Button onClick={() => setSubmitted(false)}>
                    Submit Another Application
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border bg-background/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-shadow duration-500">
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
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
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Your city"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="motivation">Why do you want to volunteer? *</Label>
                      <Textarea
                        id="motivation"
                        required
                        value={formData.motivation}
                        onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                        placeholder="Tell us a bit about yourself and why you're interested in volunteering with Shraddha..."
                        className="min-h-[120px]"
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Application"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* What Happens Next */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
                What Happens Next?
              </h2>
              <p className="text-muted-foreground">
                Our simple onboarding process to get you started.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { step: "1", title: "Apply", description: "Submit your application through this form" },
                { step: "2", title: "Connect", description: "Our team will reach out for a brief conversation" },
                { step: "3", title: "Train", description: "Complete our short orientation program" },
                { step: "4", title: "Start", description: "Begin making a difference!" },
              ].map((item, index) => (
                <div key={index} className="text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto text-xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
