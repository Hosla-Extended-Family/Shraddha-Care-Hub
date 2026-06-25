import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { HelpCircle, PhoneCall } from "lucide-react";
import faqBackground from "@/assets/wall-of-thanks-bg.jpg";

const faqs = [
  {
    question: "What is considered elder abuse?",
    answer:
      "Elder abuse can be physical, emotional, financial, neglect, or abandonment. It includes harm, threats, isolation, misuse of funds, or denying basic care. If you're unsure, it's okay to report and let our team assess it.",
  },
  {
    question: "Can I report anonymously?",
    answer:
      "Yes. You can submit an anonymous report. Providing contact information helps us follow up for clarity, but it is not required.",
  },
  {
    question: "Is my report confidential?",
    answer:
      "Absolutely. Reports are handled confidentially and accessed only by authorized admins. We share details only when necessary to ensure safety and legal compliance.",
  },
  {
    question: "What happens after I submit a report?",
    answer:
      "Our team reviews the report, evaluates urgency, and decides next steps. If you provided contact details, we may reach out for more information.",
  },
  {
    question: "What evidence can I upload?",
    answer:
      "You can upload photos, videos, or documents (PDF/DOC). Please avoid sharing anything that could put you or the elder at immediate risk.",
  },
  {
    question: "What if the elder is in immediate danger?",
    answer:
      "If there is immediate danger, contact local emergency services or the Elder Helpline (14567) right away. Then you can file a report here for follow-up support.",
  },
  {
    question: "Will the elder receive legal support?",
    answer:
      "We connect cases to appropriate legal and welfare resources, including Maintenance Tribunals and social welfare officers, depending on the situation.",
  },
];

export function FAQSection() {
  return (
    <section className="relative py-16 lg:py-24 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${faqBackground})`,
          backgroundAttachment: "fixed",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
      />
      <div className="absolute inset-0 bg-black/25" />

      <div className="absolute top-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto rotate-180 block"
          aria-hidden="true"
        >
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="hsl(var(--background))"
          />
        </svg>
      </div>

      <div className="container relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-background/70 text-foreground px-4 py-2 rounded-full text-sm font-medium border border-background/80 shadow-sm">
              <HelpCircle className="h-4 w-4" />
              FAQs
            </div>
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-primary-foreground mt-4 drop-shadow">
              Frequently Asked Questions
            </h2>
            <p className="text-primary-foreground/80 mt-2">
              Quick answers to common questions about elder abuse reporting and support.
            </p>
          </div>

          <Card className="border-white/30 bg-white/70 backdrop-blur-xl shadow-2xl shadow-black/10">
            <CardContent className="p-0">
              <Accordion type="single" collapsible className="divide-y">
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={faq.question}
                    value={`faq-${index}`}
                    className="border-border"
                  >
                    <AccordionTrigger className="group px-6 py-5 text-left text-base font-semibold text-foreground transition-all hover:no-underline">
                      <span className="transition-colors duration-200 group-hover:text-primary">
                        {faq.question}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6 text-sm text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 rounded-2xl border border-white/30 bg-white/70 px-6 py-4 text-center shadow-lg shadow-black/10 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-primary">
              <PhoneCall className="h-5 w-5" />
              <span className="font-semibold">Need immediate help?</span>
            </div>
            <p className="text-muted-foreground">
              Call the Elder Helpline: <span className="font-semibold text-primary">14567</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
