import { Layout } from "@/components/layout/Layout";
import { MembershipPlans } from "@/components/corporate/MembershipPlans";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, Heart } from "lucide-react";
import hoslaLogo from "@/assets/hosla-logo.png";
import logoShraddha from "@/assets/logo-shraddha.png";

export default function MembershipPlansPage() {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative py-16 lg:py-20 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, hsl(250, 70%, 45%) 0%, hsl(220, 70%, 50%) 50%, hsl(250, 70%, 40%) 100%)",
          }}
        />
        {/* Decorative circles */}
        <div className="absolute top-10 left-10 w-20 h-20 border-2 border-white/10 rounded-full" />
        <div className="absolute bottom-10 right-16 w-32 h-32 border-2 border-white/10 rounded-full" />
        <div className="absolute top-1/3 right-10 w-4 h-4 bg-white/20 rounded-full animate-pulse" />

        <div className="container relative z-10 text-center space-y-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src={hoslaLogo} alt="Hosla" className="h-10 brightness-0 invert" />
            <span className="text-2xl text-white/60">&</span>
            <img src={logoShraddha} alt="Shraddha" className="h-10 brightness-0 invert" />
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
            Membership Plans &amp; Benefits
          </h1>
          <p className="text-lg text-white/85 max-w-2xl mx-auto">
            Choose the care plan that's right for your family. From daily wellness therapy to personalized home visits —
            every plan brings health, happiness, and companionship to your loved ones.
          </p>
        </div>

        {/* Bottom wave */}
        <div className="absolute -bottom-px left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
            <path
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="hsl(var(--background))"
            />
          </svg>
        </div>
      </section>

      {/* Plans section */}
      <MembershipPlans />

      {/* Bottom CTA */}
      <ScrollReveal>
        <section className="py-16 lg:py-20 bg-card border-t border-border">
          <div className="container text-center space-y-6 max-w-2xl mx-auto">
            <Heart className="h-8 w-8 mx-auto text-[hsl(250,70%,45%)]" />
            <h2 className="font-serif text-2xl lg:text-3xl font-bold text-foreground">
              Have Questions?
            </h2>
            <p className="text-muted-foreground">
              We're here to help you find the perfect plan for your family. Reach out to us anytime — we'd love to chat.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Button asChild size="lg" className="bg-[hsl(250,70%,45%)] hover:bg-[hsl(250,70%,40%)] text-white group">
                <Link to="/contact">
                  Contact Us
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-[hsl(250,70%,45%)]/30 text-[hsl(250,70%,45%)] hover:bg-[hsl(250,70%,45%)] hover:text-white group"
              >
                <Link to="/partner#corporate-plan">
                  <Building2 className="mr-2 h-4 w-4" />
                  Corporate Care Program
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </ScrollReveal>
    </Layout>
  );
}
