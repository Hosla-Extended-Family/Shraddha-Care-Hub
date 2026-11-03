import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { fetchSessionBundle, fetchUpcomingPublishedSession, formatSessionDate, PROGRAM_META, type StudyCircleProgram } from "@/lib/studycircle";
import { SessionViewer } from "@/components/studycircle/SessionViewer";

export default function StudyCircle() {
  const [params, setParams] = useSearchParams();
  const requested = params.get("program");
  const program: StudyCircleProgram = requested === "kathamrita" ? "kathamrita" : "pathochokro";

  const current = useQuery({
    queryKey: ["study-circle-current", program],
    queryFn: () => fetchUpcomingPublishedSession(program),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (!requested) setParams({ program: "pathochokro" }, { replace: true });
  }, [requested, setParams]);

  const sessionId = current.data?.id ?? null;
  const bundle = useQuery({
    queryKey: ["study-circle-bundle", sessionId],
    queryFn: () => fetchSessionBundle(sessionId!),
    enabled: Boolean(sessionId),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const past = useQuery({
    queryKey: ["study-circle-past", program],
    queryFn: async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
      const request = supabase.from("study_circle_sessions").select("*").eq("program_type", program).eq("is_published", true).lt("scheduled_date", today).order("scheduled_date", { ascending: false }).limit(5);
      const { data, error } = await Promise.race([
        request,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Request timed out")), 10000),
        ),
      ]);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const otherProgram = useMemo<StudyCircleProgram>(() => program === "kathamrita" ? "pathochokro" : "kathamrita", [program]);

  return (
    <Layout>
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/20 py-12 lg:py-16">
        <div className="container max-w-5xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Hosla Study Circle</p>
          <h1 className="mt-2 font-serif text-3xl font-bold lg:text-5xl">Study Circle / পাঠচক্র সূচী</h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Upcoming sessions, assigned roles and programme parts.</p>
        </div>
      </section>

      <main className="container max-w-5xl py-8 lg:py-12">
        <Tabs value={program} onValueChange={(v) => setParams({ program: v }, { replace: true })}>
          <TabsList className="grid h-auto w-full grid-cols-2 p-1">
            <TabsTrigger value="kathamrita" className="py-3">{PROGRAM_META.kathamrita.label} · Tue</TabsTrigger>
            <TabsTrigger value="pathochokro" className="py-3">{PROGRAM_META.pathochokro.label} · Thu</TabsTrigger>
          </TabsList>

          <TabsContent value={program} className="mt-6 space-y-8">
            {current.isLoading || bundle.isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
            ) : current.isError || bundle.isError ? (
              <div className="rounded-2xl border bg-muted/20 p-10 text-center">
                <h2 className="text-xl font-semibold">Could not load session</h2>
                <p className="mt-2 text-sm text-muted-foreground">Please try refreshing the page.</p>
              </div>
            ) : bundle.data ? (
              <SessionViewer bundle={bundle.data} />
            ) : (
              <div className="rounded-2xl border bg-muted/20 p-10 text-center">
                <h2 className="text-xl font-semibold">No published session scheduled yet</h2>
                <p className="mt-2 text-sm text-muted-foreground">The performer list will appear here once an admin publishes the next session.</p>
              </div>
            )}

            {past.data && past.data.length > 0 && (
              <Accordion type="single" collapsible>
                <AccordionItem value="past">
                  <AccordionTrigger>Past sessions · last 5</AccordionTrigger>
                  <AccordionContent>
                    <Accordion type="single" collapsible className="space-y-2 pt-2">
                      {past.data.map((session) => (
                        <PastSession key={session.id} sessionId={session.id} title={session.title_bn} date={formatSessionDate(session.scheduled_date)} />
                      ))}
                    </Accordion>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            <div className="flex justify-center">
              <Button variant="outline" onClick={() => setParams({ program: otherProgram }, { replace: true })}>
                View {PROGRAM_META[otherProgram].label}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </Layout>
  );
}

function PastSession({ sessionId, title, date }: { sessionId: string; title: string; date: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["study-circle-past-bundle", sessionId],
    queryFn: () => fetchSessionBundle(sessionId),
    staleTime: 30 * 60 * 1000,
  });
  return (
    <AccordionItem value={sessionId} className="rounded-xl border px-4">
      <AccordionTrigger><span className="text-left"><span className="font-medium">{title}</span><span className="ml-2 text-xs text-muted-foreground">{date}</span></span></AccordionTrigger>
      <AccordionContent>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : data ? <SessionViewer bundle={data} /> : null}
      </AccordionContent>
    </AccordionItem>
  );
}
