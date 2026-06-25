import { Star } from "lucide-react";

export function FloatingElements() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Floating circles */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/30 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-primary/10 rounded-full blur-2xl animate-pulse delay-500" />

      {/* Rotating ring */}
      <div className="absolute top-20 right-20 lg:right-[15%] w-32 h-32 lg:w-48 lg:h-48">
        <div className="w-full h-full border-2 border-dashed border-primary/20 rounded-full animate-[spin_20s_linear_infinite]" />
        <div className="absolute inset-4 border border-primary/10 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
      </div>

      {/* Small stars */}
      <Star className="absolute top-[40%] left-[15%] h-4 w-4 text-primary/30 animate-pulse" />
      <Star className="absolute top-[60%] right-[20%] h-3 w-3 text-primary/20 animate-pulse delay-200" />
      <Star className="absolute bottom-[40%] left-[25%] h-5 w-5 text-primary/25 animate-pulse delay-400" />

      {/* Animated gradient lines */}
      <div className="absolute top-0 left-1/4 w-px h-32 bg-gradient-to-b from-transparent via-primary/20 to-transparent animate-pulse" />
      <div className="absolute bottom-0 right-1/3 w-px h-24 bg-gradient-to-t from-transparent via-primary/20 to-transparent animate-pulse delay-500" />
    </div>
  );
}
