import { useEffect, useState } from "react";

const KEY = "blog_font_size";
const OPTIONS = [18, 22, 26] as const;
export type FontSize = (typeof OPTIONS)[number];

export function useFontSize() {
  const [size, setSize] = useState<FontSize>(() => {
    if (typeof window === "undefined") return 18;
    const stored = Number(localStorage.getItem(KEY));
    return (OPTIONS as readonly number[]).includes(stored) ? (stored as FontSize) : 18;
  });

  useEffect(() => {
    localStorage.setItem(KEY, String(size));
  }, [size]);

  return { size, setSize, options: OPTIONS };
}

export function FontSizeToggle({
  size,
  onChange,
  className,
}: {
  size: FontSize;
  onChange: (s: FontSize) => void;
  className?: string;
}) {
  return (
    <div className={"inline-flex items-center gap-1 border border-border rounded-full p-1 " + (className || "")}>
      {[
        { s: 18 as FontSize, label: "A" },
        { s: 22 as FontSize, label: "A+" },
        { s: 26 as FontSize, label: "A++" },
      ].map((o) => (
        <button
          key={o.s}
          type="button"
          onClick={() => onChange(o.s)}
          className={
            "min-w-[44px] h-9 px-3 rounded-full text-sm font-medium transition-colors " +
            (size === o.s
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent")
          }
          aria-label={`Set font size ${o.label}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
