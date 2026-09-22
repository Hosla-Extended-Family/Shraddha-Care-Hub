import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Loader2, ShieldCheck, Sparkles, Ticket, ArrowRight, CheckCircle2 } from "lucide-react";

interface PaidEventPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventTitle: string;
  priceInr: number;
  paymentNote?: string | null;
  membersFree: boolean;
  isPaying: boolean;
  onPay: () => void;
}

const memberPerks = [
  "Free entry to this and all future paid events",
  "Priority seating and on-ground assistance",
  "Health, legal and counselling support all year",
];

export function PaidEventPrompt({
  open,
  onOpenChange,
  eventTitle,
  priceInr,
  paymentNote,
  membersFree,
  isPaying,
  onPay,
}: PaidEventPromptProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !isPaying && onOpenChange(next)}>
      <DialogContent className="p-0 gap-0 w-[calc(100vw-1.5rem)] sm:max-w-[520px] max-h-[92vh] overflow-hidden flex flex-col rounded-2xl">
        <DialogHeader className="px-5 sm:px-6 pt-6 pb-5 text-left bg-gradient-to-br from-accent/60 via-card to-card border-b border-border shrink-0">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 mb-3">
            <Ticket className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle className="font-serif text-xl sm:text-2xl">
            Your details are saved — one last step
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            <strong className="text-foreground">{eventTitle}</strong> is a paid event for
            non-members{membersFree ? ", and completely free for Hosla members" : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 min-h-0 px-5 sm:px-6 py-5 space-y-5">
          <div className="rounded-2xl border border-border bg-muted/40 p-4 flex items-baseline justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Registration fee
              </p>
              <p className="font-serif text-3xl font-bold text-foreground">
                ₹{priceInr.toLocaleString("en-IN")}
              </p>
            </div>
            <span className="text-xs text-muted-foreground text-right max-w-[45%]">
              One-time, per participant
            </span>
          </div>

          {paymentNote && (
            <p className="text-sm text-muted-foreground leading-relaxed">{paymentNote}</p>
          )}

          {membersFree && (
            <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  Better value: become a Hosla member
                </span>
              </div>
              <ul className="space-y-2">
                {memberPerks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {membersFree && (
              <Button asChild size="lg" className="w-full group">
                <Link to="/membership-plans">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Become a Hosla member
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            )}
            <Button
              size="lg"
              variant={membersFree ? "outline" : "default"}
              className="w-full"
              onClick={onPay}
              disabled={isPaying}
            >
              {isPaying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening secure checkout…
                </>
              ) : (
                <>Continue and pay ₹{priceInr.toLocaleString("en-IN")}</>
              )}
            </Button>
          </div>

          <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Secure payment via Stripe. Cards, UPI and netbanking supported.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
