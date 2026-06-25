import { useState } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

// Import images
import awarenessCamp from "@/assets/awareness-camp.png";
import clothDistribution from "@/assets/cloth-distribution.png";
import eventPurulia from "@/assets/event-purulia.png";
import hoslaBooth from "@/assets/hosla-booth.png";
import shraddhaWork from "@/assets/shraddha-care-work.jpg";
import shraddhaWork2 from "@/assets/shraddha-care-work2.jpg";
import shraddhaWork3 from "@/assets/shraddha-care-work3.jpg";
import shraddhaWork4 from "@/assets/shraddha-care-work4.jpg";
import shraddhaWork5 from "@/assets/shraddha-care-work5.jpg";

interface GalleryImage {
  src: string;
  alt: string;
  caption: string;
  tall?: boolean;
}

const galleryImages: GalleryImage[] = [
  {
    src: awarenessCamp,
    alt: "Awareness camp conducted by Shraddha",
    caption: "Elder Awareness Camp",
    tall: true,
  },
  {
    src: clothDistribution,
    alt: "Cloth distribution to seniors",
    caption: "Cloth Distribution Drive",
  },
  {
    src: eventPurulia,
    alt: "Senior citizen event in Purulia",
    caption: "Community Event in Purulia",
  },
  {
    src: shraddhaWork,
    alt: "Community outreach program",
    caption: "Community Outreach Program",
  },
  {
    src: hoslaBooth,
    alt: "Hosla community booth",
    caption: "Hosla Community Booth",
  },
  {
    src: shraddhaWork2,
    alt: "Hosla awareness rally",
    caption: "Awareness Rally",
    tall: true,
  },
  {
    src: shraddhaWork3,
    alt: "Interview at Pride India Awards",
    caption: "Pride India Awards 2024",
  },
  {
    src: shraddhaWork4,
    alt: "Legal Awareness Workshop poster",
    caption: "Legal Awareness Workshop",
    tall: true,
  },
  {
    src: shraddhaWork5,
    alt: "Relief materials distribution",
    caption: "Relief Materials Distribution",
  },
];

export function WorkGallery() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const handlePrevious = () => {
    if (selectedImage !== null) {
      setSelectedImage(selectedImage === 0 ? galleryImages.length - 1 : selectedImage - 1);
    }
  };

  const handleNext = () => {
    if (selectedImage !== null) {
      setSelectedImage(selectedImage === galleryImages.length - 1 ? 0 : selectedImage + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") handlePrevious();
    if (e.key === "ArrowRight") handleNext();
    if (e.key === "Escape") setSelectedImage(null);
  };

  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Our Work in Action
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Glimpses from our awareness camps, events, and community programs.
          </p>
        </div>

        {/* Masonry Grid */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
          {galleryImages.map((image, index) => (
            <div
              key={index}
              className={`break-inside-avoid group relative overflow-hidden rounded-xl shadow-md cursor-pointer ${
                image.tall ? "aspect-[3/4]" : "aspect-video"
              }`}
              onClick={() => setSelectedImage(index)}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {/* Caption */}
              <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-primary-foreground font-medium text-sm">
                  {image.caption}
                </p>
              </div>
              {/* Zoom Icon */}
              <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ZoomIn className="h-4 w-4 text-foreground" />
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox Dialog */}
        <Dialog open={selectedImage !== null} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent 
            className="max-w-[95vw] max-h-[95vh] p-0 bg-foreground/95 border-none overflow-hidden"
            onKeyDown={handleKeyDown}
          >
            <VisuallyHidden>
              <DialogTitle>
                {selectedImage !== null ? galleryImages[selectedImage].caption : "Gallery Image"}
              </DialogTitle>
            </VisuallyHidden>
            
            {selectedImage !== null && (
              <div className="relative flex items-center justify-center min-h-[60vh]">
                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 z-50 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
                  onClick={() => setSelectedImage(null)}
                >
                  <X className="h-6 w-6" />
                </Button>

                {/* Previous Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 z-50 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground h-12 w-12"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>

                {/* Image */}
                <div className="flex flex-col items-center justify-center p-8 w-full">
                  <img
                    src={galleryImages[selectedImage].src}
                    alt={galleryImages[selectedImage].alt}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg animate-scale-in"
                  />
                  <div className="mt-4 text-center">
                    <p className="text-primary-foreground font-medium text-lg">
                      {galleryImages[selectedImage].caption}
                    </p>
                    <p className="text-primary-foreground/70 text-sm mt-1">
                      {selectedImage + 1} / {galleryImages.length}
                    </p>
                  </div>
                </div>

                {/* Next Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 z-50 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground h-12 w-12"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
