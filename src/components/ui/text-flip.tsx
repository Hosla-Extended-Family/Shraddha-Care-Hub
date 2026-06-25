"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TextFlipProps {
  words: (string | React.ReactNode)[];
  duration?: number;
  className?: string;
}

export const TextFlip = ({
  words,
  duration = 2500,
  className,
}: TextFlipProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, duration);

    return () => clearInterval(interval);
  }, [words.length, duration]);

  return (
    <span className={cn("relative inline-flex overflow-hidden", className)}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={currentIndex}
          initial={{ y: -20, opacity: 0, filter: "blur(4px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: 20, opacity: 0, filter: "blur(4px)" }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="inline-block whitespace-nowrap"
        >
          {words[currentIndex]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};
