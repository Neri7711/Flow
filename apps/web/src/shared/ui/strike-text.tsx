import * as React from "react";

import { cn } from "@/shared/lib/utils";

type StrikeTextProps = React.ComponentProps<"span"> & {
  struck: boolean;
};

/**
 * Inline text whose strikethrough sweeps left → right (and back) instead of appearing.
 * Drawn as a background line so it can animate; `box-decoration-clone` strikes every
 * wrapped line at once.
 */
function StrikeText({ struck, className, ...props }: StrikeTextProps) {
  return (
    <span
      data-struck={struck}
      className={cn(
        "box-decoration-clone bg-[linear-gradient(currentColor,currentColor)] bg-size-[0%_1.5px] bg-position-[0_56%] bg-no-repeat transition-[background-size,color] duration-(--motion-base) ease-out",
        "data-[struck=true]:bg-size-[100%_1.5px] data-[struck=true]:text-ink-muted",
        className,
      )}
      {...props}
    />
  );
}

export { StrikeText };
