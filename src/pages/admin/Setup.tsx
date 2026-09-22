import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [checking, setChecking] = useState(true);
  const [available, setAvailable] = useState(false);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.functions.invoke("admin-seed", { body: { action: "status" } });
      setAvailable(Boolean((data as any)?.available));
      setChecking(false);
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) return setError("The two passwords don't match");
    setBusy(true);
    const { data, error: fnErr } = await supabase.functions.invoke("admin-seed", {
      body: { username: username.trim(), password, full_name: fullName.trim() },
    });
    setBusy(false);
    const payload = data as any;
    if (fnErr || !payload?.ok) return setError(payload?.error || fnErr?.message || "Setup failed");
    toast({ title: "Main admin created", description: "Sign in on the main-admin console." });
    navigate("/admin/hq");
  };

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-serif text-2xl">Main admin setup</CardTitle>
          <CardDescription>
            Create the one main-admin account. You'll use it on the hidden console to create
            logins for every other admin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!available ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Setup is already complete. <Link to="/admin/hq" className="underline">Open the main-admin console</Link>
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {error && (
                <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="s-name">Your name</Label>
                <Input id="s-name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-12" placeholder="Sujal Thakkar" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-user">Main admin ID</Label>
                <Input id="s-user" value={username} autoCapitalize="none"
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9._-]/g, "").toLowerCase())}
                  className="h-12" placeholder="mainadmin" />
                <p className="text-xs text-muted-foreground">Letters, numbers, dot, dash or underscore. 3-32 characters.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-pw">Password</Label>
                <PasswordInput id="s-pw" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12" placeholder="At least 8 characters" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-pw2">Repeat password</Label>
                <PasswordInput id="s-pw2" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-12" />
              </div>
              <Button type="submit" className="w-full h-12" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create main admin"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
