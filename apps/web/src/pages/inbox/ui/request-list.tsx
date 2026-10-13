"use client";

import { AnimatePresence, motion } from "motion/react";

import { type Team, TeamAvatar } from "@/entities/team";
import type { TriageRequest } from "@/entities/triage";
import { motionTokens } from "@/shared/config";
import { formatRelative } from "@/shared/lib/format-date";
import { cn } from "@/shared/lib/utils";
import { Eyebrow } from "@/shared/ui/eyebrow";

type RequestListProps = {
  label: string;
  requests: readonly TriageRequest[];
  teams: readonly Team[];
  space: Team;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

/** "hace 25 min" → "25 MIN": the list only has room for the amount. */
const shortAge = (iso: string) => formatRelative(iso).replace(/^hace\s+/, "");

/** Pending requests; the selected one opens on the right. Decided ones leave with a short collapse. */
export function RequestList({ label, requests, teams, space, selectedId, onSelect }: RequestListProps) {
  return (
    <section aria-label={label} className="flex flex-col gap-0.5">
      <Eyebrow className="px-3 py-1 text-[10px]">{label}</Eyebrow>

      {requests.length === 0 && <p className="px-3 py-2 text-sm text-ink-muted">Nada pendiente por ahora.</p>}

      <ul className="flex flex-col gap-0.5">
        <AnimatePresence initial={false}>
          {requests.map((request) => {
            const from = teams.find((team) => team.id === request.fromTeamId);
            const selected = request.id === selectedId;

            return (
              <motion.li
                key={request.id}
                layout="position"
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: motionTokens.duration.fast, ease: motionTokens.ease.out }}
                className="overflow-hidden"
              >
                <button
                  type="button"
                  aria-current={selected || undefined}
                  onClick={() => onSelect(request.id)}
                  className={cn(
                    "flex w-full cursor-pointer gap-3 rounded-xl p-3 text-left transition-colors duration-(--motion-press) outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    selected ? "bg-surface shadow-card ring-1 ring-line" : "hover:bg-surface/50",
                  )}
                >
                  <span aria-hidden="true" data-team={space.id} className="mt-3.5 size-2 shrink-0 rounded-full bg-team" />
                  {from && <TeamAvatar team={from} size={36} decorative />}
                  <span className="flex min-w-0 grow flex-col gap-[3px]">
                    <span className="flex gap-2">
                      <span className="truncate text-sm font-semibold">
                        {from?.name ?? "Otro equipo"} pide ayuda a {space.name}
                      </span>
                      <span className="ml-auto shrink-0 font-mono text-[10px] text-ink-muted uppercase" suppressHydrationWarning>
                        {shortAge(request.createdAt)}
                      </span>
                    </span>
                    <span className="truncate text-[13px] text-ink-muted">{request.title}</span>
                  </span>
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </section>
  );
}
