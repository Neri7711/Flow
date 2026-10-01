import { cn } from "@/shared/lib/utils";
import { Chip } from "@/shared/ui/chip";

import type { TaskLabel } from "../model/types";

export function TaskLabelChip({ label, className }: { label: TaskLabel; className?: string }) {
  return (
    <Chip
      data-team={label.tone ?? undefined}
      className={cn(label.tone && "bg-team-soft text-team-strong", className)}
    >
      {label.name}
    </Chip>
  );
}
