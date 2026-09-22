import React, { useEffect, useState, useMemo } from "react";
import { BookOpen, Users, Compass, Heart, TrendingUp, Sparkles } from "lucide-react";
import { useI18n } from "@/i18n";

interface BlogImpactMetricsProps {
  totalBlogs: number;
  totalAuthors: number;
  totalCategories: number;
  totalLikes: number;
  totalWords: number;
  onGenreClick?: () => void;
}

function AnimatedCounter({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value <= 0) {
      setDisplay(0);
      return;
    }
    let startTime: number | null = null;
    let frameId: number;

    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(ease * value));

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        setDisplay(value);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return <span>{display.toLocaleString()}</span>;
}

export function BlogImpactMetrics({
  totalBlogs,
  totalAuthors,
  totalCategories,
  totalLikes,
  totalWords,
  onGenreClick,
}: BlogImpactMetricsProps) {
  const { t } = useI18n();

  const formattedWords = useMemo(() => {
    if (totalWords >= 1000) {
      return `${(totalWords / 1000).toFixed(1)}k+`;
    }
    return `${totalWords}`;
  }, [totalWords]);

  const cards = [
    {
      id: "stories",
      label: t("Published Stories"),
      sub: t("By community seniors"),
      value: <AnimatedCounter value={totalBlogs} />,
      icon: BookOpen,
      iconGradient: "from-emerald-500 to-teal-600",
      glowColor: "rgba(16, 185, 129, 0.15)",
      borderColor: "border-emerald-500/20 hover:border-emerald-500/50",
      accentBg: "bg-emerald-500/5",
      badge: totalBlogs > 0 ? "Active" : undefined,
    },
    {
      id: "authors",
      label: t("Contributing Writers"),
      sub: t("Senior voices & guests"),
      value: <AnimatedCounter value={totalAuthors} />,
      icon: Users,
      iconGradient: "from-indigo-500 to-purple-600",
      glowColor: "rgba(99, 102, 241, 0.15)",
      borderColor: "border-indigo-500/20 hover:border-indigo-500/50",
      accentBg: "bg-indigo-500/5",
    },
    {
      id: "genres",
      label: t("Genres Explored"),
      sub: t("Unique themes"),
      value: <AnimatedCounter value={totalCategories} />,
      icon: Compass,
      iconGradient: "from-amber-500 to-orange-600",
      glowColor: "rgba(245, 158, 11, 0.15)",
      borderColor: "border-amber-500/20 hover:border-amber-500/50",
      accentBg: "bg-amber-500/5",
      onClick: onGenreClick,
      clickable: Boolean(onGenreClick),
    },
    {
      id: "likes",
      label: t("Reader Loves"),
      sub: t("Community appreciations"),
      value: (
        <span className="inline-flex items-center gap-1.5">
          <AnimatedCounter value={totalLikes} />
          {totalLikes > 0 && (
            <span className="text-xs font-normal text-rose-500 animate-pulse">❤️</span>
          )}
        </span>
      ),
      icon: Heart,
      iconGradient: "from-rose-500 to-pink-600",
      glowColor: "rgba(244, 63, 94, 0.15)",
      borderColor: "border-rose-500/20 hover:border-rose-500/50",
      accentBg: "bg-rose-500/5",
    },
    {
      id: "words",
      label: t("Words of Wisdom"),
      sub: t("Shared reflections"),
      value: <span>{formattedWords}</span>,
      icon: TrendingUp,
      iconGradient: "from-cyan-500 to-blue-600",
      glowColor: "rgba(6, 182, 212, 0.15)",
      borderColor: "border-cyan-500/20 hover:border-cyan-500/50",
      accentBg: "bg-cyan-500/5",
      badge: "Growing",
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card/90 to-accent/20 p-4 sm:p-5 shadow-xl shadow-primary/[0.03] backdrop-blur-md transition-all duration-300">
      {/* Decorative ambient background glowing orbs */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-teal-500/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-36 w-72 rounded-full bg-primary/5 blur-3xl"
        aria-hidden="true"
      />

      {/* Top Banner Ribbon */}
      <div className="relative z-10 mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
            {t("Live Community Impact")}
          </span>
          <span className="hidden sm:inline-block text-xs text-muted-foreground">•</span>
          <span className="hidden sm:inline-block text-xs text-muted-foreground">
            {t("Stories that inspire, connect & heal")}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-background/80 dark:bg-background/40 px-2.5 py-0.5 rounded-full border border-border/50 shadow-2xs">
          <Sparkles className="h-3 w-3 text-amber-500" />
          <span>Shraddha Living Archives</span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.id}
              onClick={c.onClick}
              role={c.clickable ? "button" : undefined}
              tabIndex={c.clickable ? 0 : undefined}
              onKeyDown={(e) => {
                if (c.clickable && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  c.onClick?.();
                }
              }}
              className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border p-3.5 transition-all duration-300 ${c.accentBg} ${c.borderColor} hover:-translate-y-1 hover:shadow-md hover:shadow-primary/5 ${
                c.clickable ? "cursor-pointer active:scale-98" : ""
              } ${c.id === "words" ? "col-span-2 sm:col-span-1" : ""}`}
            >
              {/* Subtle card corner shine */}
              <div
                className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full opacity-20 blur-lg transition-opacity duration-300 group-hover:opacity-40"
                style={{ backgroundColor: c.glowColor }}
              />

              <div className="flex items-start justify-between gap-2">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr ${c.iconGradient} text-white shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </div>
                {c.badge && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                    {c.badge}
                  </span>
                )}
              </div>

              <div className="mt-3">
                <div className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {c.value}
                </div>
                <div className="mt-0.5 text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-foreground/80">
                  {c.label}
                </div>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                  {c.sub}
                </p>
              </div>

              {/* Bottom dynamic shimmer line */}
              <div
                className={`absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r ${c.iconGradient} transition-all duration-500 group-hover:w-full`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
