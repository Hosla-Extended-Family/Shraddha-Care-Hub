import { CalendarDays, Clock3, UsersRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPerformerNames, displayTime, formatSessionDate, type StudyCircleBundle } from "@/lib/studycircle";
import { cn } from "@/lib/utils";

export function SessionViewer({ bundle }: { bundle: StudyCircleBundle }) {
  const { session, roles, parts } = bundle;
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 via-background to-accent/20">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" />{formatSessionDate(session.scheduled_date)}</span>
            <span className="inline-flex items-center gap-1"><Clock3 className="h-4 w-4" />{displayTime(session.start_time)}</span>
          </div>
          <CardTitle className="text-2xl lg:text-3xl">{session.title_bn}</CardTitle>
          {session.note && <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-100">{session.note}</div>}
        </CardHeader>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><UsersRound className="h-5 w-5" />Roles</CardTitle></CardHeader>
        <CardContent>
          {roles.length === 0 ? <p className="text-sm text-muted-foreground">No roles assigned yet.</p> : (
            <div className="divide-y rounded-xl border">
              {roles.map((role) => {
                const names = getPerformerNames(role.performers);
                return (
                  <div key={role.id} className="grid gap-2 p-4 sm:grid-cols-[minmax(180px,0.8fr)_1fr]">
                    <div className="font-medium">{role.role_name}</div>
                    <div className="text-muted-foreground">{names.length ? names.join(" & ") : "Not assigned"}</div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Programme Parts</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {parts.length === 0 ? <p className="text-sm text-muted-foreground">Parts have not been added yet.</p> : parts.map((part) => {
            const names = getPerformerNames(part.performers);
            return (
              <div key={part.id} className="rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-start gap-3">
                  {part.part_number !== null && <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{part.part_number}</div>}
                  <div className={cn("min-w-0 flex-1", part.part_number === null && "pl-0")}>
                    <Badge variant="outline" className="mb-2 capitalize">{part.part_type}</Badge>
                    <div className="whitespace-pre-wrap text-sm leading-6">{part.description || "—"}</div>
                    <div className="mt-3 text-sm text-muted-foreground">{names.length ? names.join(" / ") : "Performer not assigned"}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
