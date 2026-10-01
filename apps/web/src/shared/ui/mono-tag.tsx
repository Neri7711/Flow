import * as React from "react";

import { cn } from "@/shared/lib/utils";

/**
 * Brand label with a thin border: `INICIAR SESIÓN`, `CICLO 4 · ACTIVO`, `ESPACIO · PLAY`.
 * The border follows the text color, so tint it with a text utility
 * (`text-ink` default, `text-cream` on dark panels, `text-team-strong` on team heroes).
 */
function MonoTag({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="mono-tag"
      className={cn(
        "inline-flex items-center self-start rounded-lg border border-current px-2.5 py-[5px] font-mono text-[11px] tracking-[0.1em] uppercase",
        className,
      )}
      {...props}
    />
  );
}

export { MonoTag };
