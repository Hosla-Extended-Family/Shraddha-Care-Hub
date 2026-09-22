import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronRight, ExternalLink, Images } from "lucide-react";
import { parseGallery } from "@/lib/event-media";
import type { Database } from "@/integrations/supabase/types";

type EventRow = Database["public"]["Tables"]["registration_events"]["Row"];

export function eventCanRegister(event: EventRow) {
  return !!(event.enable_registration && event.registration_open && event.status !== "completed");
}

export function eventHasHighlights(event: EventRow) {
  return parseGallery(event.gallery).length > 0;
}

const outlineClass =
  "w-full border-[hsl(250,70%,45%)]/30 text-[hsl(250,70%,45%)] hover:bg-[hsl(250,70%,45%)] hover:text-white";

/**
 * CTAs for an event card. Recurring events (e.g. monthly Hosla Darbar) can offer
 * registration for the upcoming edition AND highlights from past editions at once.
 */
export function EventCtaButtons({ event }: { event: EventRow }) {
  const canRegister = eventCanRegister(event);
  const hasHighlights = eventHasHighlights(event);

  if (canRegister || hasHighlights) {
    return (
      <div className="mt-auto space-y-2">
        {canRegister && (
          <Button asChild size="sm" className="w-full">
            <Link to={`/register/${event.slug}`}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Register
            </Link>
          </Button>
        )}
        {hasHighlights && (
          <Button asChild variant="outline" size="sm" className={outlineClass}>
            <Link to={`/register/${event.slug}#highlights`}>
              <Images className="h-4 w-4 mr-2" />
              View Highlights
            </Link>
          </Button>
        )}
      </div>
    );
  }

  if (event.resource_link) {
    return event.resource_link.startsWith("/") ? (
      <Button asChild variant="outline" size="sm" className={`mt-auto ${outlineClass}`}>
        <Link to={event.resource_link}>
          <ChevronRight className="h-4 w-4 mr-2" />
          Know More
        </Link>
      </Button>
    ) : (
      <Button asChild variant="outline" size="sm" className={`mt-auto ${outlineClass}`}>
        <a href={event.resource_link} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-4 w-4 mr-2" />
          Learn More
        </a>
      </Button>
    );
  }
  return null;
}
