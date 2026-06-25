import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Heart, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logoShraddha from "@/assets/logo-shraddha.png";

interface NavChild {
  name: string;
  path: string;
  description: string;
  accent?: "pink" | "violet";
}

interface NavGroup {
  name: string;
  path?: string;
  children?: NavChild[];
}

const navGroups: NavGroup[] = [
  { name: "Home", path: "/" },
  {
    name: "About",
    children: [
      { name: "About Us", path: "/about", description: "Our mission & story" },
      { name: "Our Team", path: "/about#team", description: "Meet the people behind our work" },
    ],
  },
  {
    name: "Explore Care Plans",
    children: [
      { name: "Membership Plans", path: "/membership-plans", description: "Explore our care plans and corporate initiatives", accent: "pink" },
      { name: "Corporate Care", path: "/corporate-care", description: "Programs for your employees' parents", accent: "violet" },
    ],
  },
  {
    name: "Projects & Events",
    children: [
      { name: "Events", path: "/events", description: "Upcoming & past initiatives" },
      { name: "Register for Events", path: "/register", description: "Sign up for our upcoming events", accent: "pink" },
      { name: "Daily Routine", path: "/daily-routine", description: "Today's wellness schedule & join links" },
      { name: "HPL", path: "/hpl", description: "Hosla Premier League" },
      { name: "Games", path: "/games", description: "Fun activities for seniors" },
    ],
  },
  {
    name: "Community",
    children: [
      { name: "Volunteer", path: "/volunteer", description: "Join our mission" },
      { name: "Legal Resources", path: "/legal-resources", description: "Know your rights" },
      { name: "Contact", path: "/contact", description: "Get in touch with us" },
    ],
  },
  { name: "Donate", path: "/donate" },
];

function isGroupActive(group: NavGroup, pathname: string, hash: string): boolean {
  if (group.path) return pathname === group.path;
  return group.children?.some((c) => {
    if (c.path.includes('#')) {
      const [p, h] = c.path.split('#');
      return pathname === p && hash === `#${h}`;
    }
    return pathname === c.path;
  }) ?? false;
}

const accentStyles = {
  pink: { active: "bg-pink-100 text-pink-700", idle: "text-pink-600 hover:bg-pink-50", desc: "text-pink-400" },
  violet: { active: "bg-violet-100 text-violet-700", idle: "text-violet-600 hover:bg-violet-50", desc: "text-violet-400" },
} as const;

