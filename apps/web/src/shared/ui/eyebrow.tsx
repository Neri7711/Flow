import * as React from "react";

import { cn } from "@/shared/lib/utils";

/**
 * Small uppercase mono text used for section labels, property names, counters
 * and metadata ("ESPACIOS", "ESTADO", "3 DE 4", "EDITADO HACE 2 H").
 */
function Eyebrow({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="eyebrow"
      className={cn("font-mono text-[11px] tracking-label text-ink-muted uppercase", className)}
      {...props}
    />
  );
}

export { Eyebrow };
