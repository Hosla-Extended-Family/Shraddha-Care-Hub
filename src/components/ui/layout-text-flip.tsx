"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export const LayoutTextFlip = ({
  text = "Build Amazing",
  words = ["Landing Pages", "Component Blocks", "Page Sections", "3D Shaders"],
  duration = 3000,
  containerClassName,
  textClassName,
  flipClassName,
}: {
  text?: string;
  words: string[];
  duration?: number;
  containerClassName?: string;
  textClassName?: string;
  flipClassName?: string;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, duration);

    return () => clearInterval(interval);
  }, [words.length, duration]);

  return (
    <span className={cn("inline-flex items-center gap-2", containerClassName)}>
      {text ? (
        <motion.span
          layoutId="subtext"
          className={cn("font-bold tracking-tight drop-shadow-lg", textClassName)}
        >
          {text}
        </motion.span>
      ) : null}

      <motion.span
        layout
        className={cn(
          "relative w-fit overflow-hidden rounded-md border border-transparent bg-white px-4 py-2 font-sans font-bold tracking-tight text-black shadow-sm ring shadow-black/10 ring-black/10 drop-shadow-lg dark:bg-neutral-900 dark:text-white dark:shadow-sm dark:ring-1 dark:shadow-white/10 dark:ring-white/10",
          flipClassName
        )}
      >
        <AnimatePresence mode="popLayout">
          <motion.span
            key={currentIndex}
            initial={{ y: -40, filter: "blur(10px)" }}
            animate={{
              y: 0,
              filter: "blur(0px)",
            }}
            exit={{ y: 50, filter: "blur(10px)", opacity: 0 }}
            transition={{
              duration: 0.5,
            }}
            className={cn("inline-block whitespace-nowrap")}
          >
            {words[currentIndex]}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </span>
  );
};
