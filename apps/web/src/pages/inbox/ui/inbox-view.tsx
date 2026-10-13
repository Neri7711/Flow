"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import type { Team } from "@/entities/team";
import type { TriageRequest } from "@/entities/triage";
import type { User } from "@/entities/user";
import { motionTokens } from "@/shared/config";
import { cn } from "@/shared/lib/utils";
import { AnimatedNumber } from "@/shared/ui/animated-number";

import { useDecide } from "../model/use-decide";
import { AllClear, AlmostDone } from "./inbox-status";
import { RequestDetail } from "./request-detail";
import { RequestList } from "./request-list";
import { SendRequestForm } from "./send-request-form";

type Tab = "requests" | "notifications";

/** "Casi al día" shows up once this few decisions remain. */
const ALMOST_DONE_THRESHOLD = 2;

type InboxViewProps = {
  space: Team;
  teams: readonly Team[];
  users: readonly User[];
  members: readonly User[];
  requests: readonly TriageRequest[];
  canDecide: boolean;
  requestTargets: readonly Team[];
  defaultTargetId?: string;
};

/** Inbox: pending requests on the left, the selected one in detail on the right. */
export function InboxView({
  space,
  teams,
  users,
  members,
  requests,
  canDecide,
  requestTargets,
  defaultTargetId,
}: InboxViewProps) {
  const [tab, setTab] = useState<Tab>("requests");
  // Decided requests leave right away; the refreshed server data then confirms it.
  const [decidedIds, setDecidedIds] = useState<ReadonlySet<string>>(() => new Set());
  const pending = requests.filter((request) => !decidedIds.has(request.id));

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = pending.find((request) => request.id === selectedId) ?? pending[0];

  const { decide, busyId } = useDecide(space, (request) => {
    // Move on to the next request (or the previous one when it was the last).
    const index = pending.indexOf(request);
    setSelectedId((pending[index + 1] ?? pending[index - 1])?.id ?? null);
    setDecidedIds((current) => new Set(current).add(request.id));
  });

  const tabs = [
    { id: "requests", label: "Solicitudes", count: pending.length },
    { id: "notifications", label: "Notificaciones" },
  ] as const;

  return (
    <div data-team={space.id} className="flex h-[calc(100dvh-var(--spacing-topbar))] min-h-0">
      <div className="flex w-[420px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-line px-4 pt-[22px] pb-6">
        <h1 className="px-2 text-[28px] font-bold tracking-display">Bandeja</h1>

        <div className="px-2">
          <div role="tablist" aria-label="Bandeja" className="flex gap-0.5 rounded-xl bg-sand p-[3px]">
            {tabs.map((item) => (
              <button
                key={item.id}
                id={`inbox-tab-${item.id}`}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                aria-controls={`inbox-panel-${item.id}`}
                onClick={() => setTab(item.id)}
                className={cn(
                  "relative flex h-8 cursor-pointer items-center gap-2 rounded-[9px] px-3 text-[13px] font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  tab === item.id ? "font-semibold" : "hover:bg-surface/50",
                )}
              >
                {/* One indicator that glides between tabs, as on the board. */}
                {tab === item.id && (
                  <motion.span
                    layoutId="inbox-tab-indicator"
                    transition={motionTokens.spring}
                    className="absolute inset-0 rounded-[9px] bg-surface shadow-[0_1px_2px_rgb(42_36_32/0.1)]"
                  />
                )}
                <span className="relative">{item.label}</span>
                {"count" in item && (
                  <span className="relative rounded-full bg-team px-1.5 py-px font-mono text-[10px]">
                    <AnimatedNumber value={item.count} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {tab === "requests" ? (
          <div id="inbox-panel-requests" role="tabpanel" aria-labelledby="inbox-tab-requests" className="flex grow flex-col gap-4">
            <RequestList
              label={canDecide ? "Requieren tu decisión" : `Pendientes de ${space.name}`}
              requests={pending}
              teams={teams}
              space={space}
              selectedId={selected?.id ?? null}
              onSelect={setSelectedId}
            />
            {canDecide && pending.length > 0 && pending.length <= ALMOST_DONE_THRESHOLD && (
              <AlmostDone space={space} remaining={pending.length} />
            )}

            <section aria-labelledby="send-request-title" className="mt-auto flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
              <div className="flex flex-col gap-1">
                <h2 id="send-request-title" className="text-sm font-semibold">
                  Pedir algo a otro equipo
                </h2>
                <p className="text-[13px] text-ink-muted">Llega a su bandeja; uno de sus líderes decide si se vuelve tarea.</p>
              </div>
              <SendRequestForm teams={requestTargets} defaultTeamId={defaultTargetId} />
            </section>
          </div>
        ) : (
          <div
            id="inbox-panel-notifications"
            role="tabpanel"
            aria-labelledby="inbox-tab-notifications"
            className="flex flex-col gap-1 px-3 py-2"
          >
            <span className="text-sm font-semibold">Próximamente</span>
            <p className="text-[13px] text-ink-muted">Aquí verás menciones, comentarios y cambios en las tareas que sigues.</p>
          </div>
        )}
      </div>

      <div className="flex min-w-0 grow overflow-y-auto">
        <div className="flex w-full max-w-[760px] flex-col px-12 pt-7 pb-10">
          <AnimatePresence initial={false} mode="wait">
            {selected ? (
              <RequestDetail
                // A fresh detail per request: the chosen assignee doesn't carry over.
                key={selected.id}
                request={selected}
                space={space}
                teams={teams}
                users={users}
                members={members}
                canDecide={canDecide}
                busy={busyId !== null}
                onDecide={(decision) => decide(selected, decision)}
              />
            ) : (
              <AllClear key="all-clear" space={space} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
