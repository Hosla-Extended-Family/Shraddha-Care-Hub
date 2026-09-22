import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, LogOut, PenLine, User, Trash2, Save, Camera, CalendarCheck, HeartHandshake } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AuthorAvatar } from "@/components/blog/AuthorAvatar";
import { useI18n } from "@/i18n";
import { Switch } from "@/components/ui/switch";
import { BellRing, Send } from "lucide-react";
import { MembershipSection } from "@/components/membership/MembershipSection";


const STATUS_KEY: Record<string, string> = {
  draft: "Draft",
  submitted: "Under review",
  under_review: "Under review",
  needs_changes: "Edits needed",
  approved: "Approved",
  published: "Published",
  archived: "Archived",
};
const STATUS_COLOR: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-blue-100 text-blue-800",
  under_review: "bg-purple-100 text-purple-800",
  needs_changes: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  published: "bg-primary/20 text-primary",
  archived: "bg-slate-200 text-slate-700",
};

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useI18n();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // PIN change
  // Member activity
  const [events, setEvents] = useState<any[]>([]);
  const [donations, setDonations] = useState<any[]>([]);


  // Email digest settings
  const [digestOn, setDigestOn] = useState(false);
  const [digestEmail, setDigestEmail] = useState("");
  const [savingDigest, setSavingDigest] = useState(false);
  const [sendingDigest, setSendingDigest] = useState(false);

  const saveDigest = async (nextOn?: boolean) => {
    if (!profile) return;
    const on = nextOn ?? digestOn;
    const mail = digestEmail.trim();
    if (on && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) {
      toast({ title: t("Please enter a valid email address"), variant: "destructive" });
      return;
    }
    setSavingDigest(true);
    const { error } = await supabase
      .from("profiles")
      .update({ email_digest_enabled: on, digest_email: mail || null } as any)
      .eq("user_id", profile.user_id);
    setSavingDigest(false);
    if (error) {
      toast({ title: t("Couldn't save settings"), description: error.message, variant: "destructive" });
      return;
    }
    setDigestOn(on);
    toast({ title: on ? t("Email digests are on") : t("Email digests are off") });
  };

  const sendDigestNow = async () => {
    setSendingDigest(true);
    const { data, error } = await supabase.functions.invoke("send-blog-digest", { body: {} });
    setSendingDigest(false);
    if (error) {
      toast({ title: t("Couldn't send digest"), description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: (data as any)?.sent ? t("Digest sent") : t("Nothing new to send"),
      description: (data as any)?.sent ? t("Check your inbox in a moment.") : t("You have no unread likes or comments yet."),
    });
  };

  const load = async () => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      navigate("/auth?next=/profile", { replace: true });
      return;
    }
    const uid = sess.session.user.id;
    const { data: p } = await supabase.from("profiles").select("*").eq("user_id", uid).maybeSingle();
    if (!p || p.status !== "approved") {
      await supabase.auth.signOut();
      toast({
        title: t("Writer approval pending"),
        description: t("Profile access opens after the admin team approves your writer account."),
        variant: "destructive",
      });
      navigate("/blog", { replace: true });
      return;
    }
    const { data: b } = await supabase
      .from("blogs")
      .select("id, title, status, admin_notes, slug, updated_at, published_at")
      .eq("author_id", uid)
      .order("updated_at", { ascending: false });
    setProfile(p);
    setFullName(p?.full_name || "");
    setBio(p?.bio || "");
    setDigestOn(!!(p as any)?.email_digest_enabled);
    const realEmail = String((p as any)?.email || "").endsWith("@shraddha.local") ? "" : (p as any)?.email || "";
    setDigestEmail((p as any)?.digest_email || realEmail);
    setBlogs(b ?? []);
    loadActivity();
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const saveProfile = async () => {
    if (!fullName.trim()) {
      toast({ title: t("Name can't be empty"), variant: "destructive" });
      return;
    }
    setSavingName(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), bio: bio.trim() || null })
      .eq("user_id", profile.user_id);
    setSavingName(false);
    if (error) toast({ title: t("Save failed"), description: error.message, variant: "destructive" });
    else {
      toast({ title: t("Profile updated") });
      load();
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: t("Please pick an image file"), variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: t("Image too large"), description: t("Please pick an image under 5 MB."), variant: "destructive" });
      return;
    }
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${profile.user_id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setUploadingAvatar(false);
      toast({ title: t("Upload failed"), description: upErr.message, variant: "destructive" });
      return;
    }
    // Best-effort cleanup of previous avatar
    if (profile.avatar_url && profile.avatar_url !== path && !/^https?:\/\//i.test(profile.avatar_url)) {
      await supabase.storage.from("avatars").remove([profile.avatar_url]);
    }
    const { error: updErr } = await supabase.from("profiles").update({ avatar_url: path }).eq("user_id", profile.user_id);
    setUploadingAvatar(false);
    if (updErr) toast({ title: t("Save failed"), description: updErr.message, variant: "destructive" });
    else { toast({ title: t("Photo updated") }); load(); }
  };

  const loadActivity = async () => {
    const [ev, dn] = await Promise.all([
      supabase.rpc("my_event_registrations" as any),
      supabase.rpc("my_donations" as any),
    ]);
    setEvents((ev.data as any[]) ?? []);
    setDonations((dn.data as any[]) ?? []);
  };


  const logout = async () => {
    await supabase.auth.signOut();
    toast({ title: t("Signed out") });
    navigate("/", { replace: true });
  };

  const deleteBlog = async (id: string) => {
    if (!confirm(t("Delete this draft? This cannot be undone."))) return;
    const { error } = await supabase.from("blogs").delete().eq("id", id);
    if (error) toast({ title: t("Delete failed"), description: error.message, variant: "destructive" });
    else {
      toast({ title: t("Deleted") });
      load();
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const drafts = blogs.filter((b) => b.status === "draft" || b.status === "needs_changes");
  const inReview = blogs.filter((b) => b.status === "submitted" || b.status === "under_review" || b.status === "approved");
  const live = blogs.filter((b) => b.status === "published");

  const BlogRow = ({ r }: { r: any }) => (
    <div className="flex items-start justify-between gap-3 py-3 border-b last:border-0">
      <div className="min-w-0 flex-1">
        <div className="font-serif text-base font-semibold truncate">{r.title || "Untitled"}</div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <Badge className={STATUS_COLOR[r.status] || ""}>{t(STATUS_KEY[r.status] || r.status)}</Badge>
          <span className="text-xs text-muted-foreground">
            {t("Updated {d}", { d: new Date(r.updated_at).toLocaleDateString() })}
          </span>
        </div>
        {r.status === "needs_changes" && r.admin_notes && (
          <p className="text-sm text-amber-800 mt-2 bg-amber-50 border border-amber-200 rounded p-2">
            {r.admin_notes}
          </p>
        )}
      </div>
      <div className="flex gap-2 flex-wrap shrink-0">
        {r.status === "published" ? (
          <Button asChild variant="outline" size="sm" className="h-9">
            <Link to={`/blog/${r.slug ?? r.id}`}>{t("View")}</Link>
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm" className="h-9">
            <Link to={`/blog/write?id=${r.id}`}>{t("Edit")}</Link>
          </Button>
        )}
        {(r.status === "draft" || r.status === "needs_changes") && (
          <Button variant="ghost" size="icon" onClick={() => deleteBlog(r.id)} className="h-9 w-9" aria-label={t("Delete")}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>

    </div>
  );

  return (
    <Layout>
      <div className="container max-w-3xl px-4 py-8 md:py-12 space-y-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold">{t("My profile")}</h1>
            <p className="text-muted-foreground mt-1">{t("Manage your details, membership, events and blogs.")}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild size="lg" className="h-11">
              <Link to="/blog/write">
                <PenLine className="mr-2 h-4 w-4" />
                {t("Write blog")}
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-11" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              {t("Log out")}
            </Button>
          </div>
        </div>

        {/* Membership */}
        <MembershipSection profile={profile} />

        {/* Basic info */}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" />
              {t("Basic info")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <AuthorAvatar avatarPath={profile?.avatar_url} name={fullName} className="h-20 w-20 text-xl" />
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); e.currentTarget.value = ""; }}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="h-10"
                >
                  {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Camera className="h-4 w-4 mr-2" />}
                  {profile?.avatar_url ? t("Change photo") : t("Add photo")}
                </Button>
                <p className="text-xs text-muted-foreground mt-1.5">{t("JPG or PNG, up to 5 MB.")}</p>
              </div>
            </div>

            <div>
              <Label>{t("Full name")}</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-11 mt-1" />
            </div>
            <div>
              <Label>{t("Short bio (optional)")}</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 280))}
                placeholder={t("A line or two about yourself — this appears on your author page.")}
                rows={3}
                className="mt-1 resize-y"
              />
              <p className="text-xs text-muted-foreground mt-1">{bio.length}/280</p>
            </div>
            <Button
              onClick={saveProfile}
              disabled={savingName || (fullName === profile?.full_name && (bio || "") === (profile?.bio || ""))}
              className="h-11"
            >
              {savingName ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {t("Save changes")}
            </Button>

            <div>
              <Label>{t("Phone (used to log in)")}</Label>
              <Input value={profile?.phone_e164 || "—"} disabled className="h-11 mt-1 bg-muted" />
              <p className="text-xs text-muted-foreground mt-1">
                {t("Phone can't be changed. Contact an admin if you need to update it.")}
              </p>
            </div>
            <div>
              <Label>{t("Account status")}</Label>
              <div className="mt-1">
                <Badge
                  className={
                    profile?.status === "approved"
                      ? "bg-emerald-100 text-emerald-800"
                      : profile?.status === "rejected"
                      ? "bg-destructive/20 text-destructive"
                      : "bg-amber-100 text-amber-800"
                  }
                >
                  {t(profile?.status || "unknown")}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BellRing className="h-5 w-5 text-primary" />
              {t("Email notifications")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">{t("Email digests for likes and comments")}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("Get a summary email of new likes and comments on your blogs when you are away.")}
                </p>
              </div>
              <Switch checked={digestOn} onCheckedChange={(v) => saveDigest(v)} disabled={savingDigest} />
            </div>
            <div>
              <Label>{t("Notification email")}</Label>
              <Input
                type="email"
                inputMode="email"
                placeholder="you@example.com"
                value={digestEmail}
                onChange={(e) => setDigestEmail(e.target.value)}
                className="h-11 mt-1"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => saveDigest()} disabled={savingDigest} className="h-11">
                {savingDigest ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {t("Save settings")}
              </Button>
              <Button variant="outline" onClick={sendDigestNow} disabled={sendingDigest || !digestOn} className="h-11">
                {sendingDigest ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                {t("Send me a digest now")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Events attended */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarCheck className="h-5 w-5 text-primary" />
              {t("My events")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-muted-foreground py-4">
                {t("No event registrations yet. Add your Membership ID when you register and it will appear here.")}
              </p>
            ) : (
              <div className="divide-y">
                {events.map((e) => (
                  <div key={e.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">{e.event_title || t("Event")}</p>
                      <p className="text-sm text-muted-foreground">
                        {e.event_date ? new Date(e.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : new Date(e.created_at).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {e.payment_status === "paid" && <Badge className="bg-emerald-100 text-emerald-800">{t("Paid")}</Badge>}
                      <Badge className={e.checked_in ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"}>
                        {e.checked_in ? t("Attended") : t("Registered")}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Donations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <HeartHandshake className="h-5 w-5 text-primary" />
              {t("My donations")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {donations.length === 0 ? (
              <p className="text-muted-foreground py-4">{t("No donations on record yet.")}</p>
            ) : (
              <div className="divide-y">
                {donations.map((d) => (
                  <div key={d.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">₹{d.amount}</p>
                      <p className="text-sm text-muted-foreground">{new Date(d.created_at).toLocaleDateString("en-IN")}</p>
                    </div>
                    <Badge className={d.status === "verified" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>
                      {t(d.status === "verified" ? "Verified" : "Pending")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>


        {/* My blogs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PenLine className="h-5 w-5 text-primary" />
              {t("My blogs")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {blogs.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <p className="mb-3">{t("You haven't written any blogs yet.")}</p>
                <Button asChild>
                  <Link to="/blog/write">
                    <PenLine className="mr-2 h-4 w-4" />
                    {t("Start writing")}
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {drafts.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-1">{t("Drafts & edits needed ({n})", { n: drafts.length })}</h3>
                    <div>{drafts.map((r) => <BlogRow key={r.id} r={r} />)}</div>
                  </div>
                )}
                {inReview.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-1">{t("Awaiting review ({n})", { n: inReview.length })}</h3>
                    <div>{inReview.map((r) => <BlogRow key={r.id} r={r} />)}</div>
                  </div>
                )}
                {live.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-1">{t("Published ({n})", { n: live.length })}</h3>
                    <div>{live.map((r) => <BlogRow key={r.id} r={r} />)}</div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
