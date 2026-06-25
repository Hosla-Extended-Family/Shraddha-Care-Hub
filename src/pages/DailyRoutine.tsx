import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Clock, MapPin, Radio, Loader2, CalendarDays, Sun } from "lucide-react";
import { JoinButtons } from "@/components/routine/JoinButtons";
import {
  WEEK_DAYS, DAY_LABEL, getISTNow, formatTime12, getLiveSessionId,
  hasJoinLink, timeToMinutes, type RoutineSession,
} from "@/lib/routine";
import { cn } from "@/lib/utils";

export default function DailyRoutine() {
  const [now, setNow] = useState(() => getISTNow());
  const [selectedDay, setSelectedDay] = useState<number>(() => getISTNow().day);
  const liveRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  // Refresh "now" every 30s so the live highlight stays accurate.
  useEffect(() => {
    const id = setInterval(() => setNow(getISTNow()), 30000);
    return () => clearInterval(id);
  }, []);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["routine-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("routine_sessions")
        .select("*")
        .eq("is_active", true)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true })
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as RoutineSession[];
    },
  });

  const isToday = selectedDay === now.day;

  const daySessions = useMemo(
    () =>
      sessions
        .filter((s) => s.day_of_week === selectedDay)
        .sort(
          (a, b) =>
            (timeToMinutes(a.start_time) ?? 0) - (timeToMinutes(b.start_time) ?? 0) ||
            a.display_order - b.display_order,
        ),
    [sessions, selectedDay],
  );

  const liveId = useMemo(
    () => (isToday ? getLiveSessionId(daySessions, now.minutes) : null),
    [daySessions, now.minutes, isToday],
  );

  const liveSession = useMemo(
    () => daySessions.find((s) => s.id === liveId) ?? null,
    [daySessions, liveId],
  );

  // Next upcoming session for today (first session that hasn't started yet).
  const nextId = useMemo(() => {
    if (!isToday || liveId) return null;
    const upcoming = daySessions.find(
      (s) => (timeToMinutes(s.start_time) ?? 0) > now.minutes,
    );
    return upcoming?.id ?? null;
  }, [daySessions, now.minutes, isToday, liveId]);

  // On first load, if a session is live today, gently scroll it into view.
  useEffect(() => {
    if (liveSession && liveRef.current && !hasScrolled.current) {
      hasScrolled.current = true;
      setTimeout(() => {
        liveRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 400);
    }
  }, [liveSession]);

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent/40 to-background py-12 lg:py-16">
        <div className="container relative z-10 text-center">
          <ScrollReveal>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Sun className="h-4 w-4" />
              Hosla Senior Citizen Wellness
            </span>
            <h1 className="font-serif text-3xl lg:text-5xl font-bold text-foreground mb-3">
              Daily Routine
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base lg:text-lg">
              Your daily schedule of wellness sessions. Tap a coloured button to join
              instantly — no scrolling or guesswork needed.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="py-8 lg:py-12">
        <div className="container max-w-5xl">
          {/* Day selector */}
          <div className="mb-8">
            {/* Mobile: dropdown */}
            <div className="lg:hidden">
              <label className="block text-center text-sm font-medium text-muted-foreground mb-2">
                Choose a day
              </label>
              <Select value={String(selectedDay)} onValueChange={(v) => setSelectedDay(Number(v))}>
                <SelectTrigger className="h-14 text-lg font-semibold rounded-2xl border-2 border-primary/30 bg-card shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEK_DAYS.map((d) => (
                    <SelectItem key={d.value} value={String(d.value)} className="text-base py-3">
                      {d.label}
                      {d.value === now.day && " · Today"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Desktop: day tabs */}
            <div className="hidden lg:flex items-center justify-center gap-2">
              {WEEK_DAYS.map((d) => {
                const active = d.value === selectedDay;
                const today = d.value === now.day;
                return (
                  <button
                    key={d.value}
                    onClick={() => setSelectedDay(d.value)}
                    className={cn(
                      "relative px-5 py-3 rounded-xl text-base font-semibold transition-all duration-200",
                      active
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-card border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    {d.label}
                    {today && (
                      <span
                        className={cn(
                          "absolute -top-1.5 -right-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                          active ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground",
                        )}
                      >
                        Today
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Happening now banner */}
          {liveSession && (
            <ScrollReveal>
              <div
                ref={liveRef}
                className="mb-8 rounded-3xl border-2 border-primary bg-primary/5 p-5 lg:p-7 shadow-lg"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-destructive" />
                  </span>
                  <span className="text-sm font-bold uppercase tracking-wide text-destructive">
                    Happening Now
                  </span>
                </div>
                <div className="flex items-center gap-2 text-primary font-semibold mb-1">
                  <Clock className="h-5 w-5" />
                  {formatTime12(liveSession.start_time)}
                  {liveSession.end_time && ` – ${formatTime12(liveSession.end_time)}`}
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-1">
                  {liveSession.title}
                </h2>
                {liveSession.title_bn && (
                  <p className="font-serif text-lg text-muted-foreground mb-2">{liveSession.title_bn}</p>
                )}
                {liveSession.note && (
                  <p className="flex items-start gap-1.5 text-sm text-muted-foreground mb-4">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                    {liveSession.note}
                  </p>
                )}
                {hasJoinLink(liveSession) ? (
                  <JoinButtons session={liveSession} size="lg" />
                ) : (
                  <p className="text-sm text-muted-foreground italic">This is an in-person / offline session.</p>
                )}
              </div>
            </ScrollReveal>
          )}

          {/* Day heading */}
          <div className="flex items-center gap-2 mb-5">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h2 className="text-xl lg:text-2xl font-bold text-foreground">
              {DAY_LABEL[selectedDay]}
              {isToday && <span className="text-primary"> · Today</span>}
            </h2>
          </div>

          {/* Timeline */}
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : daySessions.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border">
              <CalendarDays className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
              <p className="text-muted-foreground">No sessions scheduled for this day yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {daySessions.map((s) => {
                const isLive = s.id === liveId;
                const isNext = s.id === nextId;
                const joinable = hasJoinLink(s);
                return (
                  <div
                    key={s.id}
                    className={cn(
                      "rounded-2xl border bg-card p-4 lg:p-5 transition-all duration-200",
                      isLive
                        ? "border-2 border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/30",
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-5">
                      {/* Time */}
                      <div className="sm:w-32 shrink-0">
                        <div className="inline-flex sm:flex items-center gap-1.5 text-base lg:text-lg font-bold text-foreground">
                          <Clock className="h-4 w-4 text-primary shrink-0" />
                          {formatTime12(s.start_time)}
                        </div>
                        {s.end_time && (
                          <div className="text-xs text-muted-foreground sm:ml-5">
                            to {formatTime12(s.end_time)}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-lg lg:text-xl font-semibold text-foreground">{s.title}</h3>
                          {isLive && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground">
                              <Radio className="h-3 w-3" /> Live
                            </span>
                          )}
                          {isNext && (
                            <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                              Up Next
                            </span>
                          )}
                        </div>
                        {s.title_bn && (
                          <p className="font-serif text-base text-muted-foreground mb-1">{s.title_bn}</p>
                        )}
                        {s.note && (
                          <p className="flex items-start gap-1.5 text-sm text-muted-foreground mb-3">
                            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                            {s.note}
                          </p>
                        )}
                        {joinable && (
                          <div className="mt-3">
                            <JoinButtons session={s} size="md" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
