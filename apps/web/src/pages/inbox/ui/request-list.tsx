"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { type Team, TeamAvatar } from "@/entities/team";
import { acceptTriageRequest, declineTriageRequest, type TriageRequest } from "@/entities/triage";
import type { User } from "@/entities/user";
import { routes } from "@/shared/config";
import { formatRelative } from "@/shared/lib/format-date";
import { toast } from "@/shared/lib/toast";
import { Button } from "@/shared/ui/button";

type RequestListProps = {
  requests: readonly TriageRequest[];
  teams: readonly Team[];
  users: readonly User[];
  /** Only the receiving team's leaders decide. */
  canDecide: boolean;
  teamName: string;
};

export function RequestList({ requests, teams, users, canDecide, teamName }: RequestListProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  const decide = async (request: TriageRequest, accept: boolean) => {
    setBusyId(request.id);
    try {
      if (accept) {
        const taskId = await acceptTriageRequest(request.id);
        toast(
          <>
            Se creó{" "}
            <Link href={`${routes.tasks(request.toTeamId)}?task=${taskId}`} className="font-semibold underline underline-offset-2">
              {taskId}
            </Link>{" "}
            en el tablero.
          </>,
        );
      } else {
        await declineTriageRequest(request.id);
        toast(<>Solicitud rechazada.</>);
      }
      router.refresh();
    } catch {
      toast("No se pudo guardar la decisión. Puede que otro líder ya la haya tomado.");
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  if (requests.length === 0) {
    return <p className="border-t border-subtle py-3 text-sm text-ink-muted">No hay solicitudes pendientes.</p>;
  }

  return (
    <>
      {!canDecide && (
        <p className="border-t border-subtle py-3 text-sm text-ink-muted">Solo los líderes de {teamName} pueden aceptar o rechazar.</p>
      )}
      {requests.map((request) => {
        const from = teams.find((team) => team.id === request.fromTeamId);
        const requester = users.find((user) => user.id === request.requesterId);
        const busy = busyId === request.id;

        return (
          <div key={request.id} className="flex items-center gap-3.5 border-t border-subtle py-3">
            {from && <TeamAvatar team={from} size={36} decorative />}
            <div className="flex min-w-0 flex-col gap-[3px]">
              <span className="truncate text-sm font-medium">{request.title}</span>
              <span className="text-xs text-ink-muted" suppressHydrationWarning>
                {from?.name ?? "Otro equipo"}
                {requester && ` · ${requester.shortName}`} · {formatRelative(request.createdAt)}
              </span>
            </div>
            {canDecide && (
              <div className="ml-auto flex shrink-0 gap-1.5">
                <Button variant="ghost" disabled={busy} onClick={() => decide(request, false)}>
                  Rechazar
                </Button>
                <Button disabled={busy} onClick={() => decide(request, true)}>
                  Aceptar
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
