import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, CalendarDays, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { fetchUpcomingPublishedSession, formatSessionDate, displayTime, PROGRAM_META, type StudyCircleProgram } from "@/lib/studycircle";
import { cn } from "@/lib/utils";

function ProgramCard({ program }: { program: StudyCircleProgram }) {
  const meta = PROGRAM_META[program];
  const { data: session, isLoading, isError } = useQuery({
    queryKey: ["study-circle-next", program],
    queryFn: () => fetchUpcomingPublishedSession(program),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const orange = program === "kathamrita";

  return (
    <Card className="group relative overflow-hidden border-border/60 bg-card/80 shadow-lg backdrop-blur transition-transform hover:-translate-y-0.5">
      <div className={cn("absolute inset-x-0 top-0 h-1", orange ? "bg-orange-500" : "bg-purple-500")} />
      <div className={cn("absolute -right-20 -top-20 h-48 w-48 rounded-full blur-3xl", orange ? "bg-orange-500/15" : "bg-purple-500/15")} />
      <CardContent className="relative p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold", meta.soft)}>
            <BookOpen className="h-3.5 w-3.5" />{meta.shortLabel}
          </div>
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold">{meta.label}</h2>
        {isLoading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading next session…</div>
        ) : isError ? (
          <p className="mt-4 text-sm text-muted-foreground">Could not load session info.</p>
        ) : session ? (
          <>
            <div className="mt-3 text-sm font-medium">{formatSessionDate(session.scheduled_date)} · {displayTime(session.start_time)}</div>
            {session.note && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{session.note}</p>}
          </>
        ) : <p className="mt-4 text-sm text-muted-foreground">No session scheduled yet.</p>}
        <Link
          to={`/daily-routine/study-circle?program=${program}`}
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-transform group-hover:translate-x-0.5"
        >
          View Performer List <ArrowRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}

export function StudyCircleCTA() {
  return (
    <section className="relative overflow-hidden border-y bg-gradient-to-br from-background via-primary/[0.03] to-accent/20 py-8 lg:py-10">
      <div className="container max-w-5xl">
        <div className="mb-5 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Hosla Study Circle</p>
          <h2 className="mt-1 font-serif text-2xl font-bold lg:text-3xl">পাঠচক্র সূচী</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">See the upcoming performer schedule for both weekly Study Circle programmes.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <ProgramCard program="kathamrita" />
          <ProgramCard program="pathochokro" />
        </div>
      </div>
    </section>
  );
}
