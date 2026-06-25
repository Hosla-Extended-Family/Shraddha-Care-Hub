import { useState, useEffect } from "react";
import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileText, Users, Settings, LogOut, Loader2, Menu, X, UsersRound, Building2, MessageSquare, Heart, CalendarDays, ClipboardList, IdCard, CalendarClock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import logoShraddha from "@/assets/logo-shraddha.png";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  const navItems = [
    { icon: LayoutDashboard, label: "Overview", path: "/admin/dashboard" },
    { icon: MessageSquare, label: "Messages", path: "/admin/dashboard/messages" },
    { icon: FileText, label: "Abuse Reports", path: "/admin/dashboard/reports" },
    { icon: Users, label: "Volunteers", path: "/admin/dashboard/volunteers" },
    { icon: Building2, label: "Partners", path: "/admin/dashboard/partners" },
    { icon: Heart, label: "Donations", path: "/admin/dashboard/donations" },
    { icon: CalendarDays, label: "Events", path: "/admin/dashboard/events" },
    { icon: CalendarClock, label: "Daily Routine", path: "/admin/dashboard/routine" },
    { icon: ClipboardList, label: "Event Registrations", path: "/admin/dashboard/registrations" },
    { icon: IdCard, label: "Memberships", path: "/admin/dashboard/memberships" },
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
      <div className="lg:hidden sticky top-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src={logoShraddha} alt="Shraddha" className="h-8" />
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={cn(
          "fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-card border-r border-border transition-transform lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="hidden lg:flex items-center p-6 border-b border-border">
              <img src={logoShraddha} alt="Shraddha" className="h-10" />
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto mt-16 lg:mt-0">
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
                  {item.label}
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
        <main className="flex-1 p-4 lg:p-8 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
