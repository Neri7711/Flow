import * as React from "react";

import { cn } from "@/shared/lib/utils";

/**
 * The four brand stripes, one per founding team (CS, Play, Mechanics, IISE),
 * ordered top/inner → bottom/outer. Brand element for the edges of the experience
 * (login, onboarding, document covers, logo) — never inside the workspace.
 */
const STRIPES = [
  { bg: "bg-cs", border: "border-cs" },
  { bg: "bg-pl", border: "border-pl" },
  { bg: "bg-me", border: "border-me" },
  { bg: "bg-ii", border: "border-ii" },
] as const;

type CurvedStripesProps = React.ComponentProps<"div"> & {
  /** Width of each stripe in px. */
  thickness?: number;
  /** Corner radius of the innermost stripe in px; each outer stripe adds `thickness`. */
  innerRadius?: number;
};

/**
 * Convex-style stripes bending around the bottom-right corner of their box.
 * Position it absolutely inside a dark panel; it fills its own box.
 */
function CurvedStripes({ thickness = 16, innerRadius = 102, className, ...props }: CurvedStripesProps) {
  const nested = STRIPES.reduce<React.ReactNode>(
    (inner, stripe, index) => (
      <div
        className={cn("size-full border-r border-b", stripe.border)}
        style={{
          borderRightWidth: thickness,
          borderBottomWidth: thickness,
          borderBottomRightRadius: innerRadius + index * thickness,
        }}
      >
        {inner}
      </div>
    ),
    null,
  );

  return (
    <div aria-hidden="true" data-slot="curved-stripes" className={className} {...props}>
      {nested}
    </div>
  );
}

type StripeBandProps = React.ComponentProps<"div"> & {
  /** Height of each stripe in px. */
  thickness?: number;
};

/** Thin straight signature, e.g. at the bottom edge of a document cover. */
function StripeBand({ thickness = 6, className, ...props }: StripeBandProps) {
  return (
    <div aria-hidden="true" data-slot="stripe-band" className={cn("flex flex-col", className)} {...props}>
      {STRIPES.map((stripe) => (
        <span key={stripe.bg} className={stripe.bg} style={{ height: thickness }} />
      ))}
    </div>
  );
}

/** Logo mark: four short stacked bars. */
function StripeMark({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span aria-hidden="true" data-slot="stripe-mark" className={cn("flex w-5 flex-col gap-0.5", className)} {...props}>
      {STRIPES.map((stripe) => (
        <span key={stripe.bg} className={cn("block h-[3px] rounded-[2px]", stripe.bg)} />
      ))}
    </span>
  );
}

export { CurvedStripes, StripeBand, StripeMark };
