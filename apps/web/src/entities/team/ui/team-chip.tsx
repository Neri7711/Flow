import { cn } from "@/shared/lib/utils";
import { Chip } from "@/shared/ui/chip";

import type { Team } from "../model/types";

/** Team abbreviation pill in the team's colors (`CS`, `PL`…). */
export function TeamChip({ team, className }: { team: Team; className?: string }) {
  return (
    <Chip data-team={team.id} size="md" className={cn("bg-team-soft text-team-strong", className)}>
      {team.abbreviation}
    </Chip>
  );
}
