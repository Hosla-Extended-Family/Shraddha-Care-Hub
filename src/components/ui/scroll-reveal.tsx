import * as React from "react";
import { cn } from "@/lib/utils";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";

interface ScrollRevealProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  duration?: number;
}

const ScrollReveal = React.forwardRef<HTMLDivElement, ScrollRevealProps>(
  (
    {
      children,
      delay = 0,
      direction = "up",
      duration = 600,
      className,
      ...props
    },
    forwardedRef
  ) => {
    const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();

    // Combine refs
    React.useImperativeHandle(forwardedRef, () => ref.current!);

    const directionStyles = {
      up: "translate-y-8",
      down: "-translate-y-8",
      left: "translate-x-8",
      right: "-translate-x-8",
      none: "",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "transition-all ease-out",
          isVisible
            ? "opacity-100 translate-x-0 translate-y-0"
            : `opacity-0 ${directionStyles[direction]}`,
          className
        )}
        style={{
          transitionDuration: `${duration}ms`,
          transitionDelay: `${delay}ms`,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ScrollReveal.displayName = "ScrollReveal";

export { ScrollReveal };
