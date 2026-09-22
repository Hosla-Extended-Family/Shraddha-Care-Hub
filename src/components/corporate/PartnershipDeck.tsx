import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Download, FileText } from "lucide-react";

const DECK_URL = "/hosla-shraddha-partnership-deck.pdf";

interface PartnershipDeckProps {
  onCollaborate?: () => void;
}

export function PartnershipDeck({ onCollaborate }: PartnershipDeckProps) {
  return (
    <section className="relative py-14 lg:py-20 bg-background overflow-hidden">
      <div className="container relative z-10">
        <ScrollReveal>
          <div className="max-w-5xl mx-auto">
            <div className="relative overflow-hidden rounded-2xl border border-[hsl(250,70%,45%)]/30 bg-gradient-to-br from-[hsl(250,70%,45%)]/8 via-card to-[hsl(220,70%,50%)]/8 p-6 sm:p-8">
              <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-[hsl(250,70%,45%)]/12">
                  <FileText className="h-8 w-8 text-[hsl(250,70%,45%)]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-serif text-xl lg:text-2xl font-bold text-foreground mb-1.5">
                    Download our Partnership Deck
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    A one-page overview of Hosla &amp; Shraddha programs, our impact approach and every way to
                    collaborate — perfect to share with your team.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
                  <Button
                    asChild
                    size="lg"
                    className="bg-[hsl(250,70%,45%)] hover:bg-[hsl(250,70%,40%)] text-white group"
                  >
                    <a href={DECK_URL} download="Hosla-Shraddha-Partnership-Deck.pdf" target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                      Download Deck (PDF)
                    </a>
                  </Button>
                  {onCollaborate && (
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-[hsl(250,70%,45%)]/40 text-[hsl(250,70%,45%)] hover:bg-[hsl(250,70%,45%)] hover:text-white"
                      onClick={onCollaborate}
                    >
                      Start a Collaboration
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
