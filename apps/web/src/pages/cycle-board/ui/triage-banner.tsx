import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { type Team, TeamAvatar } from "@/entities/team";
import type { TriageRequest } from "@/entities/triage";
import { routes } from "@/shared/config";

type TriageBannerProps = {
  teamId: string;
  requests: readonly TriageRequest[];
  teams: readonly Team[];
};

/** Nudge for leaders: requests from other teams waiting in the inbox. */
export function TriageBanner({ teamId, requests, teams }: TriageBannerProps) {
  if (requests.length === 0) return null;

  const sourceIds = new Set(requests.map((request) => request.fromTeamId));
  const singleSource = sourceIds.size === 1 ? teams.find((team) => sourceIds.has(team.id)) : undefined;
  const count = `${requests.length} ${requests.length === 1 ? "solicitud nueva" : "solicitudes nuevas"}`;

  return (
    <div
      data-team={singleSource?.id ?? teamId}
      className="flex items-center gap-3 rounded-[14px] bg-team-soft py-2.5 pr-3 pl-2.5"
    >
      {singleSource && <TeamAvatar team={singleSource} size={30} decorative />}
      <span className="text-sm text-team-ink">
        <b className="font-semibold">
          {count} {singleSource ? `de ${singleSource.name}` : "de otros equipos"}
        </b>{" "}
        {requests.length === 1 ? "espera" : "esperan"} revisión en tu bandeja
      </span>
      <Link
        href={routes.inbox(teamId)}
        className="ml-auto flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 text-[13px] font-medium text-primary-foreground hover:bg-primary/88"
      >
        Revisar
        <ArrowRight className="size-3.5" strokeWidth={1.8} />
      </Link>
    </div>
  );
}
