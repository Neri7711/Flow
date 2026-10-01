"use client";

import Link from "next/link";
import { ChevronsUpDown } from "lucide-react";

import { type Team, TeamAvatar } from "@/entities/team";
import { routes } from "@/shared/config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

type SpaceSwitcherProps = {
  activeTeam: Team;
  teams: readonly Team[];
};

export function SpaceSwitcher({ activeTeam, teams }: SpaceSwitcherProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl border border-line bg-surface p-2 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <TeamAvatar team={activeTeam} size={32} decorative />
        <span className="flex flex-col gap-px">
          <span className="text-sm font-semibold">{activeTeam.name}</span>
          <span className="font-mono text-[10px] tracking-label text-ink-muted">
            ESPACIO · {activeTeam.abbreviation}
          </span>
        </span>
        <ChevronsUpDown className="ml-auto size-4 text-ink-muted" strokeWidth={1.8} />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="rounded-[14px] border border-line p-1.5 shadow-float ring-0">
        {teams.map((team) => (
          <DropdownMenuItem key={team.id} asChild className="gap-2.5 rounded-[10px] px-2 py-1.5 text-sm">
            <Link href={routes.space(team.id)}>
              <TeamAvatar team={team} size={24} decorative />
              {team.name}
              <span className="ml-auto font-mono text-[10px] tracking-label text-ink-muted">{team.abbreviation}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
