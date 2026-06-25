import * as React from "react";
import { cn } from "@/lib/utils";

interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  pauseOnHover?: boolean;
  speed?: "slow" | "normal" | "fast";
  direction?: "left" | "right";
}

const Marquee = React.forwardRef<HTMLDivElement, MarqueeProps>(
  (
    {
      children,
      pauseOnHover = true,
      speed = "normal",
      direction = "left",
      className,
      ...props
    },
    ref
  ) => {
    const speedMap = {
      slow: "40s",
      normal: "25s",
      fast: "15s",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "group flex overflow-hidden [--gap:2rem]",
          className
        )}
        style={{ contain: "layout style" }}
        {...props}
      >
        <div
          className={cn(
            "flex min-w-full shrink-0 items-center justify-around gap-[--gap] animate-marquee",
            pauseOnHover && "group-hover:[animation-play-state:paused]",
            direction === "right" && "[animation-direction:reverse]"
          )}
          style={{
            animationDuration: speedMap[speed],
            willChange: "transform",
          }}
        >
          {children}
        </div>
        <div
          aria-hidden="true"
          className={cn(
            "flex min-w-full shrink-0 items-center justify-around gap-[--gap] animate-marquee",
            pauseOnHover && "group-hover:[animation-play-state:paused]",
            direction === "right" && "[animation-direction:reverse]"
          )}
          style={{
            animationDuration: speedMap[speed],
            willChange: "transform",
          }}
        >
          {children}
        </div>
      </div>
    );
  }
);

Marquee.displayName = "Marquee";

export { Marquee };
