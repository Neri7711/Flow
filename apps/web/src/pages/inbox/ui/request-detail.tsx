"use client";

import { useState } from "react";
import { Check, ChevronDown, Info } from "lucide-react";

import { TaskIdPill } from "@/entities/task";
import type { Team } from "@/entities/team";
import type { TriageRequest } from "@/entities/triage";
import { type User, UserAvatar } from "@/entities/user";
import { formatDayMonth, formatRelative } from "@/shared/lib/format-date";
import { useHotkeys } from "@/shared/lib/use-hotkeys";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Eyebrow } from "@/shared/ui/eyebrow";
import { Kbd } from "@/shared/ui/kbd";
import { MonoTag } from "@/shared/ui/mono-tag";

import type { Decision } from "../model/use-decide";

const UNASSIGNED = "none";

type RequestDetailProps = {
  request: TriageRequest;
  space: Team;
  teams: readonly Team[];
  users: readonly User[];
  /** People of the space, offered as assignees. */
  members: readonly User[];
  canDecide: boolean;
  busy: boolean;
  onDecide: (decision: Decision) => void;
};

/** The selected request: who asks for what, what accepting it does, and the leader's actions. */
export function RequestDetail({ request, space, teams, users, members, canDecide, busy, onDecide }: RequestDetailProps) {
  const from = teams.find((team) => team.id === request.fromTeamId);
  const requester = users.find((user) => user.id === request.requesterId);
  const requesterTeam = requester && teams.find((team) => team.id === requester.teamId);

  const [assigneeId, setAssigneeId] = useState(UNASSIGNED);
  const assignee = members.find((member) => member.id === assigneeId) ?? null;
  // Shortcuts pause while the assignee menu is open: its typeahead also listens to letters.
  const [menuOpen, setMenuOpen] = useState(false);

  useHotkeys(
    {
      a: () => onDecide({ kind: "accept", assignee }),
      b: () => onDecide({ kind: "backlog" }),
      d: () => onDecide({ kind: "decline" }),
    },
    canDecide && !busy && !menuOpen,
  );

  return (
    <article aria-labelledby="request-title" className="flex flex-col gap-[22px]">
      <MonoTag data-team={request.fromTeamId} className="text-team-strong">
        Solicitud · de {from?.name ?? "otro equipo"}
      </MonoTag>
      <h2 id="request-title" className="text-[30px] leading-[1.12] font-bold tracking-display">
        {request.title}
      </h2>

      <dl className="grid grid-cols-[140px_minmax(0,1fr)] border-y border-line py-1.5">
        <dt className="flex min-h-9 items-center">
          <Eyebrow className="text-[10px]">Solicitado por</Eyebrow>
        </dt>
        <dd className="flex min-h-9 items-center gap-2 text-sm">
          {requester ? (
            <>
              <UserAvatar user={requester} size={24} />
              {requester.name}
              {requesterTeam && <span className="text-ink-muted">· {requesterTeam.name}</span>}
            </>
          ) : (
            <span className="text-ink-muted">Alguien de {from?.name ?? "otro equipo"}</span>
          )}
        </dd>
        <dt className="flex min-h-9 items-center">
          <Eyebrow className="text-[10px]">Solicitada</Eyebrow>
        </dt>
        <dd className="flex min-h-9 items-center text-sm" suppressHydrationWarning>
          {formatDayMonth(request.createdAt)} <span className="ml-1.5 text-ink-muted">· {formatRelative(request.createdAt)}</span>
        </dd>
      </dl>

      <div className="flex gap-3.5 rounded-2xl border border-dashed border-line-strong bg-panel px-[18px] py-4">
        <Info aria-hidden="true" className="mt-0.5 size-[18px] shrink-0 text-ink-muted" strokeWidth={1.8} />
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Si la aceptas</span>
          <p className="text-sm leading-[1.55] text-ink/85">
            Se crea una tarea nueva, <TaskIdPill task={{ id: `${space.abbreviation}-··`, teamId: space.id }} />, en el
            tablero de {space.name}: en Por hacer, o en el backlog si eliges «Mover a backlog». Su número se asigna al
            crearla.
          </p>
        </div>
      </div>

      {canDecide ? (
        <>
          <div className="flex items-center gap-3">
            <Eyebrow className="text-[10px]" id="assignee-label">
              Asignar a
            </Eyebrow>
            <DropdownMenu onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger
                aria-labelledby="assignee-label assignee-value"
                disabled={busy}
                className="flex h-9 cursor-pointer items-center gap-2 rounded-full border border-line bg-surface pr-3 pl-1.5 text-sm transition-colors duration-(--motion-press) outline-none hover:bg-surface-sunken focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
              >
                {assignee ? (
                  <UserAvatar user={assignee} size={26} ring />
                ) : (
                  <span aria-hidden="true" className="size-[26px] rounded-full border border-dashed border-line-strong" />
                )}
                <span id="assignee-value">{assignee?.name ?? "Sin asignar"}</span>
                <ChevronDown aria-hidden="true" className="size-4 text-ink-muted" strokeWidth={1.8} />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-60">
                <DropdownMenuRadioGroup value={assigneeId} onValueChange={setAssigneeId}>
                  <DropdownMenuRadioItem value={UNASSIGNED}>Sin asignar</DropdownMenuRadioItem>
                  {members.map((member) => (
                    <DropdownMenuRadioItem key={member.id} value={member.id}>
                      <UserAvatar user={member} size={20} />
                      {member.name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-wrap gap-2.5 border-t border-line pt-[18px]">
            <Button className="h-10" disabled={busy} onClick={() => onDecide({ kind: "accept", assignee })}>
              <Check strokeWidth={1.8} />
              {assignee ? "Aceptar y asignar" : "Aceptar"}
              <Kbd variant="inverse" size="sm">
                A
              </Kbd>
            </Button>
            <Button variant="secondary" className="h-10" disabled={busy} onClick={() => onDecide({ kind: "backlog" })}>
              Mover a backlog
              <Kbd size="sm">B</Kbd>
            </Button>
            <Button
              variant="ghost"
              className="h-10 px-3.5 text-ink-muted"
              disabled={busy}
              onClick={() => onDecide({ kind: "decline" })}
            >
              Rechazar
              <Kbd size="sm">D</Kbd>
            </Button>
          </div>
        </>
      ) : (
        <p className="border-t border-line pt-[18px] text-sm text-ink-muted">
          Solo los líderes de {space.name} pueden aceptar o rechazar.
        </p>
      )}
    </article>
  );
}
