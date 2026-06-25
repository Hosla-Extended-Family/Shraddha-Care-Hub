import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

// Import images - first image uses public folder for LCP optimization
const awarenessBanner = "/images/awareness-banner.png";
import elderAbuseAwareness from "@/assets/elder-abuse-awareness.png";
import clothDistribution from "@/assets/cloth-distribution.png";
import teamEvent from "@/assets/team-event.png";
import orgCollage from "@/assets/org-collage.png";
import heroIllustration1 from "@/assets/hero-illustration-1.jpg";

interface HeroSlide {
  src: string;
  alt: string;
  title?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
}

const heroSlides: HeroSlide[] = [
  {
    src: awarenessBanner,
    alt: "Stop Domestic Abuse of Elderly",
    title: "Stop Elder Abuse",
    description: "Join our campaign against domestic abuse of elderly",
    ctaText: "Learn More",
    ctaLink: "/legal-resources",
  },
  {
    src: heroIllustration1,
    alt: "Family caring for seniors illustration",
    title: "Family Support Network",
    description: "Building bridges between generations",
    ctaText: "About Us",
    ctaLink: "/about",
  },
  {
    src: elderAbuseAwareness,
    alt: "World Elder Abuse Awareness Day",
    title: "Awareness Day",
    description: "World Elder Abuse Awareness Day - June 15th",
    ctaText: "Volunteer",
    ctaLink: "/volunteer",
  },
  {
    src: clothDistribution,
    alt: "Cloth distribution to seniors",
    title: "Community Outreach",
    description: "Providing essential support to those in need",
    ctaText: "Donate Now",
    ctaLink: "/donate",
  },
  {
    src: teamEvent,
    alt: "Team event",
    title: "Join Our Team",
    description: "Be part of the change you want to see",
    ctaText: "Volunteer",
    ctaLink: "/volunteer",
  },
  {
    src: orgCollage,
    alt: "Organization activities collage",
    title: "Our Impact",
    description: "See how we're making a difference",
    ctaText: "Learn More",
    ctaLink: "/about",
  },
];

export function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const isMobile = useIsMobile();

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % heroSlides.length);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(nextSlide, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  const currentSlide = heroSlides[currentIndex];

  return (
    <div
      className="relative w-full aspect-[4/3] md:aspect-[16/10] rounded-2xl overflow-hidden shadow-2xl group"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* 3D Card for current slide */}
      <CardContainer
        containerClassName="absolute inset-0 w-full h-full"
        className="w-full h-full"
      >
        <CardBody className="relative w-full h-full">
          {/* Images with transitions */}
          {heroSlides.map((slide, index) => (
            <div
              key={index}
              className={cn(
                "absolute inset-0 transition-all duration-700 ease-in-out",
                index === currentIndex
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-105 pointer-events-none"
              )}
            >
              <CardItem translateZ={20} className="w-full h-full">
                <img
                  src={slide.src}
                  alt={slide.alt}
                  className="w-full h-full object-cover"
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  width={642}
                  height={401}
                />
              </CardItem>
            </div>
          ))}

        </CardBody>
      </CardContainer>

      {/* Dots indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              index === currentIndex
                ? "bg-primary-foreground w-6"
                : "bg-primary-foreground/50 hover:bg-primary-foreground/75"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
