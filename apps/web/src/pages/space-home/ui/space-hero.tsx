import Image from "next/image";
import Link from "next/link";

import type { Team } from "@/entities/team";
import type { User } from "@/entities/user";
import { routes } from "@/shared/config";
import { greetingFor } from "@/shared/lib/format-date";
import { Button } from "@/shared/ui/button";
import { MonoTag } from "@/shared/ui/mono-tag";

import { NewPageButton } from "./new-page-button";
import { WeeklyNote } from "./weekly-note";

type SpaceHeroProps = {
  team: Team;
  user: User;
};

export function SpaceHero({ team, user }: SpaceHeroProps) {
  return (
    <section className="relative grid items-center gap-6 overflow-hidden rounded-[28px] bg-team-soft px-10 py-9 md:grid-cols-[minmax(0,1fr)_280px]">
      <div className="flex flex-col gap-3.5">
        <MonoTag className="text-team-strong">Espacio · {team.name}</MonoTag>
        <h1 className="text-[44px] leading-[1.05] font-bold tracking-[-0.035em]">
          <span className="text-team-muted">{greetingFor()},</span> {user.name}
        </h1>
        <WeeklyNote
          team={team}
          editable={user.role === "leader" && user.teamId === team.id}
          className="font-serif text-2xl text-team-ink italic"
        />
        <div className="mt-2 flex gap-2.5">
          <NewPageButton teamId={team.id} />
          <Button size="md" variant="secondary" asChild>
            <Link href={routes.tasks(team.id)}>Ver tareas</Link>
          </Button>
        </div>
      </div>

      <div className="hidden justify-center md:flex">
        <div className="w-[230px] rotate-3 rounded-[26px] bg-surface-sunken p-2 shadow-[0_20px_40px_color-mix(in_oklab,var(--team-strong)_18%,transparent)]">
          <div className="relative h-[200px] overflow-hidden rounded-[20px]">
            <Image
              src={`/mascots/${team.id}.png`}
              alt={team.mascotAlt}
              fill
              priority
              sizes="214px"
              className="object-cover object-[50%_45%]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
