import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2, MapPin, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";
import { EventCtaButtons } from "@/components/events/EventCtaButtons";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

type ProjectEvent = Database["public"]["Tables"]["registration_events"]["Row"];
type ProjectStatus = Database["public"]["Enums"]["project_status"];
type OrganizationType = Database["public"]["Enums"]["organization_type"];

interface CardTransform {
  rotateX: number;
  rotateY: number;
  scale: number;
}

const ProjectEventCard = ({
  event,
  index,
  getStatusBadge,
  getOrgLabel,
}: {
  event: ProjectEvent;
  index: number;
  getStatusBadge: (status: ProjectStatus) => JSX.Element;
  getOrgLabel: (org: OrganizationType) => string;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastMousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const card = cardRef.current;
    const image = imageRef.current;

    if (!card || !image) return;

    let rect: DOMRect | undefined;
    let centerX = 0;
    let centerY = 0;

    const updateCardTransform = (mouseX: number, mouseY: number) => {
      if (!rect) {
        rect = card.getBoundingClientRect();
        centerX = rect.left + rect.width / 2;
        centerY = rect.top + rect.height / 2;
      }

      const relativeX = mouseX - centerX;
      const relativeY = mouseY - centerY;

      const cardTransform: CardTransform = {
        rotateX: -relativeY * 0.03,
        rotateY: relativeX * 0.03,
        scale: 1.015,
      };

      const imageTransform: CardTransform = {
        rotateX: -relativeY * 0.02,
        rotateY: relativeX * 0.02,
        scale: 1.04,
      };

      return { cardTransform, imageTransform };
    };

    const animate = () => {
      const { cardTransform, imageTransform } = updateCardTransform(
        lastMousePosition.current.x,
        lastMousePosition.current.y
      );

      card.style.transform = `perspective(1000px) rotateX(${cardTransform.rotateX}deg) rotateY(${cardTransform.rotateY}deg) scale3d(${cardTransform.scale}, ${cardTransform.scale}, ${cardTransform.scale})`;
      card.style.boxShadow = "0 10px 35px rgba(0, 0, 0, 0.18)";

      image.style.transform = `perspective(1000px) rotateX(${imageTransform.rotateX}deg) rotateY(${imageTransform.rotateY}deg) scale3d(${imageTransform.scale}, ${imageTransform.scale}, ${imageTransform.scale})`;

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseEnter = () => {
      rect = undefined;
      card.style.transition = "transform 0.2s ease, box-shadow 0.2s ease";
      image.style.transition = "transform 0.2s ease";
      animate();
    };

    const handleMouseLeave = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      card.style.transform = "perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)";
      card.style.boxShadow = "";
      card.style.transition = "transform 0.5s ease, box-shadow 0.5s ease";

      image.style.transform = "perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)";
      image.style.transition = "transform 0.5s ease";
    };

    card.addEventListener("mouseenter", handleMouseEnter);
    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      card.removeEventListener("mouseenter", handleMouseEnter);
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <ScrollReveal delay={index * 100}>
      <div
        ref={cardRef}
        className="relative bg-background rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-border/50 group h-full flex flex-col"
      >
        {/* Purple accent line */}
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
                ref={imageRef}
                src={event.banner_url}
                alt={event.title}
                className="relative z-10 aspect-[16/9] w-full object-contain bg-transparent transition-transform duration-500"
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
            <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
              {event.description}
            </p>
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

          <EventCtaButtons event={event} />

        </div>
      </div>
    </ScrollReveal>
  );
};

interface ProjectsEventsSectionProps {
  limit?: number;
  showViewAll?: boolean;
}

