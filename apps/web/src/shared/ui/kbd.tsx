import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";

/** Keyboard shortcut hint (`⌘K`, `C`, `ESC`, `↵`). */
const kbdVariants = cva("inline-flex items-center justify-center border font-mono leading-none", {
  variants: {
    variant: {
      default: "border-line text-ink-muted",
      /** Footer hints of floating layers (command palette). */
      filled: "border-line bg-cream text-ink-muted",
      /** Inside a primary (ink) button. */
      inverse: "border-primary-foreground/25 text-primary-foreground/80",
    },
    size: {
      sm: "rounded-[5px] px-1.5 py-[3px] text-[10px]",
      md: "rounded-md px-1.5 py-[3px] text-[11px]",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
});

type KbdProps = React.ComponentProps<"kbd"> & VariantProps<typeof kbdVariants>;

function Kbd({ className, variant, size, ...props }: KbdProps) {
  return <kbd data-slot="kbd" className={cn(kbdVariants({ variant, size, className }))} {...props} />;
}

export { Kbd };
