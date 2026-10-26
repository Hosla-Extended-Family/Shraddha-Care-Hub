import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { CalendarDays, Loader2, BookOpen, Globe2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import {
  fetchSessionBundle,
  fetchUpcomingSession,
  formatSessionDate,
  PROGRAMS,
  DEMO_PAST_SESSIONS,
  type StudyCircleProgram,
  type StudyCircleSession,
} from "@/lib/studycircle";
import { SessionViewer } from "@/components/studycircle/SessionViewer";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

export default function StudyCircle() {
  const [params, setParams] = useSearchParams();
  const { lang, setLang } = useI18n();
  const isBn = lang === "bn";

  const requested = params.get("program");
  const program: StudyCircleProgram = requested === "kathamrita" ? "kathamrita" : "pathochokro";

  const current = useQuery({
    queryKey: ["study-circle-current", program],
    queryFn: () => fetchUpcomingSession(program),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!requested) {
      setParams({ program: "pathochokro" }, { replace: true });
    }
  }, [requested, setParams]);

  const sessionId = current.data?.id ?? null;
  const bundle = useQuery({
    queryKey: ["study-circle-bundle", sessionId],
    queryFn: () => fetchSessionBundle(sessionId!),
    enabled: Boolean(sessionId),
    staleTime: 5 * 60 * 1000,
  });

  const past = useQuery({
    queryKey: ["study-circle-past", program],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return DEMO_PAST_SESSIONS[program] ?? [];
      }
      try {
        const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
        const { data, error } = await Promise.race([
          supabase
            .from("study_circle_sessions")
            .select("*")
            .eq("program_type", program)
            .eq("is_published", true)
            .lt("scheduled_date", today)
            .order("scheduled_date", { ascending: false })
            .limit(5),
          new Promise<{ data: null; error: Error }>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 1500),
          ),
        ]);

        if (error || !data || data.length === 0) {
          return DEMO_PAST_SESSIONS[program] ?? [];
        }
        return data;
      } catch {
        return DEMO_PAST_SESSIONS[program] ?? [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const otherProgram: StudyCircleProgram = program === "kathamrita" ? "pathochokro" : "kathamrita";

  return (
    <Layout>
      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/20 py-8 sm:py-12 lg:py-16 border-b">
        <div className="container max-w-5xl px-4 text-center">
          {/* Top Language Toggle Pill */}
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <div className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-background/90 p-1 shadow-sm backdrop-blur">
              <Globe2 className="h-3.5 w-3.5 text-muted-foreground ml-2" />
              <button
                type="button"
                onClick={() => setLang("en")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold transition-all touch-manipulation",
                  lang === "en" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLang("bn")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold transition-all touch-manipulation",
                  lang === "bn" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                বাংলা
              </button>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-2.5 sm:mb-3">
            <BookOpen className="h-3.5 w-3.5" />
            {isBn ? "হোসলা প্রবীণ কল্যাণ" : "Hosla Senior Citizen Wellness"}
          </span>
          <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
            {isBn ? "পাঠচক্র ও কথামৃত সূচী" : "Study Circle Schedule"}
          </h1>
          <p className="mx-auto mt-2 sm:mt-3 max-w-2xl text-muted-foreground text-xs sm:text-sm lg:text-base leading-relaxed px-2">
            {isBn
              ? "সাপ্তাহিক পাঠচক্র ও রামকৃষ্ণ কথামৃত অধিবেশনের দায়িত্বপ্রাপ্ত ব্যক্তিবর্গ এবং সূচী।"
              : "Weekly schedule, assigned roles, and agendas for Tuesday Ramakrishna Kathamrita and Thursday Pathochokro sessions."}
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="container max-w-4xl px-3.5 sm:px-6 py-6 sm:py-8 lg:py-12">
        <Tabs value={program} onValueChange={(v) => setParams({ program: v }, { replace: true })}>
          <TabsList className="grid h-auto w-full grid-cols-2 p-1.5 bg-muted/70 rounded-xl gap-1">
            <TabsTrigger
              value="pathochokro"
              className="flex flex-col sm:flex-row items-center justify-center py-2.5 px-2 text-xs sm:text-base font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-lg gap-0.5 sm:gap-2 leading-tight"
            >
              <span>{isBn ? PROGRAMS.pathochokro.labelBn : PROGRAMS.pathochokro.labelEn}</span>
              <span className="text-[11px] sm:text-xs font-normal text-muted-foreground">
                {isBn ? "· বৃহস্পতিবার" : "· Thursday"}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="kathamrita"
              className="flex flex-col sm:flex-row items-center justify-center py-2.5 px-2 text-xs sm:text-base font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-lg gap-0.5 sm:gap-2 leading-tight"
            >
              <span>{isBn ? PROGRAMS.kathamrita.labelBn : PROGRAMS.kathamrita.labelEn}</span>
              <span className="text-[11px] sm:text-xs font-normal text-muted-foreground">
                {isBn ? "· মঙ্গলবার" : "· Tuesday"}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={program} className="mt-6 sm:mt-8 space-y-6 sm:space-y-8">
            {current.isLoading || bundle.isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 sm:py-20 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">{isBn ? "সূচী লোড হচ্ছে…" : "Loading schedule…"}</p>
              </div>
            ) : bundle.data ? (
              <SessionViewer bundle={bundle.data} />
            ) : (
              <div className="rounded-2xl border border-dashed bg-muted/20 p-8 sm:p-12 text-center">
                <CalendarDays className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground/40 mb-3" />
                <h2 className="text-lg sm:text-xl font-bold text-foreground">
                  {isBn ? "পরবর্তী অধিবেশন এখনও নির্ধারিত হয়নি" : "No session scheduled yet"}
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                  {isBn
                    ? "অ্যাডমিন নতুন অধিবেশন প্রকাশ করলে তালিকাটি এখানে প্রদর্শিত হবে।"
                    : "Upcoming sessions will appear here once published by the administration."}
                </p>
              </div>
            )}

            {/* Past Sessions Accordion */}
            {past.data && past.data.length > 0 && (
              <div className="pt-4 sm:pt-6 border-t">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="past-sessions" className="border rounded-xl px-3 sm:px-4 bg-card shadow-sm">
                    <AccordionTrigger className="text-sm sm:text-base font-semibold py-3.5 sm:py-4">
                      {isBn ? "পূর্ববর্তী অধিবেশনসমূহ (Past 5 Sessions)" : "Past Sessions Archive (Last 5 Sessions)"}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-1 pb-3">
                        {past.data.map((s: StudyCircleSession) => (
                          <PastSessionItem
                            key={s.id}
                            sessionId={s.id}
                            title={isBn ? s.title_bn : (s.title_en || s.title_bn)}
                            date={formatSessionDate(s.scheduled_date, lang)}
                          />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}

            {/* Switch Program Link */}
            <div className="flex justify-center pt-2 sm:pt-4">
              <Button
                variant="outline"
                onClick={() => setParams({ program: otherProgram }, { replace: true })}
                className="w-full sm:w-auto gap-2 text-xs sm:text-sm py-2.5 sm:py-2 h-auto rounded-xl"
              >
                {isBn
                  ? `Switch to ${PROGRAMS[otherProgram].labelBn} (${PROGRAMS[otherProgram].dayLabelBn})`
                  : `Switch to ${PROGRAMS[otherProgram].labelEn} (${PROGRAMS[otherProgram].dayLabelEn})`}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </Layout>
  );
}

function PastSessionItem({ sessionId, title, date }: { sessionId: string; title: string; date: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["study-circle-past-bundle", sessionId],
    queryFn: () => fetchSessionBundle(sessionId),
    staleTime: 30 * 60 * 1000,
  });

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value={sessionId} className="rounded-lg border px-4 bg-muted/20">
        <AccordionTrigger className="py-3 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <span className="font-semibold text-sm">{title}</span>
            <span className="text-xs text-muted-foreground font-normal">{date}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-2 pb-4">
          {isLoading ? (
            <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Loading archive…
            </div>
          ) : data ? (
            <SessionViewer bundle={data} />
          ) : null}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
