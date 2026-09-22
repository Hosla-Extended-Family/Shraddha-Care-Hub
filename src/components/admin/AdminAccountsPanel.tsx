import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ShieldCheck, UserPlus, KeyRound, Trash2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Admin = {
  user_id: string;
  full_name: string | null;
  admin_username: string;
  is_console_admin: boolean;
  roles: string[];
};

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  main_admin: "Main admin",
};

export default function AdminAccountsPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [busy, setBusy] = useState(false);

  // new account form
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");

  // password reset
  const [resetFor, setResetFor] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const call = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("admin-auth", { body });
    const payload = data as any;
    if (error || payload?.error) throw new Error(payload?.error || error?.message || "Action failed");
    return payload;
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data: isMain } = await supabase.rpc("is_main_admin");
      setAllowed(Boolean(isMain));
      if (isMain) {
        const payload = await call({ action: "list" });
        setAdmins(payload.admins ?? []);
      }
    } catch (e: any) {
      toast({ title: "Couldn't load admin accounts", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const suggestPassword = () =>
    setPassword(Array.from(crypto.getRandomValues(new Uint8Array(9)))
      .map((b) => "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 54]).join(""));

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await call({ action: "create", username, password, full_name: fullName, role });
      toast({ title: "Admin account created", description: `Share the username "${username}" and password with them.` });
      setFullName(""); setUsername(""); setPassword(""); setRole("admin");
      load();
    } catch (e: any) {
      toast({ title: "Couldn't create the account", description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const act = async (body: Record<string, unknown>, okMsg: string) => {
    setBusy(true);
    try {
      await call(body);
      toast({ title: okMsg });
      load();
    } catch (e: any) {
      toast({ title: "Action failed", description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (!allowed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Admin accounts</CardTitle>
          <CardDescription>Only the main admin can manage admin logins.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl">Admin accounts</h1>
          <p className="text-sm text-muted-foreground">
            Every admin signs in at <span className="font-medium">/admin/login</span> with a username and password you set here.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={busy}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><UserPlus className="h-5 w-5" /> Create an admin login</CardTitle>
          <CardDescription>No self-signup — you create the username and password and hand it over.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={create} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="a-name">Name</Label>
              <Input id="a-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Riya Sharma" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="a-user">Username</Label>
              <Input id="a-user" value={username} autoCapitalize="none"
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9._-]/g, "").toLowerCase())}
                placeholder="riya.desk" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="a-pw">Password</Label>
              <div className="flex gap-2">
                <Input id="a-pw" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters" className="h-11" />
                <Button type="button" variant="outline" className="h-11" onClick={suggestPassword}>Generate</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Access level</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin — day-to-day admin work</SelectItem>
                  <SelectItem value="main_admin">Main admin — full control</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" className="h-11" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                Create account
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Existing admins</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {admins.length === 0 && <p className="text-sm text-muted-foreground">No admin accounts yet.</p>}
          {admins.map((a) => (
            <div key={a.user_id} className="rounded-lg border p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{a.full_name || "Unnamed"}</p>
                  <p className="text-sm text-muted-foreground">{a.admin_username}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {a.roles.map((r) => <Badge key={r} variant="secondary">{ROLE_LABEL[r] ?? r}</Badge>)}
                  {a.is_console_admin && <Badge variant="outline">Console only</Badge>}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select value={a.roles[0] ?? "admin"} onValueChange={(v) => act({ action: "set_role", user_id: a.user_id, role: v }, "Access level updated")}>
                  <SelectTrigger className="h-10 w-[200px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="main_admin">Main admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => { setResetFor(a.user_id); setNewPassword(""); }}>
                  <KeyRound className="h-4 w-4 mr-2" /> Reset password
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive" disabled={busy}
                  onClick={() => { if (confirm(`Delete the admin login "${a.admin_username}"?`)) act({ action: "delete", user_id: a.user_id }, "Admin account deleted"); }}>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
              </div>

              {resetFor === a.user_id && (
                <div className="flex flex-wrap gap-2 items-center border-t pt-3">
                  <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min 8 characters)" className="h-10 max-w-xs" />
                  <Button size="sm" disabled={busy} onClick={async () => {
                    await act({ action: "set_password", user_id: a.user_id, password: newPassword }, "Password updated");
                    setResetFor(null); setNewPassword("");
                  }}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setResetFor(null)}>Cancel</Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
