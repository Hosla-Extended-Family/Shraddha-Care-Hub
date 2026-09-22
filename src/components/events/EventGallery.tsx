import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Play, ImageOff, X, ChevronLeft, ChevronRight } from "lucide-react";
import { youtubeEmbedUrl, youtubeThumb, type EventMediaItem } from "@/lib/event-media";

interface EventGalleryProps {
  items: EventMediaItem[];
}

export function EventGallery({ items }: EventGalleryProps) {
  const images = items.filter((i) => i.type === "image");
  const videos = items.filter((i) => i.type === "youtube");

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  const showPrev = () =>
    setLightboxIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length));
  const showNext = () =>
    setLightboxIndex((i) => (i === null ? null : (i + 1) % images.length));

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <ImageOff className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p>Highlights from this event will be added soon.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Videos */}
      {videos.length > 0 && (
        <div className="space-y-5">
          <h3 className="font-serif text-xl font-bold text-foreground text-center">Watch the Moments</h3>
          <div className="grid gap-6 sm:grid-cols-2">
            {videos.map((video, idx) => {
              const embed = youtubeEmbedUrl(video.url);
              const thumb = youtubeThumb(video.url);
              if (!embed) return null;
              const isPlaying = playingVideo === video.url;
              return (
                <figure key={idx} className="space-y-2">
                  <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black shadow-md">
                    {isPlaying ? (
                      <iframe
                        src={`${embed}?autoplay=1&rel=0`}
                        title={video.caption || `Event video ${idx + 1}`}
                        className="absolute inset-0 h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPlayingVideo(video.url)}
                        className="group absolute inset-0 h-full w-full"
                        aria-label="Play video"
                      >
                        {thumb && (
                          <img
                            src={thumb}
                            alt={video.caption || "Video thumbnail"}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        )}
                        <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/35">
                          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 shadow-lg transition-transform group-hover:scale-110">
                            <Play className="h-7 w-7 translate-x-0.5 text-primary" fill="currentColor" />
                          </span>
                        </span>
                      </button>
                    )}
                  </div>
                  {video.caption && (
                    <figcaption className="text-sm text-muted-foreground text-center">{video.caption}</figcaption>
                  )}
                </figure>
              );
            })}
          </div>
        </div>
      )}

      {/* Photos */}
      {images.length > 0 && (
        <div className="space-y-5">
          <h3 className="font-serif text-xl font-bold text-foreground text-center">Photo Gallery</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setLightboxIndex(idx)}
                className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted shadow-sm"
              >
                <img
                  src={img.url}
                  alt={img.caption || `Event photo ${idx + 1}`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  loading="lazy"
                />
                {img.caption && (
                  <span className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/70 to-transparent p-2 text-left text-xs text-white transition-transform duration-300 group-hover:translate-y-0">
                    {img.caption}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={lightboxIndex !== null} onOpenChange={(o) => !o && setLightboxIndex(null)}>
        <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none [&>button]:hidden">
          {lightboxIndex !== null && images[lightboxIndex] && (
            <div className="relative">
              <img
                src={images[lightboxIndex].url}
                alt={images[lightboxIndex].caption || `Event photo ${lightboxIndex + 1}`}
                className="max-h-[80vh] w-full rounded-xl object-contain"
              />
              {images[lightboxIndex].caption && (
                <p className="mt-3 text-center text-sm text-white/90">{images[lightboxIndex].caption}</p>
              )}

              <button
                onClick={() => setLightboxIndex(null)}
                aria-label="Close"
                className="absolute -top-3 -right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-foreground shadow-lg"
              >
                <X className="h-5 w-5" />
              </button>

              {images.length > 1 && (
                <>
                  <button
                    onClick={showPrev}
                    aria-label="Previous photo"
                    className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-lg hover:bg-white"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={showNext}
                    aria-label="Next photo"
                    className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-lg hover:bg-white"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
