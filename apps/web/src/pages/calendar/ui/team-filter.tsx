import { type Team, TeamAvatar, type TeamId } from "@/entities/team";
import { cn } from "@/shared/lib/utils";
import { Eyebrow } from "@/shared/ui/eyebrow";

type TeamFilterProps = {
  teams: readonly Team[];
  hidden: ReadonlySet<TeamId>;
  onToggle: (teamId: TeamId) => void;
};

/** "Mostrar": one toggle chip per team, all on by default. */
export function TeamFilter({ teams, hidden, onToggle }: TeamFilterProps) {
  return (
    <div role="group" aria-labelledby="calendar-team-filter" className="flex flex-wrap items-center gap-2">
      <Eyebrow id="calendar-team-filter" className="mr-1 text-[10px]">
        Mostrar
      </Eyebrow>
      {teams.map((team) => {
        const shown = !hidden.has(team.id);
        return (
          <button
            key={team.id}
            type="button"
            data-team={team.id}
            aria-pressed={shown}
            aria-label={`${team.abbreviation} · ${team.name}`}
            title={team.name}
            onClick={() => onToggle(team.id)}
            className={cn(
              "flex h-[34px] cursor-pointer items-center gap-1.5 rounded-full border pr-2.5 pl-1 text-[13px] font-medium text-ink outline-none",
              "transition-[opacity,background-color,border-color] duration-(--motion-press) ease-out focus-visible:ring-3 focus-visible:ring-ring/50",
              shown ? "border-team bg-team-soft" : "border-dashed border-line-strong bg-transparent opacity-55 hover:opacity-80",
            )}
          >
            <TeamAvatar team={team} size={26} decorative />
            {team.abbreviation}
          </button>
        );
      })}
    </div>
  );
}
