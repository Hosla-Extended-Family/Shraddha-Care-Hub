import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2, KeyRound, Phone, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logoShraddha from "@/assets/logo-shraddha.png";

export default function AdminBootstrap() {
  const [passphrase, setPassphrase] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [makeMain, setMakeMain] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ full_name: string | null; membership_id: string; roles: string[] } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    let payload: any = null;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-bootstrap`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
          },
          body: JSON.stringify({ passphrase, phone, password, make_main_admin: makeMain }),
        },
      );
      payload = await res.json().catch(() => null);
    } catch {
      payload = null;
    }
    setLoading(false);
    if (!payload?.ok) {
      return setError(payload?.error || "Could not reach the server. Please try again.");
    }
    setDone(payload);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-serif text-2xl">Admin access restored</CardTitle>
            <CardDescription>Use these details to sign in.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border p-4 space-y-1 text-sm">
              <p><span className="text-muted-foreground">Name:</span> {done.full_name || "—"}</p>
              <p><span className="text-muted-foreground">Membership ID:</span>{" "}
                <span className="font-mono text-base tracking-widest">{done.membership_id}</span></p>
              <p><span className="text-muted-foreground">Password:</span> the one you just set</p>
              <p><span className="text-muted-foreground">Roles:</span> {done.roles.join(", ")}</p>
            </div>
            <Button asChild className="w-full h-12"><Link to="/admin/login">Go to admin sign-in</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4"><img src={logoShraddha} alt="Shraddha" className="h-14" /></div>
          <CardTitle className="font-serif text-2xl">Admin recovery</CardTitle>
          <CardDescription>
            Set a password for an account and give it admin access. Needs the main-admin console passphrase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><KeyRound className="h-4 w-4" /> Console passphrase</Label>
              <PasswordInput value={passphrase} onChange={(e) => setPassphrase(e.target.value)}
                className="h-12" autoComplete="off" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Phone className="h-4 w-4" /> Phone number</Label>
              <Input type="tel" inputMode="numeric" value={phone}
                onChange={(e) => setPhone(e.target.value)} placeholder="9907166931" className="h-12" />
              <p className="text-xs text-muted-foreground">Any format — we match the last 10 digits.</p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> New password</Label>
              <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters" className="h-12" autoComplete="new-password" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={makeMain} onChange={(e) => setMakeMain(e.target.checked)}
                className="h-4 w-4 accent-primary" />
              Also make this account main admin
            </label>
            <Button type="submit" className="w-full h-12" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Set password & grant access"}
            </Button>
          </form>
          <p className="text-sm text-muted-foreground text-center mt-4">
            <Link to="/admin/login" className="underline">Back to admin sign-in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
