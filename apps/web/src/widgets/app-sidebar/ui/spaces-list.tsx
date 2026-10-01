import Link from "next/link";

import { type Team, TeamAvatar } from "@/entities/team";
import { routes } from "@/shared/config";
import { cn } from "@/shared/lib/utils";
import { Eyebrow } from "@/shared/ui/eyebrow";

type SpacesListProps = {
  activeTeamId: string;
  teams: readonly Team[];
};

export function SpacesList({ activeTeamId, teams }: SpacesListProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Eyebrow className="px-2.5">Espacios</Eyebrow>
      <div className="flex flex-col gap-0.5">
        {teams.map((team) => {
          const isActive = team.id === activeTeamId;

          return (
            <Link
              key={team.id}
              href={routes.space(team.id)}
              data-team={team.id}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "flex h-9 items-center gap-2.5 rounded-[10px] px-2 text-sm font-medium transition-colors",
                isActive ? "bg-team-soft font-semibold" : "hover:bg-surface/60",
              )}
            >
              <TeamAvatar team={team} size={24} decorative />
              <span>{team.name}</span>
              <span aria-hidden="true" className="ml-auto h-1 w-4 rounded-[2px] bg-team" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
