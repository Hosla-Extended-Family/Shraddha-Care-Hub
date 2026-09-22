import { Link, useNavigate } from "react-router-dom";
import { LogIn, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthorAvatar } from "@/components/blog/AuthorAvatar";
import { useSessionProfile } from "@/hooks/use-session-profile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/** Account block for the mobile menu: sign in / sign up, or profile + log out. */
export function MobileAccountLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { loading, signedIn, profile } = useSessionProfile();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (loading) return <div className="h-14 rounded-xl bg-muted animate-pulse" />;

  if (!signedIn) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <Button asChild variant="outline" size="lg" className="h-14 text-base">
          <Link to="/auth" onClick={onNavigate}>
            <LogIn className="mr-2 h-5 w-5" /> Sign in
          </Link>
        </Button>
        <Button asChild variant="secondary" size="lg" className="h-14 text-base">
          <Link to="/auth?tab=signup" onClick={onNavigate}>Sign up</Link>
        </Button>
      </div>
    );
  }

  const signOut = async () => {
    await supabase.auth.signOut();
    onNavigate?.();
    toast({ title: "Signed out" });
    navigate("/", { replace: true });
  };

  return (
    <div className="space-y-3">
      <Link
        to="/profile"
        onClick={onNavigate}
        className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-accent transition-colors"
      >
        <AuthorAvatar avatarPath={profile?.avatar_url} name={profile?.full_name} className="h-11 w-11" />
        <div className="min-w-0">
          <p className="font-medium truncate">{profile?.full_name || "My profile"}</p>
          <p className="text-xs text-muted-foreground">
            {profile?.membership_id ? `Member ${profile.membership_id}` : "View my profile"}
          </p>
        </div>
        <User className="h-4 w-4 ml-auto text-muted-foreground" />
      </Link>
      <Button variant="outline" size="lg" className="w-full h-12 text-base" onClick={signOut}>
        <LogOut className="mr-2 h-5 w-5" /> Log out
      </Button>
    </div>
  );
}
