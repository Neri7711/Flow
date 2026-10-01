import * as React from "react";

import { cn } from "@/shared/lib/utils";

/** Dashboard-style card (space home). Workspace surfaces stay flat — don't use this inside the board. */
function Card({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="card"
      className={cn("rounded-[20px] border border-line bg-surface p-5 shadow-raised", className)}
      {...props}
    />
  );
}

/** Title row; anything after the title (counters, "Ver todos" links) is pushed to the right. */
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("mb-1.5 flex items-center gap-3 [&>*:nth-child(2)]:ml-auto", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 data-slot="card-title" className={cn("text-[17px] font-semibold", className)} {...props} />;
}

export { Card, CardHeader, CardTitle };
