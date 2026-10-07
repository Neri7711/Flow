import * as React from "react";

import { cn } from "@/shared/lib/utils";

/** Native `<select>` styled like `Input` (keyboard and mobile pickers for free). */
function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        "h-12 w-full min-w-0 cursor-pointer rounded-xl border border-input bg-surface px-4 text-[15px] text-ink transition-colors outline-none focus-visible:border-ink-muted focus-visible:ring-3 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { NativeSelect };
