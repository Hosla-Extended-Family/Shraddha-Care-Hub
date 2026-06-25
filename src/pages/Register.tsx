import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { CalendarDays, MapPin, Loader2, ArrowRight, Clock, CalendarX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export default function Register() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["open-registration-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registration_events")
        .select("*")
        .eq("is_published", true)
        .eq("enable_registration", true)
        .eq("registration_open", true)
        .order("display_order", { ascending: true })
        .order("event_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  return (
    <Layout>
      <section className="relative py-16 lg:py-24 overflow-hidden bg-gradient-to-br from-accent/40 via-background to-accent/30">
        <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h1 className="font-serif text-3xl lg:text-5xl font-bold text-foreground mb-4">
                Register for Our Upcoming Events
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Join our community gatherings, health camps, and wellness events. Pick an event below to reserve your spot.
              </p>
            </div>
          </ScrollReveal>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 bg-background/50 rounded-2xl border border-border/50 max-w-xl mx-auto">
              <CalendarX className="h-12 w-12 mx-auto mb-4 opacity-30 text-primary" />
              <p className="text-muted-foreground">
                No events are open for registration right now. Please check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {events.map((event, index) => (
                <ScrollReveal key={event.id} delay={index * 80}>
                  <Card className="h-full flex flex-col overflow-hidden hover:shadow-xl transition-shadow">
                    {event.banner_url && (
                      <img
                        src={event.banner_url}
                        alt={event.title}
                        className="w-full aspect-[16/9] object-cover"
                        loading="lazy"
                      />
                    )}
                    <CardContent className="p-6 flex-1 flex flex-col">
                      <h3 className="font-semibold text-lg text-foreground mb-2">{event.title}</h3>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">{event.description}</p>
                      )}
                      <div className="space-y-2 text-sm text-muted-foreground mb-4">
                        {event.event_date && (
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-primary" />
                            <span>{format(new Date(event.event_date), "MMM d, yyyy")}</span>
                          </div>
                        )}
                        {(event.start_time || event.end_time) && (() => {
                          const fmt = (t: string) => {
                            const [hStr, mStr] = t.split(":");
                            let h = parseInt(hStr, 10);
                            const m = mStr ?? "00";
                            if (isNaN(h)) return t;
                            const ampm = h >= 12 ? "PM" : "AM";
                            h = h % 12 || 12;
                            return `${h}:${m} ${ampm}`;
                          };
                          return (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-primary" />
                              <span>{[event.start_time, event.end_time].filter(Boolean).map((t) => fmt(t!)).join(" – ")}</span>
                            </div>
                          );
                        })()}
                        {event.venue_name && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span>{event.venue_name}</span>
                          </div>
                        )}
                      </div>
                      <Button asChild className="w-full mt-auto group">
                        <Link to={`/register/${event.slug}`}>
                          Register
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
