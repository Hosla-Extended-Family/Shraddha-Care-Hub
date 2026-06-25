import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

import impactImg1 from "@/assets/impact-img1.jpg";
import impactImg2 from "@/assets/impact-img2.jpg";
import impactImg3 from "@/assets/impact-img3.jpg";
import impactImg4 from "@/assets/impact-img4.jpg";
import impactImg5 from "@/assets/impact-img5.jpg";
import impactImg6 from "@/assets/impact-img6.jpg";
import elderAbuseAwareness from "@/assets/elder-abuse-awareness.png";
import clothDistribution from "@/assets/cloth-distribution.png";

const impactImages = [
  { 
    src: elderAbuseAwareness, 
    alt: "World Elder Abuse Awareness Day 2024",
    caption: "World Elder Abuse Awareness Day 2024",
    description: "Shraddha organized awareness programs across multiple locations to mark World Elder Abuse Awareness Day, educating communities about the rights of senior citizens."
  },
  { 
    src: clothDistribution, 
    alt: "Cloth distribution to seniors by Shraddha",
    caption: "Festival Cloth Distribution",
    description: "Our volunteers distributed new clothes to underprivileged seniors during the festive season, bringing joy and dignity to their celebrations."
  },
  { 
    src: impactImg1, 
    alt: "Awareness session with community members",
    caption: "Community Awareness Session",
    description: "Interactive sessions with community members to spread awareness about elder care, mental health support, and available resources for senior citizens."
  },
  { 
    src: impactImg2, 
    alt: "Educational outreach program",
    caption: "Educational Outreach Program",
    description: "Our team conducting educational programs at rehabilitation centers, helping individuals understand the importance of respecting and caring for elders."
  },
  { 
    src: impactImg3, 
    alt: "Community engagement with children and seniors",
    caption: "Intergenerational Bonding",
    description: "Bringing together children and seniors to foster understanding, respect, and meaningful connections across generations."
  },
  { 
    src: impactImg4, 
    alt: "Award ceremony recognition",
    caption: "Recognition & Awards",
    description: "Shraddha Welfare Association receiving recognition for outstanding contribution towards senior citizen welfare and community development."
  },
  { 
    src: impactImg5, 
    alt: "Mobile awareness campaign",
    caption: "Mobile Awareness Campaign",
    description: "Taking our message to the streets with mobile awareness campaigns, reaching communities in remote areas to spread knowledge about elder rights."
  },
  { 
    src: impactImg6, 
    alt: "Cloth donation drive",
    caption: "Festival at Every Home",
    description: "Our 'Festival at Every Home' initiative ensuring that every senior citizen, regardless of their circumstances, can celebrate festivals with new clothes and dignity."
  },
];

