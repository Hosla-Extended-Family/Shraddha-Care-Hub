import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, User, Phone, Lock, Send, CheckCircle2, UserCheck, Sparkles, AlertTriangle, IdCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  COUNTRY_CODES,
  validatePhone,
  toE164,
  syntheticEmail,
  composePassword,
  isValidPin,
} from "@/lib/phone-auth";
import { PhoneDigits } from "@/components/blog/PhoneDigits";

type Step = "form" | "existing-cred" | "existing-pending" | "new-choice" | "done-guest" | "done-linked" | "done-account";

const last10 = (s: string) => s.replace(/\D/g, "").slice(-10);

export interface GuestSubmitDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Called with { name, phone, author_id, is_approved_writer } to actually insert the blog row. */
  onSubmit: (data: { guest_name: string; guest_phone: string; author_id: string | null; is_approved_writer: boolean }) => Promise<{ ok: boolean; error?: string }>;
}

export function GuestSubmitDialog({ open, onOpenChange, onSubmit }: GuestSubmitDialogProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("form");
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [dial, setDial] = useState("+91");
  const [phone, setPhone] = useState("");

  // Existing account credentials
  const [membershipId, setMembershipId] = useState("");
  const [password, setPassword] = useState("");
  const [usePin, setUsePin] = useState(false);
  const [pin, setPin] = useState("");

  const [existingStatus, setExistingStatus] = useState<string | null>(null);

  const phoneRule = COUNTRY_CODES.find((c) => c.code === dial);
  const phoneLen = phoneRule ? phoneRule.digits[1] : 10;

  const resetAll = () => {
    setStep("form");
    setBusy(false);
    setName(""); setPhone(""); setMembershipId(""); setPassword(""); setPin("");
    setUsePin(false); setExistingStatus(null);
  };

  const handleClose = (o: boolean) => {
    if (!o) resetAll();
    onOpenChange(o);
  };

  const e164Now = () => {
    const v = validatePhone(dial, phone);
    return v.ok ? toE164(dial, v.digits) : null;
  };

  // Step 1 → decide which branch based on whether the phone already has a profile.
  const handleFormNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast({ title: "Please enter your name", variant: "destructive" });
    const v = validatePhone(dial, phone);
    if (!v.ok) return toast({ title: "Check phone number", description: v.msg, variant: "destructive" });

    setBusy(true);
    const e164 = toE164(dial, v.digits);
    const { data, error } = await supabase.rpc("guest_account_hint" as any, { _phone: e164 });
    setBusy(false);
    if (error) return toast({ title: "Couldn't verify phone", description: error.message, variant: "destructive" });

    const hint = Array.isArray(data) ? (data[0] as any) : null;
    if (!hint) {
      setStep("new-choice");
      return;
    }
    setExistingStatus(hint.status ?? null);
    // Credentials exist only once the office has issued a Membership ID.
    setStep(hint.has_membership_id ? "existing-cred" : "existing-pending");
  };

  /** Shared tail: with an active session, insert the blog then sign out again. */
  const submitAsSignedIn = async (authorId: string, e164: string) => {
    const { data: prof } = await supabase
      .from("profiles")
      .select("status, phone_e164")
      .eq("user_id", authorId)
      .maybeSingle();
    if (!prof) {
      await supabase.auth.signOut();
      setBusy(false);
      toast({
        title: "Account needs attention",
        description: "This login has no profile yet. Please contact the office.",
        variant: "destructive",
      });
      return false;
    }
    if ((prof as any).phone_e164 && last10((prof as any).phone_e164) !== last10(e164)) {
      await supabase.auth.signOut();
      setBusy(false);
      toast({
        title: "These credentials belong to a different phone number",
        description: "Go back and enter the phone number registered with this account.",
        variant: "destructive",
      });
      return false;
    }
    const approved = (prof as any).status === "approved";
    const res = await onSubmit({ guest_name: name.trim(), guest_phone: e164, author_id: authorId, is_approved_writer: approved });
    await supabase.auth.signOut();
    setBusy(false);
    if (!res.ok) {
      toast({ title: "Submit failed", description: res.error, variant: "destructive" });
      return false;
    }
    setStep(approved ? "done-linked" : "done-account");
    return true;
  };

  // Existing account — Membership ID + password (same credentials as the website sign-in).
  const handleExistingCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    const e164 = e164Now();
    if (!e164) return;
    const id = membershipId.trim().toUpperCase();
    if (!/^[A-Z]{4}\d{4}$/.test(id)) {
      return toast({ title: "Check your Membership ID", description: "It looks like ABCD1234.", variant: "destructive" });
    }
    if (password.length < 4) return toast({ title: "Enter your password", variant: "destructive" });

    setBusy(true);
    const { data, error } = await supabase.functions.invoke("member-login", {
      body: { membership_id: id, password },
    });
    const payload = data as any;
    if (error || !payload?.session) {
      setBusy(false);
      return toast({
        title: "Couldn't sign you in",
        description: payload?.error || "Wrong Membership ID or password.",
        variant: "destructive",
      });
    }
    const { data: sess, error: setErr } = await supabase.auth.setSession({
      access_token: payload.session.access_token,
      refresh_token: payload.session.refresh_token,
    });
    if (setErr || !sess.user) {
      setBusy(false);
      return toast({ title: "Couldn't start your session", description: setErr?.message, variant: "destructive" });
    }
    await submitAsSignedIn(sess.user.id, e164);
  };

  // Legacy fallback for old writers who still have a 4-digit PIN.
  const handleExistingPin = async (e: React.FormEvent) => {
    e.preventDefault();
    const e164 = e164Now();
    if (!e164) return;
    if (!isValidPin(pin)) return toast({ title: "PIN must be 4 digits", variant: "destructive" });

    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: syntheticEmail(e164),
      password: composePassword(e164, pin),
    });
    if (error || !data.user) {
      setBusy(false);
      return toast({ title: "Wrong PIN", description: "That PIN doesn't match this phone number.", variant: "destructive" });
    }
    await submitAsSignedIn(data.user.id, e164);
  };

  // New phone — request a writer account (no password chosen here) and attach this blog to it.
  const handleRequestAccount = async () => {
    const e164 = e164Now();
    if (!e164) return;

    setBusy(true);
    const placeholder = `Hosla-${crypto.randomUUID()}`;
    const { data, error } = await supabase.auth.signUp({
      email: syntheticEmail(e164),
      password: placeholder,
      options: {
        emailRedirectTo: `${window.location.origin}/blog`,
        data: { full_name: name.trim(), phone_e164: e164, country_code: dial },
      },
    });
    if (error || !data?.user) {
      setBusy(false);
      return toast({ title: "Couldn't send your request", description: error?.message, variant: "destructive" });
    }
    // New signups are `pending`, so the blog stays flagged as a guest submission
    // until an admin approves the writer (admin_approve_writer flips it automatically).
    const res = await onSubmit({ guest_name: name.trim(), guest_phone: e164, author_id: data.user.id, is_approved_writer: false });
    await supabase.auth.signOut();
    setBusy(false);
    if (!res.ok) return toast({ title: "Submit failed", description: res.error, variant: "destructive" });
    setStep("done-account");
  };

  const handleStayGuest = async () => {
    const e164 = e164Now();
    if (!e164) return;
    setBusy(true);
    const res = await onSubmit({ guest_name: name.trim(), guest_phone: e164, author_id: null, is_approved_writer: false });
    setBusy(false);
    if (!res.ok) return toast({ title: "Submit failed", description: res.error, variant: "destructive" });
    setStep("done-guest");
  };

  const handleGoBackToBlog = async () => {
    await supabase.auth.signOut();
    onOpenChange(false);
    navigate("/blog");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {step === "form" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">Almost there — a few quick details</DialogTitle>
              <DialogDescription>
                Tell us who you are so we can credit your blog when it's reviewed.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleFormNext} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="g-name" className="flex items-center gap-2"><User className="h-4 w-4" /> Your name</Label>
                <Input id="g-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="h-12" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Phone className="h-4 w-4" /> Phone number</Label>
                <div className="flex gap-2">
                  <Select value={dial} onValueChange={setDial}>
                    <SelectTrigger className="w-[110px] h-12"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-80">
                      {COUNTRY_CODES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          <span className="inline-flex items-center gap-2">
                            <span className="text-lg leading-none">{c.flag}</span>
                            <span className="font-medium">{c.code}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex-1 min-w-0">
                    <PhoneDigits
                      value={phone}
                      onChange={setPhone}
                      length={phoneLen}
                      ariaLabel="Phone number digits"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter exactly {phoneLen} digits — one per box.
                </p>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full h-12" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <Send className="h-4 w-4 ml-2" /></>}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}

        {step === "existing-cred" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl flex items-center gap-2">
                <UserCheck className="h-6 w-6 text-primary" /> Welcome back
              </DialogTitle>
              <DialogDescription>
                This phone number already has an account. Sign in with your{" "}
                <b>Membership ID and password</b> — the same ones you use on the website — and we'll
                save this blog to your profile under <i>My blogs</i>.
              </DialogDescription>
            </DialogHeader>

            {!usePin ? (
              <form onSubmit={handleExistingCredentials} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="g-mid" className="flex items-center gap-2"><IdCard className="h-4 w-4" /> Membership ID</Label>
                  <Input
                    id="g-mid"
                    autoComplete="username"
                    value={membershipId}
                    onChange={(e) => setMembershipId(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))}
                    placeholder="ABCD1234"
                    className="h-12 text-xl tracking-[0.2em] text-center uppercase"
                  />
                  <p className="text-xs text-muted-foreground">
                    First 4 letters of your name + last 4 digits of your phone number.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="g-pw" className="flex items-center gap-2"><Lock className="h-4 w-4" /> Password</Label>
                  <PasswordInput
                    id="g-pw"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    className="h-12 text-base"
                  />
                </div>
                <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
                  <Button type="button" variant="ghost" onClick={() => setStep("form")} disabled={busy}>Back</Button>
                  <Button type="submit" className="flex-1 h-12" disabled={busy}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in & submit"}
                  </Button>
                </DialogFooter>
                <div className="text-center">
                  <button type="button" onClick={() => setUsePin(true)} className="text-sm underline text-muted-foreground">
                    Use my PIN instead
                  </button>
                </div>
                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center">
                    <span className="bg-background px-2 text-xs text-muted-foreground">or</span>
                  </div>
                </div>
                <Button type="button" variant="outline" className="w-full h-12" onClick={handleStayGuest} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-2" /> Submit anyway as a guest</>}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Forgot your password? <Link to="/contact" className="underline text-primary hover:text-primary/80">Contact the office</Link> — they can issue a new one.
                </p>
              </form>

            ) : (
              <form onSubmit={handleExistingPin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="g-pin" className="flex items-center gap-2"><Lock className="h-4 w-4" /> Your 4-digit PIN</Label>
                  <Input
                    id="g-pin" type="text" inputMode="numeric" maxLength={4} autoComplete="off"
                    value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="••••" className="h-12 text-2xl tracking-[0.5em] text-center"
                  />
                </div>
                <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
                  <Button type="button" variant="ghost" onClick={() => setStep("form")} disabled={busy}>Back</Button>
                  <Button type="submit" className="flex-1 h-12" disabled={busy}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify PIN & submit"}
                  </Button>
                </DialogFooter>
                <div className="text-center">
                  <button type="button" onClick={() => setUsePin(false)} className="text-sm underline text-muted-foreground">
                    Use my Membership ID instead
                  </button>
                </div>
                <Button type="button" variant="outline" className="w-full h-12" onClick={handleStayGuest} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-2" /> Submit anyway as a guest</>}
                </Button>
              </form>

            )}
          </>
        )}

        {step === "existing-pending" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-amber-600" /> Your account is still being set up
              </DialogTitle>
              <DialogDescription>
                {existingStatus === "rejected" ? (
                  <>
                    This phone number has an account that isn't active. You can still submit this blog now —
                    the review team will see it. Please <Link to="/contact" className="underline text-primary">contact the office</Link> about your account.
                  </>
                ) : (
                  <>
                    We already have a request from this phone number, but the office hasn't issued your{" "}
                    <b>Membership ID and password</b> yet — so there's nothing to sign in with right now.
                    Submit the blog and we'll <b>link it to your profile automatically</b> once your account is activated.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 pt-2">
              <Button className="h-12" onClick={handleStayGuest} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-2" /> Submit my blog</>}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setStep("form")} disabled={busy}>Back</Button>
            </div>
          </>
        )}

        {step === "new-choice" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" /> Become a writer?
              </DialogTitle>
              <DialogDescription className="space-y-2">
                <span>
                  Ask for a writer account with this phone number and every blog you send — now and later — stays in your own profile.
                </span>
                <ul className="text-sm list-disc pl-5 space-y-1 mt-2">
                  <li>You choose no password here — the office reviews your request and then shares your <b>Membership ID and password</b> on WhatsApp or by phone.</li>
                  <li>After that you can edit drafts, read reviewer notes and track publication.</li>
                  <li>Your name and picture show as the author on published blogs.</li>
                </ul>
                <span className="block text-xs pt-2">
                  Prefer not to? You can still submit this one blog as a guest — it just won't be saved to any profile,
                  and next time we'll have to ask you again.
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 pt-2">
              <Button className="h-12" onClick={handleRequestAccount} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserCheck className="h-4 w-4 mr-2" /> Request a writer account & submit</>}
              </Button>
              <Button type="button" variant="outline" className="h-12" onClick={handleStayGuest} disabled={busy}>
                Submit as a one-time guest
              </Button>
              <Button type="button" variant="ghost" onClick={() => setStep("form")} disabled={busy}>Back</Button>
            </div>
          </>
        )}

        {step === "done-guest" && (
          <div className="text-center py-4">
            <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">Blog submitted</DialogTitle>
              <DialogDescription>
                Thanks {name}! Your blog is now with the review team, and we'll credit you as the author if it's published.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6">
              <Button className="w-full h-12" onClick={() => handleClose(false)}>Done</Button>
            </div>
          </div>
        )}

        {step === "done-linked" && (
          <div className="text-center py-4">
            <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">Blog linked to your account</DialogTitle>
              <DialogDescription>
                We attached this submission to your profile. Sign in with your Membership ID to see it under <i>My blogs</i>.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 flex flex-col gap-2">
              <Button className="w-full h-12" onClick={() => { onOpenChange(false); navigate("/auth?next=/profile"); }}>
                Sign in to my profile
              </Button>
              <Button variant="ghost" onClick={() => handleClose(false)}>Close</Button>
            </div>
          </div>
        )}

        {step === "done-account" && (
          <div className="text-center py-4">
            <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-amber-700" />
            </div>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">Blog submitted — account request sent</DialogTitle>
              <DialogDescription>
                Your blog has gone to the review team, and your request for a writer account is with the admin team.
                You don't have profile access yet — the Hosla / Shraddha team will share your Membership ID and password once it's approved.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 flex flex-col gap-2">
              <Button className="w-full h-12" onClick={handleGoBackToBlog} disabled={busy}>
                Go back to blog page
              </Button>
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                Profile, draft management and writer tools unlock only after admin approval.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
