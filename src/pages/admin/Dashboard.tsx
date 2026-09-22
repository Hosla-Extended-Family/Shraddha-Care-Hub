import { useState, useEffect } from "react";
import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileText, Users, Settings, LogOut, Loader2, Menu, X, UsersRound, Building2, MessageSquare, Heart, CalendarDays, ClipboardList, IdCard, CalendarClock, Share2, Handshake, BookOpen, Newspaper, UserCheck, Mail, ShieldCheck, HandCoins } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAdminRole } from "@/hooks/use-admin-role";
import logoShraddha from "@/assets/logo-shraddha.png";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  useAdminRole();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pendingWriters, setPendingWriters] = useState(0);
  const [pendingBlogs, setPendingBlogs] = useState(0);

  const loadBadges = async () => {
    const [{ count: writers }, { count: blogs }] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("blogs").select("*", { count: "exact", head: true }).eq("status", "submitted"),
    ]);
    setPendingWriters(writers ?? 0);
    setPendingBlogs(blogs ?? 0);
  };

  useEffect(() => {
    const onFocus = () => loadBadges();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => { if (!isLoading) loadBadges(); }, [isLoading, location.pathname]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/admin/login");
        return;
      }

      // Verify admin role
      const { data: isAdmin, error } = await supabase.rpc("is_admin");
      
      if (error || !isAdmin) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        navigate("/admin/login");
        return;
      }

      setIsLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        navigate("/admin/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/admin/login");
  };

  const navItems: { icon: any; label: string; path: string; badge?: number }[] = [
    { icon: LayoutDashboard, label: "Overview", path: "/admin/dashboard" },
    { icon: UserCheck, label: "Writers", path: "/admin/dashboard/writers", badge: pendingWriters },
    { icon: BookOpen, label: "Blog Moderation", path: "/admin/dashboard/blogs", badge: pendingBlogs },
    { icon: MessageSquare, label: "Messages", path: "/admin/dashboard/messages" },
    { icon: FileText, label: "Abuse Reports", path: "/admin/dashboard/reports" },
    { icon: Users, label: "Volunteers", path: "/admin/dashboard/volunteers" },
    { icon: Building2, label: "Partners", path: "/admin/dashboard/partners" },
    { icon: Heart, label: "Donations", path: "/admin/dashboard/donations" },
    { icon: CalendarDays, label: "Events", path: "/admin/dashboard/events" },
    { icon: CalendarClock, label: "Daily Routine", path: "/admin/dashboard/routine" },
    { icon: ClipboardList, label: "Event Registrations", path: "/admin/dashboard/registrations" },
    { icon: IdCard, label: "Members & Fees", path: "/admin/dashboard/members" },
    { icon: HandCoins, label: "Collect Fees", path: "/admin/dashboard/collect" },

    { icon: Newspaper, label: "Newsletters", path: "/admin/dashboard/newsletters" },
    { icon: Mail, label: "Blog Subscribers", path: "/admin/dashboard/subscribers" },
    { icon: Handshake, label: "Collaborate Page", path: "/admin/dashboard/collaborate" },
    { icon: Share2, label: "Preview Inspector", path: "/admin/dashboard/preview-inspector" },
    { icon: UsersRound, label: "Team", path: "/admin/dashboard/team" },
    { icon: Settings, label: "Settings", path: "/admin/dashboard/settings" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-50 h-14 bg-card border-b border-border px-4 flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center">
          <img src={logoShraddha} alt="Shraddha" className="h-7" />
        </Link>
        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" aria-label="Toggle menu" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      <div className="flex w-full">
        {/* Sidebar */}
        <aside className={cn(
          "fixed lg:sticky top-0 left-0 z-40 h-screen w-[17rem] max-w-[85vw] shrink-0 bg-card border-r border-border transition-transform lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="hidden lg:flex items-center p-6 border-b border-border">
              <img src={logoShraddha} alt="Shraddha" className="h-10" />
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto pt-16 lg:pt-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    location.pathname === item.path
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && item.badge > 0 ? (
                    <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">{item.badge}</Badge>
                  ) : null}
                </Link>
              ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-border space-y-2">
              <Link
                to="/"
                className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                Back to Website
              </Link>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                Logout
              </Button>
            </div>
          </div>
        </aside>

        {/* Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0 w-full overflow-x-hidden p-4 lg:p-8 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
