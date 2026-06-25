import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Marquee } from "@/components/ui/marquee";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Trophy,
  Medal,
  Users,
  Gamepad2,
  Search,
  ArrowLeft,
  Calendar,
  Clock,
  Star,
  Flame,
  Target,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Dices,
  Dumbbell,
  Zap,
  Award,
  Swords,
  Puzzle,
  ExternalLink,
  Info,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import hplPoster from "@/assets/HPL-poster.jpeg";
import hoslaLogo from "@/assets/hosla-logo.png";
import goldMedal from "@/assets/trophy-svgrepo-com.svg";
import silverMedal from "@/assets/ribbon-svgrepo-com.svg";
import bronzeMedal from "@/assets/third-svgrepo-com.svg";
import AllGamesModal from "@/components/hpl/AllGamesModal";

// ─── Types ────────────────────────────────────────────────────
interface Team {
  name: string;
  totalPoints: number;
  memberCount: number;
  average: string;
}

interface Player {
  name: string;
  team: string;
  points: number;
}

interface RecentMatch {
  game: string;
  time: string;
  winners: string;
}

interface HPLData {
  teams: Team[];
  players: Player[];
  recent: RecentMatch[];
}

// ─── Helpers ──────────────────────────────────────────────────
const HPL_API =
  "https://script.google.com/macros/s/AKfycbyxPlMd_zGAuQWn9PIco4Vj3gxZVOpeGOKnD-CnAcY1Zls2xaQVp7wEjAQGWeHNAuusdg/exec";

const REGISTRATION_LINK = "https://forms.gle/LQvaRz7msRf4TQUx7";
const PLAYERS_PER_PAGE = 15;

const cleanTeamName = (name: string) => {
  if (!name || name === "Unknown") return "Unknown";
  return name.split(" ").slice(0, 2).join(" ");
};

const formatMatchTime = (isoString: string) => {
  const date = new Date(isoString);
  if (isToday(date)) return `Today, ${format(date, "h:mm a")}`;
  if (isYesterday(date)) return `Yesterday, ${format(date, "h:mm a")}`;
  return format(date, "MMM d, h:mm a");
};

const RANK_COLORS = [
  "from-yellow-400 to-amber-500",
  "from-gray-300 to-gray-400",
  "from-orange-400 to-orange-600",
];

const RANK_ICONS = [goldMedal, silverMedal, bronzeMedal];

const RANK_BORDER_COLORS = [
  "border-yellow-400/60",
  "border-gray-400/60",
  "border-orange-400/60",
];

