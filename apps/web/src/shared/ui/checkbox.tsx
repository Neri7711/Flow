import * as React from "react";

import { cn } from "@/shared/lib/utils";

type CheckboxProps = Omit<React.ComponentProps<"input">, "type">;

/**
 * Native checkbox (keyboard + forms work as usual) styled as an ink square whose
 * checkmark draws itself when checked and retracts when unchecked.
 */
function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <span className={cn("relative inline-grid size-[18px] shrink-0 place-items-center", className)}>
      <input
        type="checkbox"
        data-slot="checkbox"
        className="peer col-start-1 row-start-1 size-full cursor-pointer appearance-none rounded-[5px] border-[1.5px] border-line-strong bg-surface transition-[background-color,border-color,scale] duration-(--motion-press) outline-none checked:border-ink checked:bg-ink focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-90 disabled:cursor-not-allowed disabled:opacity-50"
        {...props}
      />
      {/* `--dash` 1 → 0 draws the stroke (pathLength normalizes it to 1). */}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="pointer-events-none col-start-1 row-start-1 size-3 text-cream [--dash:1] peer-checked:[--dash:0]"
      >
        <path
          d="M5 12.5l4.5 4.5L19 7.5"
          pathLength={1}
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={1}
          className="transition-[stroke-dashoffset] duration-(--motion-fast) ease-out [stroke-dashoffset:var(--dash)]"
        />
      </svg>
    </span>
  );
}

export { Checkbox };
