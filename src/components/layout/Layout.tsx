import { ReactNode, useState } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { ScrollToTopButton } from "@/components/ui/scroll-to-top-button";
import { AlertTriangle, SquareArrowOutUpRight } from "lucide-react";
import { QuickReportModal } from "@/components/QuickReportModal";
import { TextFlip } from "@/components/ui/text-flip";
import { LayoutTextFlip } from "@/components/ui/layout-text-flip";
import { StickyBanner } from "@/components/ui/sticky-banner";
import { Link } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
}

// Banner announcement messages
const BannerMessage1 = () => (
  <span>🛡️ Report Elder Abuse — Your voice can protect our seniors. Speak up, stay anonymous.</span>
);

const BannerMessage1Short = () => (
  <span>🛡️ Report Elder Abuse — Stay anonymous.</span>
);

const BannerMessage2 = () => (
  <Link to="/games" className="group inline-flex items-center gap-2 pr-1 hover:opacity-90 transition-opacity">
    <span>
      🎮 NEW: <span className="underline decoration-2 underline-offset-4 decoration-white/60">Fun Games for Seniors</span> — Enjoy puzzles & brain teasers at your fingertips!
    </span>
    <SquareArrowOutUpRight className="h-4 w-4 flex-shrink-0 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
  </Link>
);

const BannerMessage2Short = () => (
  <Link to="/games" className="group inline-flex items-center gap-1.5 pr-1 hover:opacity-90 transition-opacity">
    <span>
      🎮 New: <span className="underline decoration-2 underline-offset-4 decoration-white/60">Senior Games</span> — Play now!
    </span>
    <SquareArrowOutUpRight className="h-3.5 w-3.5 flex-shrink-0 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
  </Link>
);

const bannerMessages = [<BannerMessage1 key="msg1" />, <BannerMessage2 key="msg2" />];
const bannerMessagesShort = [<BannerMessage1Short key="msg1-short" />, <BannerMessage2Short key="msg2-short" />];

const elderAbuseTranslations = [
  "Report Elder Abuse",
  "বয়স্ক নির্যাতনের রিপোর্ট করুন",
  "वृद्धों पर अत्याचार की रिपोर्ट करें",
  "বয়স্ক নির্যাতনের রিপোর্ট করুন",
];

export function Layout({ children }: LayoutProps) {
  const [isQuickReportOpen, setIsQuickReportOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky Announcement Banner */}
      <StickyBanner 
        className="bg-gradient-to-r from-blue-600 to-blue-500 text-white"
        hideOnScroll
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            <TextFlip 
              words={bannerMessagesShort} 
              duration={4000} 
              className="min-w-[220px] text-center sm:hidden"
            />
            <TextFlip 
              words={bannerMessages} 
              duration={4000} 
              className="hidden min-w-[400px] text-center sm:inline-flex"
            />
          </span>
        </div>
      </StickyBanner>

      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ScrollToTopButton />
      
      {/* Floating Report Elder Abuse Button */}
      <button
        onClick={() => setIsQuickReportOpen(true)}
        className="fixed bottom-24 right-4 sm:right-6 z-50 group"
        aria-label="Report Elder Abuse"
      >
        <div className="relative">
          {/* Pulse animation background */}
          <div className="absolute inset-0 bg-destructive rounded-lg animate-pulse opacity-20" />
          
          {/* Main button */}
          <div className="relative flex items-center gap-2 px-4 py-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <LayoutTextFlip
              text=""
              words={elderAbuseTranslations}
              duration={2600}
              containerClassName="gap-0"
              textClassName="text-xs sm:text-sm"
              flipClassName="px-2 py-0.5 text-xs sm:text-sm bg-red-50/90 text-red-900 rounded-md ring-1 ring-red-200/70"
            />
          </div>
        </div>
      </button>

      {/* Quick Report Modal */}
      <QuickReportModal 
        isOpen={isQuickReportOpen} 
        onClose={() => setIsQuickReportOpen(false)} 
      />
    </div>
  );
}
