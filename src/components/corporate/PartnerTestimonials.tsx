import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Quote, Star, Loader2 } from "lucide-react";
import { usePartnerTestimonials, usePartnerOutcomes, getOutcomeIcon } from "@/hooks/use-collaborate-content";
import { format, parseISO } from "date-fns";

export function PartnerTestimonials() {
  const { data: testimonials = [], isLoading: loadingT } = usePartnerTestimonials();
  const { data: outcomes = [], isLoading: loadingO } = usePartnerOutcomes();
  const isLoading = loadingT || loadingO;

  if (!isLoading && testimonials.length === 0 && outcomes.length === 0) return null;

  return (
    <section
      id="partner-testimonials"
      className="relative py-16 lg:py-24 overflow-hidden scroll-mt-20"
      style={{
        background: "linear-gradient(135deg, rgba(88, 55, 163, 0.06) 0%, rgba(55, 100, 180, 0.08) 100%)",
      }}
    >
      <div className="container relative z-10">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-[hsl(250,70%,45%)]/10 text-[hsl(250,70%,45%)] px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Star className="h-4 w-4" />
              Testimonials & Outcomes
            </div>
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Trusted by the Organizations We Work With
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Real words from partners who joined hands with us — and the outcomes we created together.
            </p>
          </div>
        </ScrollReveal>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[hsl(250,70%,45%)]" />
          </div>
        ) : (
          <>
            {/* Outcome stats */}
            {outcomes.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto mb-12">
                {outcomes.map((o, i) => {
                  const Icon = getOutcomeIcon(o.icon);
                  return (
                    <ScrollReveal key={o.id} delay={i * 80} direction="up">
                      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm h-full">
                        <div
                          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                          style={{ background: "linear-gradient(135deg, hsl(250, 70%, 45%), hsl(220, 70%, 50%))" }}
                        >
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-foreground leading-tight">{o.value}</p>
                          <p className="text-xs text-muted-foreground leading-snug">{o.label}</p>
                        </div>
                      </div>
                    </ScrollReveal>
                  );
                })}
              </div>
            )}

            {/* Testimonials */}
            {testimonials.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {testimonials.map((t, index) => (
                  <ScrollReveal key={t.id} delay={index * 120} direction="up">
                    <figure className="relative h-full flex flex-col rounded-2xl border border-border bg-card p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                      <Quote className="h-8 w-8 text-[hsl(250,70%,45%)]/25 mb-3" />
                      <blockquote className="text-sm text-muted-foreground leading-relaxed flex-1">
                        &ldquo;{t.quote}&rdquo;
                      </blockquote>
                      <figcaption className="mt-5 border-t border-border pt-4 flex items-center gap-3">
                        {t.image_url && (
                          <img
                            src={t.image_url}
                            alt={t.author_name}
                            className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                            loading="lazy"
                          />
                        )}
                        <div>
                          <p className="text-sm font-semibold text-foreground">{t.author_name}</p>
                          {t.author_role && <p className="text-xs text-[hsl(250,70%,45%)] font-medium">{t.author_role}</p>}
                          {t.organization && <p className="text-xs text-muted-foreground">{t.organization}</p>}
                          {t.event_date && (
                            <p className="text-xs text-muted-foreground/70">
                              {format(parseISO(t.event_date), "MMMM yyyy")}
                            </p>
                          )}
                        </div>
                      </figcaption>
                    </figure>
                  </ScrollReveal>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
