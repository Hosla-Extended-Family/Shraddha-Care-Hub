import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, Lock, UserRound, Sparkles } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import logoShraddha from "@/assets/logo-shraddha.png";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    (async () => {
      if (!isSupabaseConfigured) {
        setIsCheckingAuth(false);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: isAdmin } = await supabase.rpc("is_admin");
        if (isAdmin) { navigate("/admin/dashboard"); return; }
      }
      try {
        const { data } = await supabase.functions.invoke("admin-seed", { body: { action: "status" } });
        setNeedsSetup(Boolean((data as any)?.available));
      } catch {
        // ignore
      }
      setIsCheckingAuth(false);
    })();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) return setError("Enter your username and password");

    // In local development / preview mode without live Supabase credentials, allow demo admin sign-in
    if (!isSupabaseConfigured) {
      toast({ title: `Welcome, ${username || "admin"}! (Demo Mode)` });
      navigate("/admin/dashboard/study-circle");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("admin-auth", {
        body: { action: "login", username: username.trim(), password },
      });
      const payload = data as any;
      if (fnErr || !payload?.session) throw new Error(payload?.error || "Wrong username or password");
      const { error: setErr } = await supabase.auth.setSession({
        access_token: payload.session.access_token,
        refresh_token: payload.session.refresh_token,
      });
      if (setErr) throw setErr;
      toast({ title: `Welcome, ${payload.full_name || "admin"}!` });
      navigate("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "Sign-in failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4"><img src={logoShraddha} alt="Shraddha" className="h-14" /></div>
          <CardTitle className="font-serif text-2xl">Admin Login</CardTitle>
          <CardDescription>Sign in with the username and password given to you by the main admin.</CardDescription>
        </CardHeader>
        <CardContent>
          {!isSupabaseConfigured && (
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-3.5 mb-4 text-xs text-foreground">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-primary flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> Local Preview Demo Access
                  </p>
                  <p className="text-muted-foreground mt-1">
                    Username: <code className="bg-background px-1.5 py-0.5 rounded font-mono font-bold text-foreground">admin</code> &bull; Password: <code className="bg-background px-1.5 py-0.5 rounded font-mono font-bold text-foreground">admin</code>
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-semibold shrink-0 bg-background"
                  onClick={() => {
                    setUsername("admin");
                    setPassword("admin");
                  }}
                >
                  Auto-fill
                </Button>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-username" className="flex items-center gap-2"><UserRound className="h-4 w-4" /> Username</Label>
              <Input id="admin-username" value={username} autoComplete="username" autoCapitalize="none"
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, "").toLowerCase())}
                placeholder="e.g. riya.desk" className="h-12 text-base" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password" className="flex items-center gap-2"><Lock className="h-4 w-4" /> Password</Label>
              <PasswordInput id="admin-password" value={password} autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)} placeholder="Your password" className="h-12 text-base" />
            </div>
            <Button type="submit" className="w-full h-12" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : "Sign In"}
            </Button>
          </form>

          {needsSetup && (
            <p className="text-sm text-center mt-4">
              No admin accounts yet — <Link to="/admin/setup" className="underline font-medium">set up the main admin</Link>
            </p>
          )}
          <p className="text-sm text-muted-foreground text-center mt-4">
            Members and writers sign in <Link to="/auth" className="underline">here</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
