import * as React from "react";

import { cn } from "@/shared/lib/utils";

import { StripeMark } from "./brand-stripes";

type LogoProps = React.ComponentProps<"span"> & {
  /** `md`: page headers (login). `sm`: discreet footer signature (command palette). */
  size?: "md" | "sm";
};

function Logo({ size = "md", className, ...props }: LogoProps) {
  const isSmall = size === "sm";

  return (
    <span
      data-slot="logo"
      className={cn("inline-flex items-center", isSmall ? "gap-2" : "gap-2.5", className)}
      {...props}
    >
      <StripeMark className={isSmall ? "w-3.5" : "w-5"} />
      <span
        className={
          isSmall
            ? "font-mono text-[10px] tracking-label text-ink-muted uppercase"
            : "text-[22px] font-bold tracking-display"
        }
      >
        flow
      </span>
    </span>
  );
}

export { Logo };
