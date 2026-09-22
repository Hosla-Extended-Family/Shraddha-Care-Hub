import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Trash2, Download, CheckCircle2, Clock, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Sub {
  id: string;
  email: string;
  verified: boolean;
  verified_at: string | null;
  created_at: string;
}

export default function Subscribers() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("blog_subscribers" as any)
      .select("id, email, verified, verified_at, created_at")
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Couldn't load subscribers", description: error.message, variant: "destructive" });
    setRows((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const verifyManually = async (id: string, email: string) => {
    if (!confirm(`Mark ${email} as verified? They will start receiving new-blog notifications.`)) return;
    const { error } = await supabase
      .from("blog_subscribers" as any)
      .update({ verified: true, verified_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return toast({ title: "Verify failed", description: error.message, variant: "destructive" });
    setRows((r) => r.map((x) => (x.id === id ? { ...x, verified: true, verified_at: new Date().toISOString() } : x)));
    toast({ title: "Verified", description: `${email} will now get new-blog emails.` });
  };

  const remove = async (id: string, email: string) => {
    if (!confirm(`Remove ${email} from the subscribers list?`)) return;
    const { error } = await supabase.from("blog_subscribers" as any).delete().eq("id", id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    setRows((r) => r.filter((x) => x.id !== id));
    toast({ title: "Removed" });
  };

  const filtered = rows.filter((r) => r.email.toLowerCase().includes(q.trim().toLowerCase()));
  const verified = rows.filter((r) => r.verified).length;
  const pending = rows.length - verified;

  const exportCsv = () => {
    const header = "email,verified,verified_at,created_at\n";
    const body = rows
      .map((r) => `${r.email},${r.verified},${r.verified_at ?? ""},${r.created_at}`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `blog-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Blog Subscribers</h1>
          <p className="text-muted-foreground mt-1">People who opted in for new-blog email notifications.</p>
        </div>
        <Button onClick={exportCsv} variant="outline">
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold flex items-center gap-2"><Mail className="h-6 w-6 text-primary" />{rows.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Verified</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold flex items-center gap-2 text-primary"><CheckCircle2 className="h-6 w-6" />{verified}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pending verification</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold flex items-center gap-2 text-amber-600"><Clock className="h-6 w-6" />{pending}</CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by email" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">No subscribers yet.</div>
          ) : (
            <div className="divide-y">
              {filtered.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{r.email}</span>
                      {r.verified ? (
                        <Badge className="bg-primary/15 text-primary hover:bg-primary/20"><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-700 border-amber-300"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Joined {new Date(r.created_at).toLocaleDateString()}
                      {r.verified_at && ` · Verified ${new Date(r.verified_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!r.verified && (
                      <Button size="sm" variant="outline" onClick={() => verifyManually(r.id, r.email)} className="text-primary border-primary/40 hover:bg-primary/10">
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Verify
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => remove(r.id, r.email)} aria-label="Remove">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
