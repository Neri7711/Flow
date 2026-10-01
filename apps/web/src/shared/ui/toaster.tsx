"use client";

import { AnimatePresence, motion } from "motion/react";

import { motionTokens } from "@/shared/config";
import { useToastStore } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";

/**
 * Renders queued toasts. Mount once per layout; call `toast()` from anywhere.
 * Toasts rise from the bottom and leave the same way they came, while the
 * remaining ones glide into place (layout animation) instead of jumping.
 */
export function Toaster({ className }: { className?: string }) {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div
      role="region"
      aria-label="Notificaciones"
      aria-live="polite"
      className={cn("pointer-events-none fixed bottom-7 z-50 flex flex-col items-start gap-2", className)}
    >
      <AnimatePresence initial={false}>
        {toasts.map((item) => (
          <motion.button
            key={item.id}
            layout
            type="button"
            onClick={() => dismiss(item.id)}
            title="Descartar"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: motionTokens.duration.base, ease: motionTokens.ease.out }}
            className="pointer-events-auto flex max-w-[420px] cursor-pointer items-center gap-3 rounded-[18px] bg-night py-2.5 pr-4 pl-2.5 text-left text-[13px] leading-[1.45] text-cream shadow-toast"
          >
            {item.icon}
            <span>{item.message}</span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
