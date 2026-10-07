"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useTaskStoreApi } from "@/entities/task";
import type { Team } from "@/entities/team";
import { acceptTriageRequest, declineTriageRequest, type TriageRequest } from "@/entities/triage";
import type { User } from "@/entities/user";
import { routes } from "@/shared/config";
import { toast } from "@/shared/lib/toast";

/** What a leader can do with a request: "A" accept (optionally assigning), "B" backlog, "D" decline. */
export type Decision = { kind: "accept"; assignee: User | null } | { kind: "backlog" } | { kind: "decline" };

/**
 * Saves a leader's decision on a request and reports it. The new task's id is only known
 * once the API creates it, so assigning it is a second step through the task store.
 */
export function useDecide(space: Team, onDecided: (request: TriageRequest) => void) {
  const router = useRouter();
  const taskStore = useTaskStoreApi();
  const [busyId, setBusyId] = useState<string | null>(null);

  /** The store only edits tasks it knows about: pull the one just created first. */
  const assign = async (taskId: string, assignee: User) => {
    await taskStore.getState().sync();
    if (!taskStore.getState().tasks[taskId]) return false;
    await taskStore.getState().updateTask(taskId, { assigneeId: assignee.id });
    return taskStore.getState().tasks[taskId]?.assigneeId === assignee.id;
  };

  const taskLink = (taskId: string) => (
    <Link href={`${routes.tasks(space.id)}?task=${taskId}`} className="font-semibold underline underline-offset-2">
      {taskId}
    </Link>
  );

  const decide = async (request: TriageRequest, decision: Decision) => {
    if (busyId) return;
    setBusyId(request.id);
    try {
      if (decision.kind === "decline") {
        await declineTriageRequest(request.id);
        toast("Solicitud rechazada.");
      } else if (decision.kind === "backlog") {
        const taskId = await acceptTriageRequest(request.id, "backlog");
        toast(<>Se creó {taskLink(taskId)} en el backlog de {space.name}.</>);
      } else {
        const { assignee } = decision;
        const taskId = await acceptTriageRequest(request.id, "todo");
        const assigned = assignee ? await assign(taskId, assignee) : false;
        toast(
          <>
            Se creó {taskLink(taskId)} en el tablero de {space.name}
            {assignee && (assigned ? ` y se asignó a ${assignee.shortName}.` : ", pero no se pudo asignar. Hazlo desde el tablero.")}
            {!assignee && "."}
          </>,
        );
      }
      onDecided(request);
      router.refresh();
    } catch {
      toast("No se pudo guardar la decisión. Puede que otro líder ya la haya tomado.");
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  return { decide, busyId };
}