export const ImpactGallery = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Track current slide
  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    onSelect();
    return () => { api.off("select", onSelect); };
  }, [api]);

  // Autoplay
  useEffect(() => {
    if (!api || isPaused) return;
    const interval = setInterval(() => api.scrollNext(), 4000);
    return () => clearInterval(interval);
  }, [api, isPaused]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (selectedImage !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [selectedImage]);

  // Keyboard navigation in lightbox
  useEffect(() => {
    if (selectedImage === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedImage(null);
      if (e.key === "ArrowLeft") setSelectedImage((prev) => prev !== null ? (prev - 1 + impactImages.length) % impactImages.length : null);
      if (e.key === "ArrowRight") setSelectedImage((prev) => prev !== null ? (prev + 1) % impactImages.length : null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedImage]);

  const handleMouseEnter = useCallback(() => setIsPaused(true), []);
  const handleMouseLeave = useCallback(() => setIsPaused(false), []);

  // Track drag vs click — embla swallows clicks after drag
  const pointerDown = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerDown.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleClick = useCallback((index: number, e: React.MouseEvent) => {
    if (pointerDown.current) {
      const dx = Math.abs(e.clientX - pointerDown.current.x);
      const dy = Math.abs(e.clientY - pointerDown.current.y);
      if (dx > 5 || dy > 5) {
        pointerDown.current = null;
        return; // was a drag, not a click
      }
    }
    pointerDown.current = null;
    setSelectedImage(index);
  }, []);

  return (
    <div className="space-y-5">
      {/* Main Carousel */}
      <Carousel
        setApi={setApi}
        opts={{ align: "start", loop: true }}
        className="w-full"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {impactImages.map((image, index) => (
            <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
              <div 
                className="overflow-hidden rounded-xl shadow-lg cursor-pointer group aspect-[4/3] relative"
                onPointerDown={handlePointerDown}
                onClick={(e) => handleClick(index, e)}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  loading="lazy"
                  width={413}
                  height={310}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Hover overlay with caption */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-4">
                  <p className="text-white text-sm font-medium leading-snug">{image.caption}</p>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex -left-4 bg-background/80 backdrop-blur-sm border-border hover:bg-background" />
        <CarouselNext className="hidden md:flex -right-4 bg-background/80 backdrop-blur-sm border-border hover:bg-background" />
      </Carousel>

      {/* Thumbnail preview boxes */}
      <div className="flex justify-center gap-2 py-2 overflow-x-auto px-2">
        {impactImages.map((image, index) => (
          <button
            key={index}
            onClick={() => api?.scrollTo(index)}
            className={`flex-shrink-0 w-14 h-10 sm:w-16 sm:h-12 rounded-md overflow-hidden border-2 transition-all duration-300 ${
              current === index
                ? "border-primary opacity-100 scale-110 shadow-md"
                : "border-border/30 opacity-50 hover:opacity-80"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          >
            <img src={image.src} alt={image.alt} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedImage !== null && createPortal(
        <div 
          className="fixed inset-0 flex items-center justify-center"
          onClick={() => setSelectedImage(null)}
          style={{ top: 0, left: 0, right: 0, bottom: 0, position: "fixed", zIndex: 99999, background: "rgba(0,0,0,0.85)" }}
        >
          <div 
            className="relative w-full h-full flex flex-col items-center justify-center p-4 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full p-2"
              aria-label="Close lightbox"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Counter */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 text-white/60 text-sm font-medium bg-white/10 px-3 py-1 rounded-full">
              {selectedImage + 1} / {impactImages.length}
            </div>
            
            {/* Image container */}
            <div className="relative flex-1 w-full max-w-5xl flex items-center justify-center min-h-0">
              <img
                src={impactImages[selectedImage].src}
                alt={impactImages[selectedImage].alt}
                className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-300"
              />
              
              {/* Previous button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage((selectedImage - 1 + impactImages.length) % impactImages.length);
                }}
                className="absolute left-0 sm:left-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white p-2.5 sm:p-3 rounded-full transition-all duration-300 hover:scale-110"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>

              {/* Next button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage((selectedImage + 1) % impactImages.length);
                }}
                className="absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white p-2.5 sm:p-3 rounded-full transition-all duration-300 hover:scale-110"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
            
            {/* Caption */}
            <div className="mt-3 text-center px-4 space-y-1 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-base sm:text-lg font-serif font-semibold text-white">
                {impactImages[selectedImage].caption}
              </h3>
              <p className="text-white/70 text-xs sm:text-sm leading-relaxed">
                {impactImages[selectedImage].description}
              </p>
            </div>

            {/* Thumbnail strip */}
            <div className="mt-4 flex justify-center gap-2 px-4 overflow-x-auto max-w-full pb-2">
              {impactImages.map((image, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); setSelectedImage(index); }}
                  className={`flex-shrink-0 w-14 h-10 sm:w-16 sm:h-12 rounded-md overflow-hidden border-2 transition-all duration-300 ${
                    selectedImage === index
                      ? "border-white opacity-100 scale-110"
                      : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  <img src={image.src} alt={image.alt} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
