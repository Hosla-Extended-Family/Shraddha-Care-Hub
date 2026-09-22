import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Calendar, MapPin, Users, Sparkles, CheckCircle, LayoutGrid, GitCommitVertical, Filter, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollaborations, type CollaborationView } from "@/hooks/use-collaborate-content";
import { CollabLogos } from "@/components/corporate/CollabLogos";

const ALL = "All";

function uniqueSorted(values: string[]) {
  return [ALL, ...Array.from(new Set(values.filter(Boolean)))];
}

function FilterRow({
  label,
  options,
  active,
  onChange,
}: {
  label: string;
  options: string[];
  active: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground min-w-[52px]">{label}</span>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 border",
            active === opt
              ? "bg-[hsl(250,70%,45%)] text-white border-transparent shadow-sm"
              : "bg-background text-muted-foreground border-border hover:border-[hsl(250,70%,45%)]/40 hover:text-foreground"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function CollabCard({ c }: { c: CollaborationView }) {
  return (
    <article className="group h-full flex flex-col rounded-2xl overflow-hidden bg-card border border-border shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="relative overflow-hidden aspect-[16/10]">
        <img
          src={c.image ?? undefined}
          alt={c.title}
          width={1280}
          height={960}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          {c.date && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background/90 backdrop-blur-sm px-3 py-1 text-xs font-medium text-foreground shadow-sm">
              <Calendar className="h-3.5 w-3.5" style={{ color: "hsl(250, 70%, 45%)" }} />
              {c.date}
            </span>
          )}
          {c.location && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background/90 backdrop-blur-sm px-3 py-1 text-xs font-medium text-foreground shadow-sm">
              <MapPin className="h-3.5 w-3.5" style={{ color: "hsl(250, 70%, 45%)" }} />
              {c.location}
            </span>
          )}
        </div>
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center rounded-full bg-[hsl(250,70%,45%)] px-3 py-1 text-xs font-semibold text-white shadow-sm">
            {c.type}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-6">
        <h3 className="font-serif text-xl lg:text-2xl font-bold text-foreground mb-3">{c.title}</h3>

        <CollabLogos
          orgLogo={c.orgLogo}
          collaboratorLogoUrl={c.collaboratorLogoUrl}
          collaboratorText={c.collaboratorText}
        />

        {c.partner && (
          <div className="flex items-start gap-2 mb-3">
            <Users className="h-4 w-4 mt-0.5 flex-shrink-0 text-[hsl(250,70%,45%)]" />
            <p className="text-sm font-medium text-[hsl(250,70%,45%)] leading-snug">{c.partner}</p>
          </div>
        )}
        {c.description && <p className="text-sm text-muted-foreground leading-relaxed mb-4">{c.description}</p>}

        <div className="mt-auto">
          {c.outcomes.length > 0 && (
            <div className="space-y-2 border-t border-border pt-4">
              {c.outcomes.map((o) => (
                <div key={o} className="flex items-start gap-2.5">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-500" />
                  <span className="text-sm text-muted-foreground leading-snug">{o}</span>
                </div>
              ))}
            </div>
          )}

          {c.eventSlug && (
            <Link
              to={`/register/${c.eventSlug}${c.hasHighlights ? "#highlights" : ""}`}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[hsl(250,70%,45%)] hover:gap-2.5 transition-all duration-200"
            >
              {c.hasHighlights ? "View event highlights" : "View event page"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export function PastCollaborations() {
  const { data: collaborations = [], isLoading } = useCollaborations();
  const [sector, setSector] = useState(ALL);
  const [month, setMonth] = useState(ALL);
  const [type, setType] = useState(ALL);
  const [view, setView] = useState<"timeline" | "grid">("timeline");

  const sectorOptions = useMemo(() => uniqueSorted(collaborations.map((c) => c.sector)), [collaborations]);
  const monthOptions = useMemo(() => uniqueSorted(collaborations.map((c) => c.month)), [collaborations]);
  const typeOptions = useMemo(() => uniqueSorted(collaborations.map((c) => c.type)), [collaborations]);

  const filtered = useMemo(() => {
    return collaborations
      .filter((c) => sector === ALL || c.sector === sector)
      .filter((c) => month === ALL || c.month === month)
      .filter((c) => type === ALL || c.type === type)
      .sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1));
  }, [collaborations, sector, month, type]);

  if (!isLoading && collaborations.length === 0) return null;

  return (
    <section
      id="past-collaborations"
      className="relative py-16 lg:py-24 overflow-hidden scroll-mt-20"
      style={{
        background: "linear-gradient(135deg, rgba(88, 55, 163, 0.05) 0%, rgba(120, 80, 200, 0.08) 100%)",
      }}
    >
      <div className="container relative z-10">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 bg-[hsl(250,70%,45%)]/10 text-[hsl(250,70%,45%)] px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              Collaborations That Made a Difference
            </div>
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Our Past Collaborations & Impact
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              When great organizations join hands with Shraddha &amp; Hosla, our elders win. Browse our partnerships by
              sector, month or type of initiative.
            </p>
          </div>
        </ScrollReveal>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[hsl(250,70%,45%)]" />
          </div>
        ) : (
          <>
            {/* Filters + view toggle */}
            <ScrollReveal delay={80}>
              <div className="max-w-4xl mx-auto mb-10 rounded-2xl border border-border bg-card/70 backdrop-blur-sm p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Filter className="h-4 w-4 text-[hsl(250,70%,45%)]" />
                    Filter collaborations
                  </div>
                  <div className="inline-flex rounded-lg border border-border bg-background p-1">
                    <button
                      onClick={() => setView("timeline")}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                        view === "timeline" ? "bg-[hsl(250,70%,45%)] text-white" : "text-muted-foreground hover:text-foreground"
                      )}
                      aria-pressed={view === "timeline"}
                    >
                      <GitCommitVertical className="h-3.5 w-3.5" />
                      Timeline
                    </button>
                    <button
                      onClick={() => setView("grid")}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                        view === "grid" ? "bg-[hsl(250,70%,45%)] text-white" : "text-muted-foreground hover:text-foreground"
                      )}
                      aria-pressed={view === "grid"}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                      Grid
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <FilterRow label="Sector" options={sectorOptions} active={sector} onChange={setSector} />
                  <FilterRow label="Month" options={monthOptions} active={month} onChange={setMonth} />
                  <FilterRow label="Type" options={typeOptions} active={type} onChange={setType} />
                </div>
              </div>
            </ScrollReveal>

            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No collaborations match these filters yet. Try clearing a filter.
              </div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {filtered.map((c, index) => (
                  <ScrollReveal key={c.id} delay={index * 120} direction="up">
                    <CollabCard c={c} />
                  </ScrollReveal>
                ))}
              </div>
            ) : (
              <div className="relative max-w-4xl mx-auto">
                {/* vertical rail */}
                <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-px bg-[hsl(250,70%,45%)]/25 sm:-translate-x-1/2" aria-hidden="true" />
                <div className="space-y-10">
                  {filtered.map((c, index) => (
                    <ScrollReveal key={c.id} delay={index * 100} direction="up">
                      <div className={cn("relative pl-12 sm:pl-0 sm:grid sm:grid-cols-2 sm:gap-8 sm:items-center")}>
                        {/* dot */}
                        <div className="absolute left-4 sm:left-1/2 top-2 sm:top-1/2 z-10 flex h-8 w-8 -translate-x-1/2 sm:-translate-y-1/2 items-center justify-center rounded-full bg-[hsl(250,70%,45%)] text-white shadow-md ring-4 ring-background">
                          <Calendar className="h-4 w-4" />
                        </div>
                        {/* date label side */}
                        <div className={cn("mb-3 sm:mb-0", index % 2 === 0 ? "sm:order-1 sm:text-right sm:pr-12" : "sm:order-2 sm:pl-12")}>
                          <p className="text-lg font-bold text-[hsl(250,70%,45%)]">{c.date}</p>
                          <p className="text-sm text-muted-foreground">
                            {c.sector} · {c.type}
                          </p>
                        </div>
                        {/* card side */}
                        <div className={cn(index % 2 === 0 ? "sm:order-2 sm:pl-12" : "sm:order-1 sm:pr-12")}>
                          <CollabCard c={c} />
                        </div>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