function DesktopDropdown({ group }: { group: NavGroup }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleEnter = () => {
    clearTimeout(timeoutRef.current);
    setOpen(true);
  };
  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  if (!group.children) {
    return (
      <Link
        to={group.path!}
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary py-2",
          location.pathname === group.path ? "text-primary" : "text-muted-foreground"
        )}
      >
        {group.name}
      </Link>
    );
  }

  const active = isGroupActive(group, location.pathname, location.hash);

  return (
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <button
        className={cn(
          "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary py-2",
          active ? "text-primary" : "text-muted-foreground"
        )}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {group.name}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} />
      </button>

      <div
        className={cn(
          "absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-all duration-200",
          open ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-1"
        )}
      >
        <div className="bg-popover border border-border rounded-xl shadow-lg p-2 min-w-[220px]">
          {group.children.map((child) => {
            const a = child.accent ? accentStyles[child.accent] : null;
            return (
            <Link
              key={child.path}
              to={child.path}
              onClick={() => setOpen(false)}
              className={cn(
                "block px-3 py-2.5 rounded-lg transition-colors",
                a
                  ? location.pathname === child.path ? a.active : a.idle
                  : location.pathname === child.path
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-accent"
              )}
            >
              <div className="text-sm font-medium">{child.name}</div>
              <div className={cn("text-xs mt-0.5", a ? a.desc : "text-muted-foreground")}>{child.description}</div>
            </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    setIsMenuOpen(false);
    setExpandedGroup(null);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMenuOpen]);

  const toggleGroup = (name: string) => {
    setExpandedGroup((prev) => (prev === name ? null : name));
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center">
            <img src={logoShraddha} alt="Shraddha" className="h-10" width={158} height={40} />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {navGroups.map((group) => (
              <DesktopDropdown key={group.name} group={group} />
            ))}
            <Button asChild size="sm">
              <Link to="/donate">Support Us</Link>
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden relative z-[60] w-12 h-12 flex items-center justify-center rounded-lg transition-colors hover:bg-accent active:bg-accent/80 touch-manipulation"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
          >
            <div className="relative w-6 h-5 flex flex-col justify-between">
              <span className={cn("block h-0.5 w-6 bg-foreground rounded-full transition-all duration-300 ease-in-out origin-center", isMenuOpen && "rotate-45 translate-y-[9px]")} />
              <span className={cn("block h-0.5 w-6 bg-foreground rounded-full transition-all duration-300 ease-in-out", isMenuOpen && "opacity-0 scale-x-0")} />
              <span className={cn("block h-0.5 w-6 bg-foreground rounded-full transition-all duration-300 ease-in-out origin-center", isMenuOpen && "-rotate-45 -translate-y-[9px]")} />
            </div>
          </button>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 top-16 bg-background z-[55] transition-all duration-300 ease-in-out",
          isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        )}
      >
        <nav className="container h-full py-6 px-4 flex flex-col overflow-y-auto">
          <div className="flex flex-col gap-1">
            {navGroups.map((group, groupIndex) => {
              if (!group.children) {
                return (
                  <Link
                    key={group.name}
                    to={group.path!}
                    className={cn(
                      "flex items-center px-4 py-4 text-base font-medium rounded-xl transition-all duration-300 active:scale-[0.98] touch-manipulation",
                      location.pathname === group.path ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent",
                      isMenuOpen ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"
                    )}
                    style={{ transitionDelay: isMenuOpen ? `${groupIndex * 50}ms` : "0ms" }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {group.name}
                  </Link>
                );
              }

              const isExpanded = expandedGroup === group.name;
              const active = isGroupActive(group, location.pathname, location.hash);

              return (
                <div
                  key={group.name}
                  className={cn(
                    "transition-all duration-300",
                    isMenuOpen ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"
                  )}
                  style={{ transitionDelay: isMenuOpen ? `${groupIndex * 50}ms` : "0ms" }}
                >
                  <button
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-4 text-base font-medium rounded-xl transition-colors touch-manipulation",
                      active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent"
                    )}
                    onClick={() => toggleGroup(group.name)}
                    aria-expanded={isExpanded}
                  >
                    {group.name}
                    <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isExpanded && "rotate-180")} />
                  </button>

                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-300",
                      isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    )}
                  >
                    <div className="pl-4 pb-2 flex flex-col gap-1">
                      {group.children.map((child) => {
                        const a = child.accent ? accentStyles[child.accent] : null;
                        return (
                        <Link
                          key={child.path}
                          to={child.path}
                          className={cn(
                            "flex flex-col px-4 py-3 rounded-lg transition-colors touch-manipulation",
                            a
                              ? location.pathname === child.path ? a.active : a.idle
                              : location.pathname === child.path
                                ? "bg-primary/10 text-primary"
                                : "text-foreground hover:bg-accent"
                          )}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <span className="text-sm font-medium">{child.name}</span>
                          <span className={cn("text-xs", a ? a.desc : "text-muted-foreground")}>{child.description}</span>
                        </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile CTA Button */}
          <div
            className={cn(
              "mt-6 pt-6 border-t border-border transition-all duration-300",
              isMenuOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            )}
            style={{ transitionDelay: isMenuOpen ? `${navGroups.length * 50 + 100}ms` : "0ms" }}
          >
            <Button asChild size="lg" className="w-full h-14 text-base">
              <Link to="/donate" onClick={() => setIsMenuOpen(false)}>
                <Heart className="mr-2 h-5 w-5" />
                Support Us
              </Link>
            </Button>
          </div>
        </nav>
      </div>
    </>
  );
}
