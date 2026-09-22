import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";
import { EventCtaButtons } from "@/components/events/EventCtaButtons";

type EventRow = Database["public"]["Tables"]["registration_events"]["Row"];
type ProjectStatus = Database["public"]["Enums"]["project_status"];
type OrganizationType = Database["public"]["Enums"]["organization_type"];

const statusFilters: { label: string; value: ProjectStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Ongoing", value: "ongoing" },
  { label: "Completed", value: "completed" },
];

function getStatusBadge(status: ProjectStatus) {
  const config: Record<ProjectStatus, { className: string; label: string }> = {
    upcoming: { className: "bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-100", label: "Upcoming" },
    ongoing: { className: "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-100", label: "Ongoing" },
    completed: { className: "bg-green-100 text-green-800 border-green-300 hover:bg-green-100", label: "Completed" },
  };
  const c = config[status];
  return <Badge className={c.className}>{c.label}</Badge>;
}

function getOrgLabel(org: OrganizationType) {
  const labels: Record<OrganizationType, string> = { shraddha: "Shraddha", hosla: "Hosla", both: "Shraddha & Hosla" };
  return labels[org];
}

function EventCta({ event }: { event: EventRow }) {
  return <EventCtaButtons event={event} />;
}


export default function Events() {
  const [activeFilter, setActiveFilter] = useState<ProjectStatus | "all">("all");

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["all-registration-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registration_events")
        .select("*")
        .eq("is_published", true)
        .order("display_order", { ascending: true })
        .order("event_date", { ascending: false });
      if (error) throw error;
      return data as EventRow[];
    },
  });

  const filtered = activeFilter === "all" ? events : events.filter((e) => e.status === activeFilter);

  return (
    <Layout>
      <section
        className="relative py-16 lg:py-24 overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(88, 55, 163, 0.08) 0%, rgba(120, 80, 200, 0.12) 100%)" }}
      >
        <div className="container relative z-10">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h1 className="font-serif text-3xl lg:text-5xl font-bold text-foreground mb-4">Projects & Events</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Explore all our initiatives dedicated to elder care and community welfare.
              </p>
            </div>
          </ScrollReveal>

          {/* Filter Tabs */}
          <div className="flex justify-center gap-2 mb-10 flex-wrap">
            {statusFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeFilter === f.value
                    ? "bg-[hsl(250,70%,45%)] text-white shadow-md"
                    : "bg-background border border-border text-muted-foreground hover:border-[hsl(250,70%,45%)]/40 hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: "hsl(250, 70%, 45%)" }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 bg-background/50 rounded-2xl border border-border/50">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" style={{ color: "hsl(250, 70%, 45%)" }} />
              <p className="text-muted-foreground">No events found for this filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((event, index) => (
                <ScrollReveal key={event.id} delay={index * 80}>
                  <div className="relative bg-background rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-border/50 group h-full flex flex-col">
                    <div
                      className="absolute top-0 left-0 right-0 h-1 z-10"
                      style={{ background: "linear-gradient(90deg, hsl(250, 70%, 45%), hsl(220, 70%, 50%))" }}
                    />

                    {event.banner_url && (
                      <div className="relative z-10 p-6 pb-0">
                        <div className="relative overflow-hidden rounded-xl border border-border/60 bg-background/70">
                          <img
                            src={event.banner_url}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 h-full w-full object-cover blur-sm scale-105 opacity-100"
                            loading="lazy"
                          />
                          <img
                            src={event.banner_url}
                            alt={event.title}
                            className="relative z-10 aspect-[16/9] w-full object-contain bg-transparent"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    )}

                    <div className="relative z-10 p-6 flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        {getStatusBadge(event.status)}
                        <span
                          className="text-xs font-medium px-2 py-1 rounded-full"
                          style={{
                            background: "linear-gradient(135deg, rgba(88, 55, 163, 0.1), rgba(120, 80, 200, 0.1))",
                            color: "hsl(250, 70%, 45%)",
                          }}
                        >
                          {getOrgLabel(event.organization)}
                        </span>
                      </div>

                      <h3 className="font-semibold text-lg text-foreground mb-2 group-hover:text-[hsl(250,70%,45%)] transition-colors">
                        {event.title}
                      </h3>

                      {event.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">{event.description}</p>
                      )}

                      {event.event_date && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                          <Calendar className="h-4 w-4" style={{ color: "hsl(250, 70%, 45%)" }} />
                          <span>
                            {format(new Date(event.event_date), "MMM d, yyyy")}
                            {event.end_date && ` - ${format(new Date(event.end_date), "MMM d, yyyy")}`}
                          </span>
                        </div>
                      )}

                      {event.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                          <MapPin className="h-4 w-4" style={{ color: "hsl(250, 70%, 45%)" }} />
                          <span>{event.location}</span>
                        </div>
                      )}

                      <EventCta event={event} />
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
