import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";

/**
 * Soft filled mono pill for labels and team abbreviations (`DISEÑO`, `ARTE`, `CS`).
 * Colors are passed by the caller (e.g. `bg-team-soft text-team-strong`),
 * defaulting to a neutral tone.
 */
const chipVariants = cva(
  "inline-flex shrink-0 items-center rounded-full bg-subtle font-mono text-ink-muted uppercase",
  {
    variants: {
      size: {
        sm: "px-[7px] py-[3px] text-[10px] tracking-[0.06em]",
        md: "px-2 py-[3px] text-[11px] font-medium tracking-[0.06em]",
      },
    },
    defaultVariants: {
      size: "sm",
    },
  },
);

type ChipProps = React.ComponentProps<"span"> & VariantProps<typeof chipVariants>;

function Chip({ className, size, ...props }: ChipProps) {
  return <span data-slot="chip" className={cn(chipVariants({ size, className }))} {...props} />;
}

export { Chip };
