import { Link, useNavigate } from "react-router-dom";
import { LogOut, PenLine, User, IdCard, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuthorAvatar } from "@/components/blog/AuthorAvatar";
import { useSessionProfile } from "@/hooks/use-session-profile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/** Header account control: sign-in / sign-up for guests, avatar menu for members. */
export function UserMenu({ className }: { className?: string }) {
  const { loading, signedIn, profile } = useSessionProfile();
  const navigate = useNavigate();
  const { toast } = useToast();

  const signOut = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out" });
    navigate("/", { replace: true });
  };

  if (loading) return <div className={cn("h-10 w-10 rounded-full bg-muted animate-pulse", className)} />;

  if (!signedIn) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button asChild variant="ghost" size="sm" className="h-10">
          <Link to="/auth">
            <LogIn className="h-4 w-4 mr-1.5" /> Sign in
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="h-10">
          <Link to="/auth?tab=signup">Sign up</Link>
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn("rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring", className)} aria-label="Account menu">
        <AuthorAvatar avatarPath={profile?.avatar_url} name={profile?.full_name} className="h-10 w-10" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 z-[70]">
        <DropdownMenuLabel className="space-y-0.5">
          <p className="truncate">{profile?.full_name || "My account"}</p>
          {profile?.membership_id && (
            <p className="text-xs font-normal text-muted-foreground flex items-center gap-1">
              <IdCard className="h-3 w-3" /> {profile.membership_id}
            </p>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile"><User className="h-4 w-4 mr-2" /> My profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/blog/write"><PenLine className="h-4 w-4 mr-2" /> Write a blog</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4 mr-2" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
