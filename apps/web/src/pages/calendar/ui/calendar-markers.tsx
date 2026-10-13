import type { ComponentProps } from "react";
import { RotateCw } from "lucide-react";

import type { TeamId } from "@/entities/team";

/** Pennant used for project milestones (grid, upcoming list and legend). */
export function MilestoneFlag(props: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M5 21V4" />
      <path d="M5 4h11l-2 4 2 4H5" />
    </svg>
  );
}

export function MilestoneMarker({ teamId, name }: { teamId: TeamId; name: string }) {
  return (
    <span data-team={teamId} className="flex items-center gap-[5px] px-1.5 py-[3px] text-xs font-semibold text-team-strong">
      <MilestoneFlag className="size-3 shrink-0" />
      <span className="truncate">Hito · {name}</span>
    </span>
  );
}

/** Start or end of the active cycle: neutral, dashed, so it never reads as a team event. */
export function CycleMarker({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-[5px] rounded-md border border-dashed border-ink px-1.5 py-[3px] text-xs font-medium">
      <RotateCw aria-hidden="true" className="size-3 shrink-0" strokeWidth={1.8} />
      <span className="truncate">{label}</span>
    </span>
  );
}
