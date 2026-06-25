import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  CalendarDays, Clock, MapPin, Phone, Heart, CheckCircle, ArrowRight, Loader2, Star,
} from "lucide-react";
import { format } from "date-fns";
import hoslaLogo from "@/assets/hosla-logo.png";
import logoShraddha from "@/assets/logo-shraddha.png";

const sourceOptions = ["WhatsApp", "Facebook/Instagram", "Friend/Relative", "Website", "Other"];

type FieldKey = "mobile" | "age" | "area" | "medical_concerns" | "source";
type FieldSetting = { enabled: boolean; required: boolean };
type FieldConfig = Record<FieldKey, FieldSetting>;

const defaultFieldConfig: FieldConfig = {
  mobile: { enabled: true, required: true },
  age: { enabled: true, required: true },
  area: { enabled: true, required: true },
  medical_concerns: { enabled: true, required: false },
  source: { enabled: true, required: false },
};

export default function EventRegistration() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    mobile: "",
    email: "",
    age: "",
    area: "",
    medical_concerns: "",
    source: "",
  });

  const { data: event, isLoading } = useQuery({
    queryKey: ["registration-event", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registration_events")
        .select("*")
        .eq("slug", slug!)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const fieldConfig: FieldConfig = {
    ...defaultFieldConfig,
    ...((event?.field_config as Partial<FieldConfig>) || {}),
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    if (!formData.full_name || !formData.email) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    // Validate enabled+required toggleable fields
    const reqKeys = (Object.keys(fieldConfig) as FieldKey[]).filter(
      (k) => fieldConfig[k].enabled && fieldConfig[k].required
    );
    for (const k of reqKeys) {
      if (!formData[k]) {
        toast({ title: "Please fill all required fields", variant: "destructive" });
        return;
      }
    }

    let age: number | null = null;
    if (fieldConfig.age.enabled && formData.age) {
      age = parseInt(formData.age);
      if (isNaN(age) || age < 1 || age > 120) {
        toast({ title: "Please enter a valid age", variant: "destructive" });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const rateCheck = await checkRateLimit(formData.email, "contact_messages");
      if (!rateCheck.allowed) {
        toast({ title: "Too many submissions", description: rateCheck.message, variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      const registrationId = crypto.randomUUID();
      const { error } = await supabase.from("event_registrations").insert({
        id: registrationId,
        event_id: event.id,
        full_name: formData.full_name.trim(),
        mobile: formData.mobile.trim() || "—",
        email: formData.email.trim().toLowerCase(),
        age: age ?? 0,
        area: formData.area.trim() || "—",
        medical_concerns: formData.medical_concerns.trim() || null,
        source: formData.source || "Other",
      });
      if (error) throw error;

      try {
        await supabase.functions.invoke("send-event-email", {
          body: {
            type: "registration_confirmation",
            registrationId,
            eventId: event.id,
            name: formData.full_name.trim(),
            email: formData.email.trim().toLowerCase(),
          },
        });
      } catch {
        // Don't block on email failure
      }

      setIsRegistered(true);
    } catch (err) {
      console.error("Registration error:", err);
      toast({
        title: "Registration failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 gap-4">
          <h1 className="font-serif text-2xl font-bold text-foreground">Event not found</h1>
          <p className="text-muted-foreground">This event may have ended or is no longer available.</p>
          <Button asChild>
            <Link to="/register">View open events</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const formatTime12 = (t: string) => {
    if (!t) return "";
    const [hStr, mStr] = t.split(":");
    let h = parseInt(hStr, 10);
    const m = mStr ?? "00";
    if (isNaN(h)) return t;
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  const eventDateLabel = event.event_date ? format(new Date(event.event_date), "MMMM d, yyyy") : null;
  const timeLabel = [event.start_time, event.end_time]
    .filter(Boolean)
    .map((t) => formatTime12(t!))
    .join(" – ");

  return (
    <Layout>
      {/* Hero */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/40 via-background to-accent/30" />
        <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
                <img src={hoslaLogo} alt="Hosla" className="h-10" />
                <span className="text-2xl text-muted-foreground">&</span>
                <img src={logoShraddha} alt="Shraddha" className="h-10" />
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                {event.title}
              </h1>

              {event.description && (
                <p className="text-lg text-muted-foreground max-w-2xl">{event.description}</p>
              )}

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                {eventDateLabel && (
                  <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-xl border border-border shadow-sm">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    <span className="font-medium text-foreground">{eventDateLabel}</span>
                  </div>
                )}
                {timeLabel && (
                  <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-xl border border-border shadow-sm">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="font-medium text-foreground">{timeLabel}</span>
                  </div>
                )}
              </div>

              {event.enable_registration && event.registration_open && (
                <Button
                  size="lg"
                  className="mt-2 group"
                  onClick={() => document.getElementById("register")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Register Now
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              )}
            </div>

            {event.banner_url && (
              <div className="flex justify-center">
                <img
                  src={event.banner_url}
                  alt={event.title}
                  className="rounded-2xl shadow-xl border-4 border-card w-full max-w-md object-cover aspect-[16/10]"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Venue */}
      {(event.venue_name || event.venue_address) && (
        <section className="py-14 bg-card border-y border-border">
          <div className="container px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto grid sm:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-5 space-y-3">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Venue</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {event.venue_name && <strong className="text-foreground">{event.venue_name}</strong>}
                    {event.venue_name && event.venue_address && <br />}
                    {event.venue_address}
                  </p>
                </CardContent>
              </Card>
              {event.contact_phone && (
                <Card>
                  <CardContent className="p-5 space-y-3">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">Need help?</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <span>Call us at </span>
                      {event.contact_phone.split(",").map((phone, i, arr) => {
                        const trimmed = phone.trim();
                        if (!trimmed) return null;
                        return (
                          <span key={i}>
                            <a href={`tel:${trimmed.replace(/\s/g, "")}`} className="text-primary font-medium hover:underline">
                              {trimmed}
                            </a>
                            {i < arr.length - 1 && arr[i + 1]?.trim() ? ", " : ""}
                          </span>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Registration Form */}
      <section id="register" className="py-16 lg:py-24 bg-background scroll-mt-20">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            {isRegistered ? (
              <Card className="shadow-lg">
                <CardContent className="p-8 sm:p-12 text-center space-y-6">
                  <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center mx-auto">
                    <CheckCircle className="h-10 w-10 text-primary" />
                  </div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
                    Thank you for registering!
                  </h2>
                  <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
                    We are excited to see you
                    {eventDateLabel ? <strong className="text-foreground"> on {eventDateLabel}</strong> : ""}
                    {event.venue_name ? <strong className="text-foreground"> at {event.venue_name}</strong> : ""}.
                    {" "}We will send a confirmation to your email.
                  </p>
                  {event.contact_phone && (
                    <div className="bg-accent/50 rounded-xl p-4 border border-border">
                      <p className="text-sm text-muted-foreground">
                        Need help? Call us at{" "}
                        {event.contact_phone.split(",").map((phone, i, arr) => {
                          const trimmed = phone.trim();
                          if (!trimmed) return null;
                          return (
                            <span key={i}>
                              <a href={`tel:${trimmed.replace(/\s/g, "")}`} className="text-primary font-medium hover:underline">
                                {trimmed}
                              </a>
                              {i < arr.length - 1 && arr[i + 1]?.trim() ? ", " : ""}
                            </span>
                          );
                        })}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <img src={hoslaLogo} alt="Hosla" className="h-6" />
                    <span className="text-muted-foreground">&</span>
                    <img src={logoShraddha} alt="Shraddha" className="h-6" />
                  </div>
                </CardContent>
              </Card>
            ) : !(event.enable_registration && event.registration_open) ? (
              <Card className="shadow-lg">
                <CardContent className="p-8 sm:p-12 text-center space-y-4">
                  <h2 className="font-serif text-2xl font-bold text-foreground">Registration is closed</h2>
                  <p className="text-muted-foreground">
                    Registration for this event is currently not open. Please check back later or explore our other events.
                  </p>
                  <Button asChild variant="outline">
                    <Link to="/register">View open events</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Star className="h-5 w-5 text-primary" />
                    <span className="text-primary font-medium uppercase tracking-widest text-sm">Register Now</span>
                    <Star className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-3">
                    Reserve Your Spot
                  </h2>
                  <p className="text-muted-foreground">Fill in your details below — it only takes a minute.</p>
                </div>

                <Card className="shadow-lg">
                  <CardContent className="p-6 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name *</Label>
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => handleChange("full_name", e.target.value)}
                          placeholder="Your full name"
                          required
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange("email", e.target.value)}
                            placeholder="you@example.com"
                            required
                          />
                        </div>
                        {fieldConfig.mobile.enabled && (
                          <div className="space-y-2">
                            <Label htmlFor="mobile">Mobile {fieldConfig.mobile.required && "*"}</Label>
                            <Input
                              id="mobile"
                              type="tel"
                              value={formData.mobile}
                              onChange={(e) => handleChange("mobile", e.target.value)}
                              placeholder="10-digit mobile number"
                              required={fieldConfig.mobile.required}
                            />
                          </div>
                        )}
                      </div>

                      <div className="grid sm:grid-cols-2 gap-5">
                        {fieldConfig.age.enabled && (
                          <div className="space-y-2">
                            <Label htmlFor="age">Age {fieldConfig.age.required && "*"}</Label>
                            <Input
                              id="age"
                              type="number"
                              min={1}
                              max={120}
                              value={formData.age}
                              onChange={(e) => handleChange("age", e.target.value)}
                              placeholder="Age"
                              required={fieldConfig.age.required}
                            />
                          </div>
                        )}
                        {fieldConfig.area.enabled && (
                          <div className="space-y-2">
                            <Label htmlFor="area">Area / Locality {fieldConfig.area.required && "*"}</Label>
                            <Input
                              id="area"
                              value={formData.area}
                              onChange={(e) => handleChange("area", e.target.value)}
                              placeholder="Your area"
                              required={fieldConfig.area.required}
                            />
                          </div>
                        )}
                      </div>

                      {fieldConfig.source.enabled && (
                        <div className="space-y-2">
                          <Label htmlFor="source">How did you hear about us? {fieldConfig.source.required && "*"}</Label>
                          <Select value={formData.source} onValueChange={(v) => handleChange("source", v)}>
                            <SelectTrigger id="source">
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                            <SelectContent>
                              {sourceOptions.map((opt) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {fieldConfig.medical_concerns.enabled && (
                        <div className="space-y-2">
                          <Label htmlFor="medical_concerns">
                            Medical concerns (optional) {fieldConfig.medical_concerns.required && "*"}
                          </Label>
                          <Textarea
                            id="medical_concerns"
                            value={formData.medical_concerns}
                            onChange={(e) => handleChange("medical_concerns", e.target.value)}
                            placeholder="Any health conditions we should know about"
                            rows={3}
                            required={fieldConfig.medical_concerns.required}
                          />
                        </div>
                      )}

                      <Button type="submit" size="lg" className="w-full group" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering...</>
                        ) : (
                          <><Heart className="mr-2 h-4 w-4" /> Complete Registration</>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
