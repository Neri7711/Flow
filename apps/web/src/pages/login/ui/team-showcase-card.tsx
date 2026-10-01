import Image from "next/image";

import { type Team, TeamChip } from "@/entities/team";
import { cn } from "@/shared/lib/utils";

type TeamShowcaseCardProps = {
  team: Team;
  className?: string;
};

/** Tilted sticker card with a team's mascot — a brand "moment", only on the login panel. */
export function TeamShowcaseCard({ team, className }: TeamShowcaseCardProps) {
  return (
    <figure
      data-team={team.id}
      className={cn("flex flex-col gap-2.5 rounded-[22px] bg-surface-sunken px-2.5 pt-2.5 pb-3.5 shadow-toast", className)}
    >
      <div className="relative h-[150px] overflow-hidden rounded-[14px] bg-team">
        <Image src={`/mascots/${team.id}.png`} alt={team.mascotAlt} fill sizes="250px" className="object-cover" />
      </div>
      <figcaption className="flex items-center gap-2 px-1.5">
        <span className="text-[15px] font-semibold text-ink">{team.name}</span>
        <TeamChip team={team} className="ml-auto" />
      </figcaption>
    </figure>
  );
}