export function ProjectsEventsSection({ limit, showViewAll = false }: ProjectsEventsSectionProps) {
  const isMobile = useIsMobile();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["public-registration-events", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registration_events")
        .select("*")
        .eq("is_published", true)
        .order("display_order", { ascending: true })
        .order("event_date", { ascending: false });
      if (error) throw error;

      // Show upcoming & ongoing first, then completed (past) events to keep visitors engaged.
      const rank: Record<ProjectStatus, number> = { upcoming: 0, ongoing: 1, completed: 2 };
      const sorted = [...(data as ProjectEvent[])].sort((a, b) => rank[a.status] - rank[b.status]);
      return limit ? sorted.slice(0, limit) : sorted;
    },
  });


  // Track current slide
  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on("select", onSelect);
    onSelect();

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  // Auto-play for mobile carousel
  useEffect(() => {
    if (!api || !isMobile || isPaused || events.length <= 1) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 4000);

    return () => clearInterval(interval);
  }, [api, isMobile, isPaused, events.length]);

  const handleInteractionStart = useCallback(() => {
    setIsPaused(true);
  }, []);

  const handleInteractionEnd = useCallback(() => {
    setTimeout(() => setIsPaused(false), 5000);
  }, []);

  const getStatusBadge = (status: ProjectStatus) => {
    if (status === "upcoming") {
      return (
        <Badge className="bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-100">
          Upcoming
        </Badge>
      );
    }
    if (status === "completed") {
      return (
        <Badge className="bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-100">
          Past Event
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-100">
        Ongoing
      </Badge>
    );
  };

  const getOrgLabel = (org: OrganizationType) => {
    const labels: Record<OrganizationType, string> = {
      shraddha: "Shraddha",
      hosla: "Hosla",
      both: "Shraddha & Hosla",
    };
    return labels[org];
  };

  if (isLoading) {
    return (
      <section 
        className="relative py-16 lg:py-24 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(88, 55, 163, 0.08) 0%, rgba(120, 80, 200, 0.12) 100%)' }}
      >
        <div className="container">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'hsl(250, 70%, 45%)' }} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section 
      id="events"
      className="relative py-16 lg:py-24 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, rgba(88, 55, 163, 0.08) 0%, rgba(120, 80, 200, 0.12) 100%)' }}
    >
      {/* Decorative calendar icons */}
      <div className="absolute top-10 left-10 opacity-5">
        <Calendar className="w-32 h-32" style={{ color: 'hsl(250, 70%, 45%)' }} />
      </div>
      <div className="absolute bottom-10 right-10 opacity-5">
        <Calendar className="w-32 h-32" style={{ color: 'hsl(250, 70%, 45%)' }} />
      </div>
      
      <div className="container relative z-10">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Our Projects & Events
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore our upcoming initiatives and relive the moments from our past events dedicated to elder care and community welfare.
            </p>
          </div>
        </ScrollReveal>

        {events.length === 0 ? (
          <ScrollReveal>
            <div className="text-center py-12 bg-background/50 rounded-2xl border border-border/50">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" style={{ color: 'hsl(250, 70%, 45%)' }} />
              <p className="text-muted-foreground">No upcoming events at the moment. Check back soon!</p>
            </div>
          </ScrollReveal>
        ) : isMobile ? (
          <div
            onTouchStart={handleInteractionStart}
            onTouchEnd={handleInteractionEnd}
          >
            <Carousel
              opts={{ loop: true, align: "start" }}
              setApi={setApi}
              className="w-full"
            >
              <CarouselContent className="-ml-2">
                {events.map((event, index) => (
                  <CarouselItem key={event.id} className="pl-2 basis-full">
                    <ProjectEventCard
                      event={event}
                      index={0}
                      getStatusBadge={getStatusBadge}
                      getOrgLabel={getOrgLabel}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
            
            {/* Dot indicators */}
            {events.length > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {events.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => api?.scrollTo(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      index === current
                        ? "w-6 bg-[hsl(250,70%,45%)]"
                        : "bg-[hsl(250,70%,45%)]/30 hover:bg-[hsl(250,70%,45%)]/50"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, index) => (
              <ProjectEventCard
                key={event.id}
                event={event}
                index={index}
                getStatusBadge={getStatusBadge}
                getOrgLabel={getOrgLabel}
              />
            ))}
          </div>
        )}

        {showViewAll && events.length > 0 && (
          <div className="text-center mt-10">
            <Button asChild variant="outline" size="lg" className="border-[hsl(250,70%,45%)]/30 text-[hsl(250,70%,45%)] hover:bg-[hsl(250,70%,45%)] hover:text-white">
              <Link to="/events">
                Explore All Events
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
