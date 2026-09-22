import { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
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
  CalendarDays, Clock, MapPin, Phone, Heart, CheckCircle, ArrowRight, Loader2, Star, Images, Ticket,
} from "lucide-react";
import { format } from "date-fns";
import hoslaLogo from "@/assets/hosla-logo.png";
import logoShraddha from "@/assets/logo-shraddha.png";
import { parseGallery } from "@/lib/event-media";
import { EventGallery } from "@/components/events/EventGallery";
import { SocialShare } from "@/components/events/SocialShare";
import { PaidEventPrompt } from "@/components/events/PaidEventPrompt";
import { eventPreviewUrl } from "@/lib/preview";


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
    membership_id: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchParams, setSearchParams] = useSearchParams();
  const [pendingRegId, setPendingRegId] = useState<string | null>(null);
  const [showPayPrompt, setShowPayPrompt] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);


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
    // Mobile: keep digits only, cap at 10 for Indian numbers.
    if (field === "mobile") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }
    // Name: strip characters that can't appear in a real name.
    if (field === "full_name") {
      value = value.replace(/[^A-Za-z\u00C0-\u024F\s.'-]/g, "");
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear a field's error as the user corrects it.
    setErrors((prev) => (prev[field] ? { ...prev, [field]: "" } : prev));
  };

  // Returns a map of field -> error message. Empty map means valid.
  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    const name = formData.full_name.trim();
    const email = formData.email.trim();

    if (name.length < 2) {
      errs.full_name = "Please enter your full name.";
    } else if (!/[A-Za-z\u00C0-\u024F]{2,}/.test(name)) {
      errs.full_name = "Name must contain letters.";
    }

    // Email is optional, but validate the format when provided.
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      errs.email = "Please enter a valid email address.";
    }

    if (fieldConfig.mobile.enabled) {
      const mobile = formData.mobile.trim();
      if (!mobile) {
        if (fieldConfig.mobile.required) errs.mobile = "Please enter your mobile number.";
      } else if (!/^[6-9]\d{9}$/.test(mobile)) {
        errs.mobile = "Enter a valid 10-digit mobile number.";
      }
    }

    if (fieldConfig.age.enabled) {
      const raw = formData.age.trim();
      if (!raw) {
        if (fieldConfig.age.required) errs.age = "Please enter your age.";
      } else {
        const age = Number(raw);
        if (!Number.isInteger(age) || age < 1 || age > 120) {
          errs.age = "Enter a valid age (1–120).";
        }
      }
    }

    if (fieldConfig.area.enabled) {
      const area = formData.area.trim();
      if (!area) {
        if (fieldConfig.area.required) errs.area = "Please enter your area / locality.";
      } else if (area.length < 2) {
        errs.area = "Please enter a valid area.";
      }
    }

    if (fieldConfig.medical_concerns.enabled && fieldConfig.medical_concerns.required &&
        !formData.medical_concerns.trim()) {
      errs.medical_concerns = "Please share any medical concerns.";
    }

    if (fieldConfig.source.enabled && fieldConfig.source.required && !formData.source) {
      errs.source = "Please select an option.";
    }

    return errs;
  };

  // Paid-event helpers -------------------------------------------------------
  const requiresPaymentSetup = !!event?.is_paid && (event?.price_inr ?? 0) > 0;

  const startCheckout = async (registrationId: string) => {
    setIsPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-event-checkout", {
        body: { registrationId, returnUrl: window.location.href.split("?")[0] },
      });
      if (error) throw error;
      if (data?.alreadyPaid) {
        setShowPayPrompt(false);
        setIsRegistered(true);
        return;
      }
      if (!data?.url) throw new Error(data?.error || "Could not start checkout");
      window.location.href = data.url as string;
    } catch (err) {
      console.error("Checkout error:", err);
      toast({
        title: "Could not open checkout",
        description: "Please try again, or call us and we'll help you register.",
        variant: "destructive",
      });
      setIsPaying(false);
    }
  };

  // Returning from Stripe: confirm the payment and show the success card.
  useEffect(() => {
    const payment = searchParams.get("payment");
    const regId = searchParams.get("reg");
    if (!payment || !regId) return;

    if (payment === "cancelled") {
      toast({
        title: "Payment cancelled",
        description: "Your details are saved — you can pay again any time to confirm your spot.",
      });
      setPendingRegId(regId);
      setShowPayPrompt(true);
      setSearchParams({}, { replace: true });
      return;
    }

    if (payment !== "success") return;
    setVerifyingPayment(true);
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-event-payment", {
          body: { registrationId: regId },
        });
        if (error) throw error;
        if (data?.paymentStatus === "paid") {
          setIsRegistered(true);
        } else {
          toast({
            title: "Payment not confirmed yet",
            description: "If you completed the payment, please refresh in a moment.",
          });
          setPendingRegId(regId);
          setShowPayPrompt(true);
        }
      } catch (err) {
        console.error("Payment verification error:", err);
        toast({
          title: "Could not confirm payment",
          description: "Please contact us and we'll confirm your registration.",
          variant: "destructive",
        });
      } finally {
        setVerifyingPayment(false);
        setSearchParams({}, { replace: true });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("payment"), searchParams.get("reg")]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast({ title: "Please fix the highlighted fields", variant: "destructive" });
      return;
    }

    const age = fieldConfig.age.enabled && formData.age ? Number(formData.age) : null;
    const email = formData.email.trim().toLowerCase();
    const mobile = formData.mobile.trim();

    setIsSubmitting(true);
    try {
      if (email) {
        const rateCheck = await checkRateLimit(email, "contact_messages");
        if (!rateCheck.allowed) {
          toast({ title: "Too many submissions", description: rateCheck.message, variant: "destructive" });
          setIsSubmitting(false);
          return;
        }
      }

      // Active members (synced from the team's members sheet) attend free when the admin allows it.
      let isMember = false;
      if (requiresPaymentSetup) {
        const { data: memberCheck } = await supabase.rpc("is_active_member", {
          _phone: mobile || "",
        });
        isMember = memberCheck === true;
      }

      const needsPayment = requiresPaymentSetup && !(event.members_free && isMember);

      const registrationId = crypto.randomUUID();
      const { error } = await supabase.from("event_registrations").insert({
        id: registrationId,
        event_id: event.id,
        full_name: formData.full_name.trim(),
        mobile: mobile || "—",
        email: email || null,
        age: age ?? 0,
        area: formData.area.trim() || "—",
        medical_concerns: formData.medical_concerns.trim() || null,
        source: formData.source || "Other",
        membership_id: formData.membership_id.trim().toUpperCase() || null,
        is_member: isMember,
        payment_status: needsPayment ? "pending" : "not_required",
        amount_inr: needsPayment ? event.price_inr : null,
      });
      if (error) throw error;

      if (needsPayment) {
        setPendingRegId(registrationId);
        setShowPayPrompt(true);
        return;
      }

      if (email) {
        try {
          await supabase.functions.invoke("send-event-email", {
            body: {
              type: "registration_confirmation",
              registrationId,
              eventId: event.id,
              name: formData.full_name.trim(),
              email,
            },
          });
        } catch {
          // Don't block on email failure
        }
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

  const gallery = parseGallery(event.gallery);
  const canRegister =
    event.enable_registration && event.registration_open && event.status !== "completed";
  // Recurring events (e.g. monthly Hosla Darbar) can show past highlights AND take
  // registrations for the next edition on the same page/link.
  const showHighlights = gallery.length > 0 || !canRegister;



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
                {requiresPaymentSetup && (
                  <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-xl border border-primary/25 shadow-sm">
                    <Ticket className="h-5 w-5 text-primary" />
                    <span className="font-medium text-foreground">
                      ₹{(event.price_inr ?? 0).toLocaleString("en-IN")} for non-members
                      {event.members_free ? " · Free for Hosla members" : ""}
                    </span>
                  </div>
                )}
              </div>


              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                {canRegister && (
                  <Button
                    size="lg"
                    className="mt-2 group"
                    onClick={() => document.getElementById("register")?.scrollIntoView({ behavior: "smooth" })}
                  >
                    Register Now
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                )}

                {gallery.length > 0 && (
                  <Button
                    size="lg"
                    variant={canRegister ? "outline" : "default"}
                    className="mt-2 group"
                    onClick={() => document.getElementById("highlights")?.scrollIntoView({ behavior: "smooth" })}
                  >
                    <Images className="mr-2 h-4 w-4" />
                    View Highlights
                  </Button>
                )}
              </div>
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

      {/* Past highlights (also shown while registration is open, for recurring events) */}
      {showHighlights && (
        <section id="highlights" className={`py-16 lg:py-24 scroll-mt-20 ${canRegister ? "bg-accent/20" : "bg-background"}`}>
          <div className="container px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto space-y-10">
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  <span className="text-primary font-medium uppercase tracking-widest text-sm">
                    {canRegister ? "Past Highlights" : "Event Highlights"}
                  </span>
                  <Star className="h-5 w-5 text-primary" />
                </div>
                <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground">
                  {gallery.length === 0
                    ? "This event has concluded"
                    : canRegister
                      ? `Moments from past editions of ${event.title}`
                      : `Moments from ${event.title}`}
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  {gallery.length === 0
                    ? "Registration for this event is closed. Explore our other events to stay involved."
                    : canRegister
                      ? "Here is a glimpse of what happened last time. Register above to join us for the next one!"
                      : "Thank you to everyone who joined us and made this possible. Relive the moments below — and feel free to share them."}
                </p>
              </div>

              {gallery.length > 0 && <EventGallery items={gallery} />}

              <div className="pt-6 border-t border-border/60 space-y-4">
                <p className="text-center text-sm text-muted-foreground">
                  Help us spread the word — share with friends and family.
                </p>
                <SocialShare
                  title={event.title}
                  url={`https://shraddha.hosla.in/register/${event.slug}`}
                  previewUrl={eventPreviewUrl(event.slug, event.updated_at)}
                />
              </div>

              <div className="text-center">
                {canRegister ? (
                  <Button
                    onClick={() => document.getElementById("register")?.scrollIntoView({ behavior: "smooth" })}
                    className="group"
                  >
                    Register for the next one
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                ) : (
                  <Button asChild variant="outline">
                    <Link to="/events">Explore more events</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Registration Form */}
      {canRegister && (
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
                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name *</Label>
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => handleChange("full_name", e.target.value)}
                          placeholder="Your full name"
                          autoComplete="name"
                          aria-invalid={!!errors.full_name}
                          className={errors.full_name ? "border-destructive focus-visible:ring-destructive" : ""}
                        />
                        {errors.full_name && <p className="text-sm text-destructive">{errors.full_name}</p>}
                      </div>

                      <div className="grid sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            inputMode="email"
                            value={formData.email}
                            onChange={(e) => handleChange("email", e.target.value)}
                            placeholder="you@example.com"
                            autoComplete="email"
                            aria-invalid={!!errors.email}
                            className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                          />
                          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                        </div>
                        {fieldConfig.mobile.enabled && (
                          <div className="space-y-2">
                            <Label htmlFor="mobile">Mobile {fieldConfig.mobile.required && "*"}</Label>
                            <Input
                              id="mobile"
                              type="tel"
                              inputMode="numeric"
                              value={formData.mobile}
                              onChange={(e) => handleChange("mobile", e.target.value)}
                              placeholder="10-digit mobile number"
                              autoComplete="tel-national"
                              maxLength={10}
                              aria-invalid={!!errors.mobile}
                              className={errors.mobile ? "border-destructive focus-visible:ring-destructive" : ""}
                            />
                            {errors.mobile && <p className="text-sm text-destructive">{errors.mobile}</p>}
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
                              inputMode="numeric"
                              min={1}
                              max={120}
                              value={formData.age}
                              onChange={(e) => handleChange("age", e.target.value)}
                              placeholder="Age"
                              aria-invalid={!!errors.age}
                              className={errors.age ? "border-destructive focus-visible:ring-destructive" : ""}
                            />
                            {errors.age && <p className="text-sm text-destructive">{errors.age}</p>}
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
                              autoComplete="address-level2"
                              aria-invalid={!!errors.area}
                              className={errors.area ? "border-destructive focus-visible:ring-destructive" : ""}
                            />
                            {errors.area && <p className="text-sm text-destructive">{errors.area}</p>}
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="membership_id">Hosla Membership ID (members only)</Label>
                          <Input
                            id="membership_id"
                            value={formData.membership_id}
                            onChange={(e) => handleChange("membership_id", e.target.value.toUpperCase())}
                            placeholder="e.g. SUJA6931"
                            maxLength={12}
                            className="font-mono"
                          />
                          <p className="text-xs text-muted-foreground">
                            Add it and this event will show up in your member profile.
                          </p>
                        </div>
                      </div>

                      {fieldConfig.source.enabled && (
                        <div className="space-y-2">
                          <Label htmlFor="source">How did you hear about us? {fieldConfig.source.required && "*"}</Label>
                          <Select value={formData.source} onValueChange={(v) => handleChange("source", v)}>
                            <SelectTrigger
                              id="source"
                              aria-invalid={!!errors.source}
                              className={errors.source ? "border-destructive focus:ring-destructive" : ""}
                            >
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                            <SelectContent>
                              {sourceOptions.map((opt) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.source && <p className="text-sm text-destructive">{errors.source}</p>}
                        </div>
                      )}

                      {fieldConfig.medical_concerns.enabled && (
                        <div className="space-y-2">
                          <Label htmlFor="medical_concerns">
                            Medical concerns {fieldConfig.medical_concerns.required ? "*" : "(optional)"}
                          </Label>
                          <Textarea
                            id="medical_concerns"
                            value={formData.medical_concerns}
                            onChange={(e) => handleChange("medical_concerns", e.target.value)}
                            placeholder="Any health conditions we should know about"
                            rows={3}
                            maxLength={500}
                            aria-invalid={!!errors.medical_concerns}
                            className={errors.medical_concerns ? "border-destructive focus-visible:ring-destructive" : ""}
                          />
                          {errors.medical_concerns && <p className="text-sm text-destructive">{errors.medical_concerns}</p>}
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
      )}

      {requiresPaymentSetup && pendingRegId && (
        <PaidEventPrompt
          open={showPayPrompt}
          onOpenChange={setShowPayPrompt}
          eventTitle={event.title}
          priceInr={event.price_inr ?? 0}
          paymentNote={event.payment_note}
          membersFree={event.members_free}
          isPaying={isPaying}
          onPay={() => startCheckout(pendingRegId)}
        />
      )}

      {verifyingPayment && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background/85 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Confirming your payment…</p>
        </div>
      )}
    </Layout>

  );
}
