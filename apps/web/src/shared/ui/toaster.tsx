"use client";

import { useToastStore } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";

/** Renders queued toasts. Mount once per layout; call `toast()` from anywhere. */
export function Toaster({ className }: { className?: string }) {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div
      role="region"
      aria-label="Notificaciones"
      aria-live="polite"
      className={cn("pointer-events-none fixed bottom-7 z-50 flex flex-col gap-2", className)}
    >
      {toasts.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => dismiss(item.id)}
          title="Descartar"
          className="pointer-events-auto flex max-w-[420px] cursor-pointer animate-in items-center gap-3 rounded-[18px] bg-night py-2.5 pr-4 pl-2.5 text-left text-[13px] leading-[1.45] text-cream shadow-toast fade-in-0 slide-in-from-bottom-2"
        >
          {item.icon}
          <span>{item.message}</span>
        </button>
      ))}
    </div>
  );
}
