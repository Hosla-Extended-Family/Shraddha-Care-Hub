import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { parseGallery } from "@/lib/event-media";
import { format, parseISO } from "date-fns";
import {
  Sparkles,
  HeartPulse,
  Users,
  CalendarCheck,
  Award,
  Stethoscope,
  Handshake,
  Heart,
  Star,
  Building2,
  GraduationCap,
  Scale,
  Brain,
  type LucideIcon,
} from "lucide-react";

/** Lucide icons available for outcome cards (admin-selectable). */
export const OUTCOME_ICONS: Record<string, LucideIcon> = {
  Sparkles,
  HeartPulse,
  Users,
  CalendarCheck,
  Award,
  Stethoscope,
  Handshake,
  Heart,
  Star,
  Building2,
  GraduationCap,
  Scale,
  Brain,
};

export const OUTCOME_ICON_NAMES = Object.keys(OUTCOME_ICONS);

export function getOutcomeIcon(name: string | null | undefined): LucideIcon {
  return (name && OUTCOME_ICONS[name]) || Sparkles;
}

export type OrgLogo = "shraddha" | "hosla" | "both" | "none";

export interface CollaborationView {
  id: string;
  title: string;
  date: string;
  dateISO: string;
  month: string;
  sector: string;
  type: string;
  location: string;
  partner: string;
  description: string;
  outcomes: string[];
  image: string | null;
  orgLogo: OrgLogo;
  collaboratorLogoUrl: string | null;
  collaboratorText: string | null;
  eventSlug: string | null;
  hasHighlights: boolean;
}

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1280&q=80";

export function useCollaborations() {
  return useQuery({
    queryKey: ["collaborations", "public"],
    queryFn: async (): Promise<CollaborationView[]> => {
      const { data, error } = await supabase
        .from("collaborations")
        .select(
          "*, event:registration_events(title, slug, event_date, location, banner_url, gallery)"
        )
        .eq("is_published", true)
        .order("display_order", { ascending: true });

      if (error) throw error;

      return (data ?? []).map((c: any) => {
        const ev = c.event ?? {};
        const gallery = parseGallery(ev.gallery);
        const firstImage = gallery.find((g) => g.type === "image")?.url ?? null;
        const dateISO: string = ev.event_date ?? c.created_at?.slice(0, 10) ?? "";
        let dateLabel = "";
        let month = "";
        if (dateISO) {
          try {
            const d = parseISO(dateISO);
            dateLabel = format(d, "d MMMM yyyy");
            month = format(d, "MMMM yyyy");
          } catch {
            dateLabel = dateISO;
          }
        }
        const outcomes = Array.isArray(c.outcomes)
          ? (c.outcomes as unknown[]).filter((o): o is string => typeof o === "string")
          : [];
        return {
          id: c.id,
          title: ev.title ?? c.partner_name ?? "Collaboration",
          date: dateLabel,
          dateISO,
          month,
          sector: c.sector ?? "Other",
          type: c.initiative_type ?? "Collaboration",
          location: ev.location ?? "",
          partner: c.partner_name ?? "",
          description: c.description ?? "",
          outcomes,
          image: ev.banner_url ?? firstImage ?? FALLBACK_IMG,
          orgLogo: (c.org_logo ?? "both") as OrgLogo,
          collaboratorLogoUrl: c.collaborator_logo_url ?? null,
          collaboratorText: c.collaborator_text ?? null,
          eventSlug: ev.slug ?? null,
          hasHighlights: gallery.length > 0,
        };
      });
    },
  });
}

export function usePartnershipFaqs() {
  return useQuery({
    queryKey: ["partnership_faqs", "public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partnership_faqs")
        .select("*")
        .eq("is_published", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePartnerTestimonials() {
  return useQuery({
    queryKey: ["partner_testimonials", "public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_testimonials")
        .select("*")
        .eq("is_published", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePartnerOutcomes() {
  return useQuery({
    queryKey: ["partner_outcomes", "public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_outcomes")
        .select("*")
        .eq("is_published", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}
