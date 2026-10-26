import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Clock3, UsersRound, Video, ExternalLink, AlertTriangle, BookOpen, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { displayTime, formatSessionDate, getPerformerNames, type SessionBundle } from "@/lib/studycircle";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

export function SessionViewer({ bundle }: { bundle: SessionBundle }) {
  const { session, roles, parts } = bundle;
  const { lang } = useI18n();
  const isBn = lang === "bn";
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: authSession } }) => {
      setIsAuthenticated(Boolean(authSession));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setIsAuthenticated(Boolean(currentSession));
    });

    return () => subscription.unsubscribe();
  }, []);

  const isCancelled = session.status === "cancelled";
  const sessionTitle = isBn ? session.title_bn : (session.title_en || session.title_bn);
  const sessionNote = isBn ? session.note : (session.note_en || session.note);

  return (
    <div className="space-y-6">
      {/* Session Header Card */}
      <Card className="overflow-hidden border-2 shadow-sm rounded-2xl">
        <CardHeader className="bg-gradient-to-r from-primary/10 via-background to-accent/20 p-4 sm:p-6 pb-5 sm:pb-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mb-2">
            <span className="inline-flex items-center gap-1.5 font-semibold text-foreground bg-background/80 px-2.5 py-1 rounded-lg border shadow-xs">
              <CalendarDays className="h-3.5 w-3.5 text-primary" />
              {formatSessionDate(session.scheduled_date, lang)}
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium bg-background/80 px-2.5 py-1 rounded-lg border shadow-xs">
              <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
              {displayTime(session.start_time)}
            </span>
            {isCancelled && (
              <Badge variant="destructive" className="ml-auto uppercase text-[11px] sm:text-xs tracking-wider">
                {isBn ? "স্থগিত" : "Cancelled"}
              </Badge>
            )}
          </div>

          <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-serif text-foreground leading-snug">
            {sessionTitle}
          </CardTitle>

          {/* Cancellation or Special Announcement Banner */}
          {isCancelled && (
            <div className="mt-3.5 sm:mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 sm:p-4 text-xs sm:text-sm text-destructive flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{isBn ? "বিশেষ বিজ্ঞপ্তি (Notice)" : "Special Notice (Cancelled)"}</p>
                <p className="mt-1 leading-relaxed">
                  {sessionNote || (isBn ? "আজকের পাঠচক্র অধিবেশন অনিবার্য কারণে স্থগিত রাখা হয়েছে।" : "Today's session has been cancelled due to unavoidable circumstances.")}
                </p>
              </div>
            </div>
          )}

          {!isCancelled && sessionNote && (
            <div className="mt-3.5 sm:mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 sm:p-4 text-xs sm:text-sm text-amber-900 dark:text-amber-100 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{isBn ? "বিজ্ঞপ্তি (Announcement)" : "Announcement"}</p>
                <p className="mt-1 leading-relaxed">{sessionNote}</p>
              </div>
            </div>
          )}

          {/* Meeting Link (Protected) */}
          {!isCancelled && session.meeting_link && (
            <div className="mt-4 pt-3.5 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Video className="h-4 w-4 text-primary shrink-0" />
                <span className="font-medium">{isBn ? "অনলাইন অধিবেশন (Online Video)" : "Online Video Session"}</span>
              </div>
              {isAuthenticated ? (
                <Button asChild className="w-full sm:w-auto h-11 sm:h-9 text-xs sm:text-sm font-semibold gap-1.5 bg-primary hover:bg-primary/90 justify-center rounded-xl">
                  <a href={session.meeting_link} target="_blank" rel="noopener noreferrer">
                    {isBn ? "অধিবেশনে যোগ দিন (Join)" : "Join Online Meeting"}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              ) : (
                <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2.5 sm:bg-transparent sm:p-0">
                  <span className="font-medium text-foreground">
                    {isBn ? "মিটিং লিংক কেবল সদস্যদের জন্য।" : "Meeting link available to members."}
                  </span>{" "}
                  <Link to="/auth" className="text-primary underline hover:opacity-80 font-semibold ml-1">
                    {isBn ? "লগইন করুন" : "Sign in to join"}
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Leadership Roles */}
      <Card className="rounded-2xl shadow-sm overflow-hidden">
        <CardHeader className="border-b py-3.5 px-4 sm:px-6 bg-muted/20">
          <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
            <UsersRound className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            {isBn ? "দায়িত্বপ্রাপ্ত ব্যক্তিবর্গ (Leadership & Roles)" : "Leadership & Assigned Roles"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          {roles.length === 0 ? (
            <p className="text-xs sm:text-sm text-muted-foreground py-4 text-center">
              {isBn ? "দায়িত্ব বণ্টন এখনও সম্পন্ন হয়নি।" : "Role assignments pending."}
            </p>
          ) : (
            <div className="divide-y rounded-xl border bg-card overflow-hidden">
              {roles.map((role) => {
                const names = getPerformerNames(role.performers, lang);
                const roleName = isBn ? role.role_name : (role.role_name_en || role.role_name);
                return (
                  <div key={role.id} className="flex flex-col sm:grid sm:grid-cols-[minmax(200px,0.9fr)_1fr] gap-1 sm:gap-2 p-3 sm:p-3.5 items-start sm:items-center hover:bg-muted/30 transition-colors">
                    <div className="font-semibold text-xs sm:text-sm text-foreground flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      {roleName}
                    </div>
                    <div className="text-sm sm:text-base text-foreground font-medium pl-4 sm:pl-0">
                      {names !== "—" ? (
                        <span>{names}</span>
                      ) : (
                        <span className="text-xs italic text-muted-foreground opacity-70">
                          {isBn ? "অনির্ধারিত" : "Not assigned"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Programme Agenda Parts */}
      <Card className="rounded-2xl shadow-sm overflow-hidden">
        <CardHeader className="border-b py-3.5 px-4 sm:px-6 bg-muted/20">
          <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            {isBn ? "অনুষ্ঠান সূচী ও পাঠ (Programme Agenda)" : "Programme Agenda & Readings"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {parts.length === 0 ? (
            <p className="text-xs sm:text-sm text-muted-foreground py-6 text-center">
              {isBn ? "অনুষ্ঠান সূচী শীঘ্রই আপডেট করা হবে।" : "Programme schedule will be updated shortly."}
            </p>
          ) : (
            parts.map((part) => {
              const names = getPerformerNames(part.performers, lang);
              const isSong = part.item_type === "song";
              const isPrayer = part.item_type === "prayer";
              const isReading = part.item_type === "reading";
              const desc = isBn ? part.description : (part.description_en || part.description);

              return (
                <div key={part.id} className="rounded-xl border p-3.5 sm:p-4 bg-card hover:border-primary/40 shadow-xs transition-colors">
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    {part.part_number !== null ? (
                      <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-xs sm:text-sm text-primary">
                        {part.part_number}
                      </div>
                    ) : (
                      <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[11px] sm:text-xs capitalize font-semibold px-2 py-0.5",
                            isSong && "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300",
                            isReading && "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300",
                            isPrayer && "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300",
                          )}
                        >
                          {isSong
                            ? (isBn ? "সঙ্গীত (Song)" : "Song")
                            : isReading
                            ? (isBn ? "পাঠ (Reading)" : "Reading")
                            : isPrayer
                            ? (isBn ? "প্রার্থনা (Prayer)" : "Prayer")
                            : (isBn ? "অন্যান্য" : "Other")}
                        </Badge>

                        {part.reference_link && (
                          <a
                            href={part.reference_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-0.5 rounded-full transition-colors ml-auto"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {isBn ? "তথ্যসূত্র / গান" : "Lyrics / Reference"}
                          </a>
                        )}
                      </div>

                      <div className="whitespace-pre-wrap text-xs sm:text-sm sm:text-base leading-relaxed text-foreground font-medium">
                        {desc || "—"}
                      </div>

                      {names !== "—" && (
                        <div className="mt-2.5 pt-2 border-t border-border/40 text-xs sm:text-sm text-muted-foreground flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-foreground">
                            {isBn ? "গায়ক / পাঠক:" : "Performer(s):"}
                          </span>
                          <span className="font-medium text-foreground/90">{names}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
