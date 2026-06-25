import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import {
  Building2, UserCog, BarChart3, Target, Rocket, Briefcase,
  CheckCircle, Star, ArrowRight, Mail, Heart,
} from "lucide-react";
import { PartnerContactModal } from "@/components/corporate/PartnerContactModal";

interface Benefit {
  icon: React.ElementType;
  label: string;
}

const corporateBenefits: Benefit[] = [
  { icon: UserCog, label: "Priority dedicated care consultants for each employee's parents (above 50 years of age)" },
  { icon: BarChart3, label: "Monthly wellness reports for HR & management" },
  { icon: Target, label: "Corporate wellness workshops & employee engagement sessions" },
  { icon: Rocket, label: "Priority onboarding & dedicated helpline" },
  { icon: Briefcase, label: "Tax benefits under CSR initiatives" },
];

export function CorporatePlanSection() {
  const [partnerModal, setPartnerModal] = useState(false);

  return (
    <>
      <section id="corporate-plan" className="relative py-16 lg:py-24 overflow-hidden scroll-mt-20 bg-background">
        {/* Background decoration */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, hsl(250, 70%, 45%) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />

        <div className="container relative z-10">
          {/* Header */}
          <ScrollReveal>
            <div className="text-center mb-10 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-[hsl(250,70%,45%)]/10 text-[hsl(250,70%,45%)] px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Star className="h-4 w-4" />
                Corporate Plan
              </div>
              <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-3">
                Corporate Parental Care Plan
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Like Microsoft 365 for your employees' parents &amp; grandparents — complete care, companionship and
                wellness, delivered at scale for your workforce.
              </p>
            </div>
          </ScrollReveal>

          {/* Plan card */}
          <ScrollReveal delay={100}>
            <div className="max-w-2xl mx-auto">
              <div className="relative rounded-2xl border-2 border-[hsl(250,70%,45%)] bg-card shadow-xl shadow-[hsl(250,70%,45%)]/10 overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-[hsl(250,70%,45%)] via-[hsl(220,70%,50%)] to-[hsl(250,70%,45%)]" />
                <div className="p-6 lg:p-8">
                  {/* Tier name */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-5 w-5 text-[hsl(250,70%,45%)]" />
                      <h3 className="text-xl font-bold text-foreground">Corporate Care</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      For companies caring for their employees' parents &amp; grandparents
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl lg:text-5xl font-extrabold text-foreground">Custom</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Volume-based pricing tailored to your team size</p>
                  </div>

                  {/* CTA */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <Button
                      size="lg"
                      className="flex-1 bg-[hsl(250,70%,45%)] hover:bg-[hsl(250,70%,40%)] text-white group"
                      onClick={() => setPartnerModal(true)}
                    >
                      Request a Quote
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="flex-1 border-[hsl(250,70%,45%)]/40 text-[hsl(250,70%,45%)] hover:bg-[hsl(250,70%,45%)] hover:text-white"
                    >
                      <a href="tel:7811009309">Talk to Us</a>
                    </Button>
                  </div>

                  {/* Benefits */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">All Hosla Care benefits, plus:</p>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-500" />
                      <span className="text-sm text-muted-foreground leading-snug font-medium">Everything in our individual care plans</span>
                    </div>
                    <div className="h-px bg-border my-1" />
                    {corporateBenefits.map((b, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <b.icon className="h-4 w-4 mt-0.5 flex-shrink-0 text-[hsl(250,70%,45%)]" />
                        <span className="text-sm text-muted-foreground leading-snug">{b.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Individual plans redirect banner */}
          <ScrollReveal delay={200}>
            <div className="mt-14 max-w-5xl mx-auto">
              <div className="relative overflow-hidden rounded-2xl border border-[hsl(250,70%,45%)]/30 bg-gradient-to-br from-[hsl(250,70%,45%)]/8 via-card to-[hsl(220,70%,50%)]/8 p-6 sm:p-8">
                <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-[hsl(250,70%,45%)]/12">
                    <Heart className="h-7 w-7 text-[hsl(250,70%,45%)]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-serif text-xl lg:text-2xl font-bold text-foreground mb-1.5">
                      Looking for care for your own parents?
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Explore our <strong className="text-foreground">Standard, Premium &amp; Personalized</strong> Hosla
                      membership plans — designed for families who want the best for their elders.
                    </p>
                  </div>
                  <Button
                    asChild
                    size="lg"
                    className="flex-shrink-0 bg-[hsl(250,70%,45%)] hover:bg-[hsl(250,70%,40%)] text-white group"
                  >
                    <Link to="/membership-plans">
                      View Membership Plans
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <PartnerContactModal open={partnerModal} onOpenChange={setPartnerModal} />
    </>
  );
}
