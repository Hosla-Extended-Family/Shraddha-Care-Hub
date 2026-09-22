import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { HelpCircle, Loader2 } from "lucide-react";
import { usePartnershipFaqs } from "@/hooks/use-collaborate-content";

export function PartnershipFAQ() {
  const { data: faqs = [], isLoading } = usePartnershipFaqs();

  if (!isLoading && faqs.length === 0) return null;

  return (
    <section id="partnership-faq" className="relative py-16 lg:py-24 bg-background overflow-hidden scroll-mt-20">
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
              <HelpCircle className="h-4 w-4" />
              Partnership FAQs
            </div>
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Questions Collaborators Ask
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Everything you need to know about eligibility, timelines, reporting and onboarding before we begin.
            </p>
          </div>
        </ScrollReveal>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[hsl(250,70%,45%)]" />
          </div>
        ) : (
          <ScrollReveal delay={100}>
            <div className="max-w-3xl mx-auto rounded-2xl border border-border bg-card shadow-lg">
              <Accordion type="single" collapsible className="divide-y">
                {faqs.map((faq, index) => (
                  <AccordionItem key={faq.id} value={`faq-${index}`} className="border-border px-2">
                    <AccordionTrigger className="group px-4 py-5 text-left text-base font-semibold text-foreground hover:no-underline">
                      <span className="transition-colors duration-200 group-hover:text-[hsl(250,70%,45%)]">
                        {faq.question}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-6 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </ScrollReveal>
        )}
      </div>
    </section>
  );
}
