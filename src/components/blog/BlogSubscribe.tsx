import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Loader2, CheckCircle2, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Props {
  variant?: "card" | "banner";
  className?: string;
}

export function BlogSubscribe({ variant = "card", className }: Props) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [alreadyVerified, setAlreadyVerified] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const em = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      toast({ title: "Please enter a valid email", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("blog-subscribe", { body: { email: em } });
    setSubmitting(false);
    if (error) {
      toast({ title: "Couldn't subscribe", description: (error as any).message || "Please try again", variant: "destructive" });
      return;
    }
    setAlreadyVerified(!!(data as any)?.alreadyVerified);
    setDone(true);
  };

  const isBanner = variant === "banner";

  if (done) {
    return (
      <div className={cn(
        "flex items-center gap-3 rounded-2xl border p-5",
        isBanner ? "bg-primary/5 border-primary/30" : "bg-primary/5 border-primary/20",
        className
      )}>
        <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
        <div>
          <p className="font-semibold text-foreground">
            {alreadyVerified ? "You're already subscribed" : "Check your inbox to confirm"}
          </p>
          <p className="text-sm text-muted-foreground">
            {alreadyVerified
              ? "You'll keep getting new blog notifications."
              : "We sent a confirmation link to your email. Click it to start getting notifications."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-2xl border p-6 md:p-8",
      isBanner
        ? "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/30"
        : "bg-muted/30 border-border",
      className
    )}>
      <div className="flex items-start gap-3 mb-4">
        <div className="h-11 w-11 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-serif text-xl md:text-2xl font-bold">Get notified when a new blog drops</h3>
          <p className="text-sm text-muted-foreground mt-1">
            One email per new blog. No spam. Unsubscribe anytime with a single click.
          </p>
        </div>
      </div>
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 pl-10 bg-background"
            maxLength={255}
            required
          />
        </div>
        <Button type="submit" size="lg" disabled={submitting} className="h-12 px-6">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Subscribe
        </Button>
      </form>
    </div>
  );
}
