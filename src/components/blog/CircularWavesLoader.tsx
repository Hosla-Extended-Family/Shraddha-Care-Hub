import { useEffect, useState } from "react";

interface Props {
  progress: number; // 0-100
  label?: string;
  size?: number;
}

/**
 * Circular waves loading animation with animated percentage.
 * Uses SVG wave shape; water level rises with progress.
 */
export function CircularWavesLoader({ progress, label = "Uploading", size = 140 }: Props) {
  const clamped = Math.max(0, Math.min(100, Math.round(progress)));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setDisplay((prev) => {
        if (prev === clamped) return prev;
        const diff = clamped - prev;
        const step = Math.sign(diff) * Math.max(1, Math.round(Math.abs(diff) / 6));
        const next = prev + step;
        if ((diff > 0 && next >= clamped) || (diff < 0 && next <= clamped)) return clamped;
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [clamped]);

  const waterY = 100 - clamped;

  return (
    <div className="flex flex-col items-center justify-center gap-2" role="status" aria-live="polite">
      {/* Shared SVG symbol */}
      <svg xmlns="http://www.w3.org/2000/svg" style={{ display: "none" }}>
        <symbol id="cwl-wave" viewBox="0 0 560 20">
          <path d="M420,20c21.5-0.4,38.8-2.5,51.1-4.5c13.4-2.2,26.5-5.2,27.3-5.4C514,6.5,518,4.7,528.5,2.7c7.1-1.3,17.9-2.8,31.5-2.7c0,0,0,0,0,0v20H420z" />
          <path d="M420,20c-21.5-0.4-38.8-2.5-51.1-4.5c-13.4-2.2-26.5-5.2-27.3-5.4C326,6.5,322,4.7,311.5,2.7C304.3,1.4,293.6-0.1,280,0c0,0,0,0,0,0v20H420z" />
          <path d="M140,20c21.5-0.4,38.8-2.5,51.1-4.5c13.4-2.2,26.5-5.2,27.3-5.4C234,6.5,238,4.7,248.5,2.7c7.1-1.3,17.9-2.8,31.5-2.7c0,0,0,0,0,0v20H140z" />
          <path d="M140,20c-21.5-0.4-38.8-2.5-51.1-4.5c-13.4-2.2-26.5-5.2-27.3-5.4C46,6.5,42,4.7,31.5,2.7C24.3,1.4,13.6-0.1,0,0c0,0,0,0,0,0l0,20H140z" />
        </symbol>
      </svg>

      <div
        className="relative rounded-full overflow-hidden bg-background border-4 border-primary/30 shadow-lg"
        style={{ width: size, height: size }}
      >
        {/* Water body */}
        <div
          className="absolute inset-0 z-[2] transition-transform duration-300 ease-out"
          style={{
            transform: `translate(0, ${waterY}%)`,
            background: "hsl(var(--primary))",
          }}
        >
          {/* Back wave */}
          <svg
            viewBox="0 0 560 20"
            preserveAspectRatio="none"
            className="absolute bottom-full right-0 w-[200%]"
            style={{
              height: size * 0.28,
              fill: "hsl(var(--primary) / 0.45)",
              animation: "cwl-wave-back 1.4s infinite linear",
            }}
          >
            <use href="#cwl-wave" />
          </svg>
          {/* Front wave */}
          <svg
            viewBox="0 0 560 20"
            preserveAspectRatio="none"
            className="absolute bottom-full left-0 w-[200%]"
            style={{
              height: size * 0.28,
              marginBottom: -1,
              fill: "hsl(var(--primary))",
              animation: "cwl-wave-front 0.7s infinite linear",
            }}
          >
            <use href="#cwl-wave" />
          </svg>
        </div>

        {/* Percentage text */}
        <div
          className="absolute inset-0 z-[3] flex items-center justify-center font-bold text-white mix-blend-difference select-none pointer-events-none"
          style={{ fontSize: size * 0.22 }}
        >
          {display}
          <span style={{ fontSize: size * 0.14, marginLeft: 2 }}>%</span>
        </div>
      </div>

      {label && <div className="text-sm text-muted-foreground">{label}…</div>}

      <style>{`
        @keyframes cwl-wave-front { 100% { transform: translate(-50%, 0); } }
        @keyframes cwl-wave-back  { 100% { transform: translate(50%, 0); } }
      `}</style>
    </div>
  );
}
