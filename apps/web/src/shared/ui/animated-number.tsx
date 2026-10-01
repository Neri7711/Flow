"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { motionTokens } from "@/shared/config";
import { cn } from "@/shared/lib/utils";

type AnimatedNumberProps = {
  value: number;
  className?: string;
};

/**
 * Counter that rolls instead of jumping: increases slide up, decreases slide down,
 * so the direction of the change is readable at a glance.
 */
function AnimatedNumber({ value, className }: AnimatedNumberProps) {
  // Direction of the last change (render-time state adjustment when `value` changes).
  const [tracked, setTracked] = useState({ value, direction: 1 });
  if (tracked.value !== value) setTracked({ value, direction: value > tracked.value ? 1 : -1 });
  const { direction } = tracked;

  return (
    <span className={cn("relative inline-flex overflow-hidden tabular-nums", className)}>
      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        <motion.span
          key={value}
          custom={direction}
          variants={{
            enter: (dir: number) => ({ y: `${dir * 70}%`, opacity: 0 }),
            center: { y: "0%", opacity: 1 },
            exit: (dir: number) => ({ y: `${dir * -70}%`, opacity: 0 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: motionTokens.duration.fast, ease: motionTokens.ease.out }}
          className="inline-block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export { AnimatedNumber };