const TEAM_COLORS: Record<string, { bg: string; text: string; border: string; dot: string; glass: string }> = {
  "Team 1": { bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-700 dark:text-blue-300", border: "border-blue-300 dark:border-blue-700", dot: "bg-blue-500", glass: "bg-blue-500/15 dark:bg-blue-400/15 border-blue-400/30 dark:border-blue-300/30 text-blue-900 dark:text-blue-100" },
  "Team 2": { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-300 dark:border-emerald-700", dot: "bg-emerald-500", glass: "bg-emerald-500/15 dark:bg-emerald-400/15 border-emerald-400/30 dark:border-emerald-300/30 text-emerald-900 dark:text-emerald-100" },
  "Team 3": { bg: "bg-purple-100 dark:bg-purple-900/40", text: "text-purple-700 dark:text-purple-300", border: "border-purple-300 dark:border-purple-700", dot: "bg-purple-500", glass: "bg-purple-500/15 dark:bg-purple-400/15 border-purple-400/30 dark:border-purple-300/30 text-purple-900 dark:text-purple-100" },
  "Team 4": { bg: "bg-rose-100 dark:bg-rose-900/40", text: "text-rose-700 dark:text-rose-300", border: "border-rose-300 dark:border-rose-700", dot: "bg-rose-500", glass: "bg-rose-500/15 dark:bg-rose-400/15 border-rose-400/30 dark:border-rose-300/30 text-rose-900 dark:text-rose-100" },
};

const getTeamColor = (teamName: string) => {
  return TEAM_COLORS[teamName] || { bg: "bg-muted", text: "text-muted-foreground", border: "border-border", dot: "bg-muted-foreground", glass: "bg-white/15 dark:bg-white/10 border-white/20 text-foreground" };
};

// ─── Loading Skeleton ─────────────────────────────────────────
const HPLSkeleton = () => (
  <Layout>
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-background to-orange-50/30 dark:from-amber-950/20 dark:via-background dark:to-orange-950/10">
      <div className="container py-8 space-y-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    </div>
  </Layout>
);

// ─── Main Component ───────────────────────────────────────────
export default function HPL() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [teamFilter, setTeamFilter] = useState("all");
  const [showAllGames, setShowAllGames] = useState(false);

  const { data, isLoading, error } = useQuery<HPLData>({
    queryKey: ["hpl-data"],
    queryFn: async () => {
      const res = await fetch(HPL_API);
      if (!res.ok) throw new Error("Failed to fetch HPL data");
      return res.json();
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });

  // Sort teams by average descending
  const sortedTeams = useMemo(() => {
    if (!data?.teams) return [];
    return [...data.teams].sort(
      (a, b) => parseFloat(b.average) - parseFloat(a.average)
    );
  }, [data?.teams]);

  // Sort players by points descending
  const sortedPlayers = useMemo(() => {
    if (!data?.players) return [];
    return [...data.players].sort((a, b) => b.points - a.points);
  }, [data?.players]);

  // Filtered players
  const filteredPlayers = useMemo(() => {
    let result = sortedPlayers;
    if (teamFilter !== "all") {
      result = result.filter((p) => p.team === teamFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          cleanTeamName(p.team).toLowerCase().includes(q)
      );
    }
    return result;
  }, [sortedPlayers, searchQuery, teamFilter]);

  // Reset page when search changes
  const totalPages = Math.ceil(filteredPlayers.length / PLAYERS_PER_PAGE);
  const safePage = Math.min(currentPage, totalPages || 1);
  const paginatedPlayers = filteredPlayers.slice(
    (safePage - 1) * PLAYERS_PER_PAGE,
    safePage * PLAYERS_PER_PAGE
  );

  const leadingTeam = sortedTeams[0];

  // Reset page on search change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // Avg info tooltip — works on hover (desktop) & tap (mobile)
  const AvgInfoBadge = ({ size = "sm", teamName }: { size?: "sm" | "md"; teamName: string }) => {
    const [open, setOpen] = useState(false);
    const colors = getTeamColor(teamName);
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip open={open} onOpenChange={setOpen}>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="How is average calculated?"
              onClick={() => setOpen((o) => !o)}
              onTouchEnd={(e) => {
                e.preventDefault();
                setOpen((o) => !o);
              }}
              className="inline-flex items-center justify-center rounded-full focus:outline-none"
            >
              <Info
                className={`${
                  size === "md" ? "h-3.5 w-3.5" : "h-3 w-3"
                } cursor-help text-muted-foreground/70 hover:text-muted-foreground transition-colors`}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            align="center"
            avoidCollisions
            collisionPadding={12}
            className={`max-w-[220px] text-center backdrop-blur-md border ${colors.glass} !bg-opacity-80`}
          >
            <p className="font-medium"
            >Total points &divide; fixed denominator (largest team size) &mdash; same for all teams.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  if (isLoading) return <HPLSkeleton />;

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="pt-6 text-center space-y-4">
              <Gamepad2 className="h-12 w-12 mx-auto text-muted-foreground" />
              <h2 className="text-xl font-bold">Oops! Couldn't load HPL data</h2>
              <p className="text-muted-foreground">
                Please check your connection and try again.
              </p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-background to-orange-50/30 dark:from-amber-950/20 dark:via-background dark:to-orange-950/10">
        {/* ─── Back Navigation ─────────────────────────────── */}
        <div className="container pt-6">
          <Button variant="ghost" asChild className="gap-2 text-muted-foreground hover:text-foreground">
            <Link to="/corporate-care">
              <ArrowLeft className="h-4 w-4" />
              Back to Corporate Care
            </Link>
          </Button>
        </div>

        {/* ─── Hero / Event Banner ────────────────────────── */}
        <section className="container py-6 lg:py-10">
          <ScrollReveal>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 dark:from-orange-600 dark:via-amber-600 dark:to-yellow-600 p-1">
              <div className="relative rounded-[calc(1.5rem-4px)] overflow-hidden bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-500 dark:from-orange-700 dark:via-amber-700 dark:to-yellow-600">
                {/* Background decorative icons */}
                <div className="absolute inset-0 opacity-10">
                  <Trophy className="absolute top-4 left-4 h-16 w-16 text-white" />
                  <Star className="absolute top-8 right-8 h-14 w-14 text-white" />
                  <Target className="absolute bottom-4 left-1/3 h-12 w-12 text-white" />
                  <Medal className="absolute bottom-8 right-4 h-14 w-14 text-white" />
                </div>

                <div className="relative z-10 grid lg:grid-cols-2 gap-6 p-6 lg:p-10 items-center">
                  <div className="space-y-4 text-white">
                    <div className="flex items-center gap-3">
                      <div className="relative flex items-center justify-center px-4 py-2 rounded-lg bg-white/15 backdrop-blur-sm ring-1 ring-white/25 shadow-lg shadow-amber-900/10">
                        <img
                          src={hoslaLogo}
                          alt="Hosla"
                          className="h-8 w-auto object-contain drop-shadow-sm"
                        />
                      </div>
                      <Badge className="bg-white/20 text-white border-white/30 text-sm hover:bg-white/30">
                        <Flame className="h-3.5 w-3.5 mr-1" />
                        Live Event
                      </Badge>
                    </div>

                    <h1 className="text-3xl lg:text-5xl font-bold leading-tight">
                      Hosla Premier
                      <br />
                      League{" "}
                      <span className="inline-flex gap-1.5 align-middle">
                        <Swords className="inline h-7 w-7 lg:h-9 lg:w-9 text-yellow-200" />
                        <Dices className="inline h-7 w-7 lg:h-9 lg:w-9 text-yellow-200" />
                        <Gamepad2 className="inline h-7 w-7 lg:h-9 lg:w-9 text-yellow-200" />
                        <Puzzle className="inline h-7 w-7 lg:h-9 lg:w-9 text-yellow-200"/>
                      </span>
                    </h1>

                    <p className="text-lg lg:text-xl text-white/90 leading-relaxed max-w-lg">
                      A high-energy sports league for our beloved Senior Citizens!
                      Offline games (Carrom, Ludo, Badminton) & Online games
                      (Quizzes, Antakshari).
                    </p>
                    <p className="mt-2 pb-1 text-lg sm:text-xl lg:text-2xl font-semibold italic tracking-wide leading-relaxed max-w-lg">
                      <span className="bg-gradient-to-r from-yellow-200 via-white to-yellow-200 bg-clip-text text-transparent drop-shadow-lg pr-2">
                        "Celebrating Courage at Every Age."
                      </span>
                    </p>

                    <div className="flex flex-wrap gap-3 pt-2">
                      <a
                        href={REGISTRATION_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium hover:bg-white/30 transition-colors"
                      >
                        <Target className="h-4 w-4" />
                        Register Now!
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <button
                        type="button"
                        onClick={() => setShowAllGames(true)}
                        className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium hover:bg-white/25 transition-colors"
                      >
                        <Gamepad2 className="h-4 w-4" />
                        See all games
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-center lg:justify-end">
                    <motion.img
                      src={hplPoster}
                      alt="Hosla Premier League Poster"
                      className="rounded-2xl shadow-2xl max-h-72 lg:max-h-80 object-cover border-4 border-white/20"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* ─── Leading Team Hero ──────────────────────────── */}
        {leadingTeam && parseFloat(leadingTeam.average) > 0 && (
          <section className="container pb-8">
            <ScrollReveal delay={100}>
              <motion.div
                className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-100 via-amber-50 to-yellow-100 dark:from-yellow-900/30 dark:via-amber-900/20 dark:to-yellow-900/30 border-2 border-yellow-400/40 p-6 lg:p-8"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{ boxShadow: "0 0 30px rgba(251, 191, 36, 0.3), 0 0 60px rgba(251, 191, 36, 0.1)" }}
              >
                {/* Animated glow ring */}
                <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 opacity-30 blur-sm animate-pulse pointer-events-none" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-100 via-amber-50 to-yellow-100 dark:from-yellow-900/30 dark:via-amber-900/20 dark:to-yellow-900/30" />
                <Trophy className="absolute top-2 right-4 h-16 w-16 text-amber-400/20" />
                {/* Floating sparkles */}
                <motion.div
                  className="absolute top-4 left-8 pointer-events-none"
                  animate={{ y: [-4, 4, -4], opacity: [0.4, 1, 0.4], rotate: [0, 15, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkles className="h-6 w-6 text-yellow-500" />
                </motion.div>
                <motion.div
                  className="absolute bottom-4 right-16 pointer-events-none"
                  animate={{ y: [3, -5, 3], opacity: [0.3, 0.9, 0.3], rotate: [0, -10, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                >
                  <Star className="h-5 w-5 text-amber-500" />
                </motion.div>
                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                  <div className="flex-shrink-0">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-400/30">
                      <Trophy className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <div className="text-center sm:text-left flex-1">
                    <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5 justify-center sm:justify-start">
                      <Flame className="h-4 w-4" />
                      Current Leader
                    </p>
                    <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                      {cleanTeamName(leadingTeam.name)}
                    </h2>
                  </div>
                  <div className="flex gap-6 text-center">
                    <div>
                      <p className="text-4xl lg:text-5xl font-bold text-amber-600 dark:text-amber-400">
                        {parseFloat(leadingTeam.average).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1 justify-center sm:justify-start">
                        Avg Score
                        <AvgInfoBadge size="md" teamName={leadingTeam.name} />
                      </p>
                    </div>
                    <div>
                      <p className="text-4xl lg:text-5xl font-bold text-foreground">
                        {leadingTeam.totalPoints}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        Total Pts
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </ScrollReveal>
          </section>
        )}

        {/* ─── Team Standings ─────────────────────────────── */}
        <section className="container pb-10">
          <ScrollReveal delay={150}>
            <div className="flex items-center gap-3 mb-6">
              <Users className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
                Team Standings
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {sortedTeams.map((team, index) => (
                <motion.div
                  key={team.name}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card
                    className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                      index < 3 ? RANK_BORDER_COLORS[index] + " border-2" : ""
                    }`}
                  >
                    {index < 3 && (
                      <div
                        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${RANK_COLORS[index]}`}
                      />
                    )}

                    <CardContent className="pt-6 pb-5 px-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {index < 3 ? (
                            <img src={RANK_ICONS[index]} alt={`Rank ${index + 1}`} className="h-8 w-8" />
                          ) : (
                            <span className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-sm font-bold text-muted-foreground">
                              #{index + 1}
                            </span>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {team.memberCount} members
                        </Badge>
                      </div>

                      <h3 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                        <span className={`inline-block h-3 w-3 rounded-full ${getTeamColor(team.name).dot}`} />
                        {cleanTeamName(team.name)}
                      </h3>

                      <div className="flex items-baseline gap-4">
                        <div>
                          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                            {parseFloat(team.average).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            Average
                            <AvgInfoBadge teamName={team.name} />
                          </p>
                        </div>
                        <div>
                          <p className="text-xl font-semibold text-foreground">
                            {team.totalPoints}
                          </p>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">
                            Points
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </ScrollReveal>
        </section>

        {/* ─── Recent Matches Ticker ──────────────────────── */}
        {data?.recent && data.recent.length > 0 && (
          <section className="container pb-10">
            <ScrollReveal delay={200}>
              <div className="flex items-center gap-3 mb-6">
                <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
                  Recent Matches
                </h2>
              </div>

              <div className="overflow-hidden rounded-xl border bg-card">
                <Marquee speed="slow" pauseOnHover direction="left">
                  {data.recent.map((match, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-6 py-4 border-r border-border min-w-[300px]"
                    >
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 flex items-center justify-center">
                        <Gamepad2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-sm">
                          {match.game}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 max-w-[180px]">
                          <Trophy className="h-3 w-3 inline-block flex-shrink-0" />
                          <span className="truncate">{match.winners}</span>
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-auto">
                        {formatMatchTime(match.time)}
                      </span>
                    </div>
                  ))}
                </Marquee>
              </div>
            </ScrollReveal>
          </section>
        )}

        {/* ─── Individual MVP Leaderboard ─────────────────── */}
        <section className="container pb-16">
          <ScrollReveal delay={250}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <Star className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
                  Individual MVP Leaderboard
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <select
                  value={teamFilter}
                  onChange={(e) => { setTeamFilter(e.target.value); setCurrentPage(1); }}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="all">All Teams</option>
                  {(data?.teams || []).map((t) => (
                    <option key={t.name} value={t.name}>{cleanTeamName(t.name)}</option>
                  ))}
                </select>
                <div className="relative flex-1 sm:w-72 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10 text-base"
                  />
                </div>
              </div>
            </div>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-16 text-center font-semibold text-base">
                        Rank
                      </TableHead>
                      <TableHead className="font-semibold text-base">Player</TableHead>
                      <TableHead className="font-semibold text-base">Team</TableHead>
                      <TableHead className="text-right font-semibold text-base">
                        Points
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPlayers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          {searchQuery
                            ? "No players match your search."
                            : "No player data available yet."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedPlayers.map((player) => {
                        const originalRank = sortedPlayers.findIndex(
                          (p) => p.name === player.name
                        );
                        return (
                          <TableRow
                            key={player.name}
                            className={`transition-colors ${
                              originalRank < 3
                                ? "bg-amber-50/50 dark:bg-amber-950/20"
                                : ""
                            }`}
                          >
                            <TableCell className="text-center text-lg font-bold">
                              {originalRank < 3 ? (
                                <img src={RANK_ICONS[originalRank]} alt={`Rank ${originalRank + 1}`} className="h-8 w-8 inline-block" />
                              ) : (
                                <span className="text-muted-foreground">
                                  {originalRank + 1}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="font-semibold text-base text-foreground">
                              {player.name}
                            </TableCell>
                            <TableCell>
                              {!player.team || player.team === "Unknown" ? (
                                <Badge
                                  variant="outline"
                                  className="text-muted-foreground border-muted-foreground/30"
                                >
                                  Not Assigned
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className={`font-medium ${getTeamColor(player.team).bg} ${getTeamColor(player.team).text} ${getTeamColor(player.team).border}`}
                                >
                                  <span className={`inline-block h-2 w-2 rounded-full mr-1.5 ${getTeamColor(player.team).dot}`} />
                                  {cleanTeamName(player.team)}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                                {player.points}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    Showing {(safePage - 1) * PLAYERS_PER_PAGE + 1}–
                    {Math.min(safePage * PLAYERS_PER_PAGE, filteredPlayers.length)} of{" "}
                    {filteredPlayers.length} players
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={safePage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        // Show first, last, and pages near current
                        return page === 1 || page === totalPages || Math.abs(page - safePage) <= 1;
                      })
                      .map((page, idx, arr) => {
                        const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
                        return (
                          <span key={page} className="flex items-center">
                            {showEllipsis && (
                              <span className="px-1 text-muted-foreground text-sm">…</span>
                            )}
                            <Button
                              variant={page === safePage ? "default" : "outline"}
                              size="sm"
                              className="min-w-[36px]"
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </Button>
                          </span>
                        );
                      })}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={safePage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </ScrollReveal>
        </section>

        {/* ─── Footer CTA ─────────────────────────────────── */}
        <section className="container pb-16">
          <ScrollReveal delay={300}>
            <div className="text-center rounded-2xl bg-gradient-to-r from-orange-100 via-amber-50 to-yellow-100 dark:from-orange-900/20 dark:via-amber-900/15 dark:to-yellow-900/20 border border-amber-200/50 dark:border-amber-800/30 p-8 lg:p-12">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 text-amber-600 dark:text-amber-400" />
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">
                Every Player is a Champion!
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-6">
                HPL celebrates the spirit of courage and community. Keep playing,
                keep winning — age is just a number!
              </p>
              <Button asChild size="lg" className="bg-amber-600 hover:bg-amber-700 text-white">
                <a href={REGISTRATION_LINK} target="_blank" rel="noopener noreferrer">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Register Now!
                </a>
              </Button>
            </div>
          </ScrollReveal>
        </section>
      </div>

      <AllGamesModal open={showAllGames} onClose={() => setShowAllGames(false)} />
    </Layout>
  );
}
