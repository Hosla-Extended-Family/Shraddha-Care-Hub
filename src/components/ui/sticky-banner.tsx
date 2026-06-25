"use client";
import React, { SVGProps, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { cn } from "@/lib/utils";

export const StickyBanner = ({
  className,
  children,
  hideOnScroll = false,
}: {
  className?: string;
  children: React.ReactNode;
  hideOnScroll?: boolean;
}) => {
  const [open, setOpen] = useState(true);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (hideOnScroll && latest > 40) {
      setOpen(false);
    } else {
      setOpen(true);
    }
  });

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className={cn(
            "sticky inset-x-0 top-0 z-50 w-full px-4",
            className,
          )}
          initial={{
            y: -100,
            opacity: 0,
          }}
          animate={{
            y: 0,
            opacity: 1,
          }}
          exit={{
            y: -100,
            opacity: 0,
          }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
          }}
        >
          <div className="relative flex min-h-12 w-full items-center justify-center">
            {children}

            <motion.button
              initial={{
                scale: 0,
              }}
              animate={{
                scale: 1,
              }}
              whileHover={{
                scale: 1.1,
                rotate: 90,
              }}
              whileTap={{
                scale: 0.9,
              }}
              className="absolute right-0 flex items-center justify-center p-1 rounded-full cursor-pointer transition-colors hover:bg-black/10 dark:hover:bg-white/10"
              onClick={() => setOpen(false)}
              aria-label="Close banner"
            >
              <CloseIcon className="h-5 w-5 text-current" />
            </motion.button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

const CloseIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </svg>
  );
};
