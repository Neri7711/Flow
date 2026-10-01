import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/shared/lib/utils";

/**
 * Flow buttons are pills that sink slightly when pressed (instant feedback). Sizes match the mockups:
 * sm 36px (top bar, board toolbar) · md 42px (hero actions) · lg 50px (login).
 */
const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-[color,background-color,border-color,scale] outline-none select-none active:not-disabled:scale-[0.97] focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/88",
        secondary: "border border-ink bg-transparent text-ink hover:bg-ink/5",
        outline: "border border-line-strong bg-surface text-ink hover:bg-surface-sunken",
        ghost: "text-ink hover:bg-subtle",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-[42px] px-[18px] text-sm",
        lg: "h-[50px] px-6 text-[15px]",
        icon: "size-9 rounded-[10px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "sm",
    },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
