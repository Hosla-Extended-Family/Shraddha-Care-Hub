import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Button } from "@/components/ui/button";
import {
  Stethoscope, Flower2, Building2, HeartHandshake,
  GraduationCap, HandCoins, Handshake, ArrowRight,
} from "lucide-react";
import healthcareIllus from "@/assets/collab/healthcare.png";
import wellnessIllus from "@/assets/collab/wellness.png";
import corporateIllus from "@/assets/collab/corporate.png";
import ngoIllus from "@/assets/collab/ngo.png";
import educationIllus from "@/assets/collab/education.png";
import donorsIllus from "@/assets/collab/donors.png";

interface Opportunity {
  icon: React.ElementType;
  title: string;
  description: string;
  illustration: string;
}

const opportunities: Opportunity[] = [
  {
    icon: Stethoscope,
    title: "Hospitals & Healthcare",
    description:
      "Host health camps, free check-ups, screenings and specialist consultations for seniors alongside our teams.",
    illustration: healthcareIllus,
  },
  {
    icon: Flower2,
    title: "Spiritual & Wellness Groups",
    description:
      "Bring meditation, yoga, mental peace and companionship programs to elders through joint wellness summits.",
    illustration: wellnessIllus,
  },
  {
    icon: Building2,
    title: "Corporates & CSR",
    description:
      "Extend our Corporate Parental Care plan to your employees' parents and channel CSR into elder welfare.",
    illustration: corporateIllus,
  },
  {
    icon: HeartHandshake,
    title: "NGOs & Community Groups",
    description:
      "Team up on drives, awareness campaigns and community events that reach seniors who need us most.",
    illustration: ngoIllus,
  },
  {
    icon: GraduationCap,
    title: "Educational Institutions",
    description:
      "Engage students as volunteers, run intergenerational programs and build a culture of care from a young age.",
    illustration: educationIllus,
  },
  {
    icon: HandCoins,
    title: "Donors & Sponsors",
    description:
      "Sponsor an event, fund a camp or support ongoing care — every contribution creates lasting impact.",
    illustration: donorsIllus,
  },
];

interface PartnershipOpportunitiesProps {
  onCollaborate: () => void;
}

export function PartnershipOpportunities({ onCollaborate }: PartnershipOpportunitiesProps) {
  return (
    <section id="ways-to-partner" className="relative py-16 lg:py-24 bg-background overflow-hidden scroll-mt-20">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, hsl(250, 70%, 45%) 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />
      <div className="container relative z-10">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-[hsl(250,70%,45%)]/10 text-[hsl(250,70%,45%)] px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Handshake className="h-4 w-4" />
              Ways to Partner
            </div>
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Whoever You Are, There's a Way to Collaborate
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Hospitals, wellness groups, companies, NGOs, colleges, donors and passionate individuals — Shraddha
              &amp; Hosla welcome every organization that wants to bring health, dignity and joy to our elders.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map((item, index) => (
            <ScrollReveal key={item.title} delay={index * 80} direction="up">
              <div className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-6 hover:border-[hsl(250,70%,45%)]/40 hover:shadow-xl transition-all duration-300">
                {/* Background illustration overlay */}
                <img
                  src={item.illustration}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  width={512}
                  height={512}
                  className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 object-contain opacity-20 transition-all duration-500 ease-out group-hover:opacity-40 group-hover:scale-110 group-hover:-rotate-6"
                />

                <div className="relative z-10">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl mb-4 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: "linear-gradient(135deg, hsl(250, 70%, 45%), hsl(220, 70%, 50%))" }}
                  >
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>


        <ScrollReveal delay={200}>
          <div className="text-center mt-12">
            <Button
              size="lg"
              className="bg-[hsl(250,70%,45%)] hover:bg-[hsl(250,70%,40%)] text-white group"
              onClick={onCollaborate}
            >
              Start a Collaboration
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
