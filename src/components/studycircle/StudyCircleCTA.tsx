import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, CalendarDays, Loader2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { fetchUpcomingSession, formatSessionDate, displayTime, PROGRAMS, type StudyCircleProgram } from "@/lib/studycircle";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

function ProgramCard({ program }: { program: StudyCircleProgram }) {
  const meta = PROGRAMS[program];
  const { lang } = useI18n();
  const isBn = lang === "bn";

  const { data: session, isLoading } = useQuery({
    queryKey: ["study-circle-next", program],
    queryFn: () => fetchUpcomingSession(program),
    staleTime: 5 * 60 * 1000,
  });
  const isKathamrita = program === "kathamrita";
  const isCancelled = session?.status === "cancelled";

  return (
    <Card className="group relative overflow-hidden border border-border/70 bg-card/90 shadow-md backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1.5",
          isKathamrita ? "bg-orange-500" : "bg-purple-600",
        )}
      />
      <div
        className={cn(
          "absolute -right-20 -top-20 h-44 w-44 rounded-full blur-3xl pointer-events-none",
          isKathamrita ? "bg-orange-500/10" : "bg-purple-500/10",
        )}
      />
      <CardContent className="relative p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold", meta.soft)}>
            <BookOpen className="h-3.5 w-3.5" />
            {isBn ? meta.shortLabelBn : meta.shortLabelEn}
          </div>
          <CalendarDays className="h-5 w-5 text-muted-foreground/60" />
        </div>

        <h3 className="text-xl font-bold font-serif text-foreground">
          {isBn ? meta.labelBn : meta.labelEn}
        </h3>

        {isLoading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            {isBn ? "পরবর্তী সূচী লোড হচ্ছে…" : "Loading next session…"}
          </div>
        ) : session ? (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span>{formatSessionDate(session.scheduled_date, lang)}</span>
              <span>·</span>
              <span className="text-primary">{displayTime(session.start_time)}</span>
            </div>

            {isCancelled ? (
              <div className="mt-2 text-xs font-medium text-destructive flex items-center gap-1.5 bg-destructive/10 p-2 rounded-lg">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {isBn
                    ? `স্থগিত: ${session.note || "অনিবার্য কারণে অধিবেশন স্থগিত।"}`
                    : `Cancelled: ${session.note_en || session.note || "Session cancelled due to unavoidable circumstances."}`}
                </span>
              </div>
            ) : (
              (isBn ? session.note : session.note_en || session.note) && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  📢 {isBn ? session.note : session.note_en || session.note}
                </p>
              )
            )}
          </div>
        ) : (
          <div className="mt-4 py-2 text-sm text-muted-foreground">
            {isBn ? "পাঠচক্র সূচী উপলব্ধ নয়" : "No session scheduled yet."}
          </div>
        )}

        <div className="mt-5 pt-3 border-t border-border/50">
          <Link
            to={`/daily-routine/study-circle?program=${program}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80 group-hover:translate-x-0.5 duration-150"
          >
            {isBn ? "সূচী ও দায়িত্বপ্রাপ্ত তালিকা দেখুন" : "View Performer List & Schedule"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export function StudyCircleCTA() {
  const { lang } = useI18n();
  const isBn = lang === "bn";

  return (
    <section className="relative overflow-hidden border-y bg-gradient-to-br from-background via-primary/[0.02] to-accent/20 py-8 lg:py-10">
      <div className="container max-w-5xl">
        <div className="mb-6 text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-primary px-3 py-1 rounded-full bg-primary/10 mb-2">
            {isBn ? "সাপ্তাহিক পাঠচক্র" : "Weekly Study Circle"}
          </span>
          <h2 className="font-serif text-2xl lg:text-3xl font-bold text-foreground">
            {isBn ? "পাঠচক্র ও কথামৃত সূচী" : "Study Circle & Kathamrita Schedule"}
          </h2>
          <p className="mx-auto mt-1.5 max-w-2xl text-sm text-muted-foreground">
            {isBn
              ? "প্রতি মঙ্গলবার রামকৃষ্ণ কথামৃত ও প্রতি বৃহস্পতিবার পাঠচক্রের দায়িত্বপ্রাপ্ত ব্যক্তিবর্গের তালিকা।"
              : "Weekly schedule and assigned performers for Tuesday Ramakrishna Kathamrita and Thursday Pathochokro."}
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <ProgramCard program="kathamrita" />
          <ProgramCard program="pathochokro" />
        </div>
      </div>
    </section>
  );
}

