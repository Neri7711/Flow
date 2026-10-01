"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import Link from "next/link";
import { ChartNoAxesColumnIncreasing, Ellipsis, File, Link as LinkIcon, X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import {
  TASK_STATUS_LABEL,
  TASK_STATUSES,
  type Task,
  type TaskPriority,
  TaskMentionText,
  TaskStatusBadge,
  TaskStatusIcon,
  useTaskStore,
} from "@/entities/task";
import { TeamAvatar } from "@/entities/team";
import { UserAvatar } from "@/entities/user";
import { routes } from "@/shared/config";
import { formatDayMonth, formatRelative } from "@/shared/lib/format-date";
import { toast } from "@/shared/lib/toast";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Eyebrow } from "@/shared/ui/eyebrow";

import { type BoardDirectory, findById } from "../model/directory";

const PRIORITY_LABEL: Record<TaskPriority, string> = { low: "Baja", medium: "Media", high: "Alta" };

type TaskDetailPanelProps = {
  task: Task;
  directory: BoardDirectory;
  onClose: () => void;
};

/** Right-side task detail; the board stays visible behind it. */
export function TaskDetailPanel({ task, directory, onClose }: TaskDetailPanelProps) {
  const { currentUser, cycle, project } = directory;
  const setStatus = useTaskStore((state) => state.setStatus);
  const allTasks = useTaskStore((state) => state.tasks);
  const events = useTaskStore(useShallow((state) => state.events.filter((event) => event.taskId === task.id)));

  const assignee = findById(directory.users, task.assigneeId);
  const taskCycle = cycle && task.cycleId === cycle.id ? cycle : undefined;
  const taskProject = project && task.projectId === project.id ? project : undefined;
  const milestone = taskProject?.milestones.find((candidate) => candidate.id === task.milestoneId);
  const blockedBy = task.blockedByIds.map((id) => allTasks[id]).filter(Boolean);
  const blocks = Object.values(allTasks).filter((candidate) => candidate.blockedByIds.includes(task.id));
  const source = findById(directory.documents, task.sourceDocumentId);
  const mentions = (task.mentionedInDocumentIds ?? [])
    .map((id) => findById(directory.documents, id))
    .filter((doc) => doc !== undefined);

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast(<>Enlace a <b>{task.id}</b> copiado.</>);
  };

  return (
    <aside
      aria-label={`Detalle de ${task.id}`}
      className="flex w-detail-panel shrink-0 flex-col gap-5 overflow-y-auto border-l border-line bg-panel px-6 pt-5 pb-7"
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-ink-muted">{task.id}</span>
        <div className="ml-auto flex gap-0.5">
          <Button variant="ghost" size="icon" aria-label="Copiar enlace" onClick={copyLink}>
            <LinkIcon strokeWidth={1.8} />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Más opciones">
            <Ellipsis strokeWidth={1.8} />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Cerrar panel" onClick={onClose}>
            <X strokeWidth={1.8} />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-[26px] leading-[1.15] font-bold tracking-[-0.025em]">{task.title}</h2>
        <DropdownMenu>
          <DropdownMenuTrigger className="cursor-pointer self-start rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <TaskStatusBadge status={task.status} />
            <span className="sr-only">Cambiar estado</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 rounded-[14px] border border-line p-1.5 shadow-float ring-0">
            {TASK_STATUSES.map((status) => (
              <DropdownMenuItem
                key={status}
                onSelect={() => setStatus(task.id, status, currentUser.id)}
                className="gap-2 rounded-[10px] text-sm"
              >
                <TaskStatusIcon status={status} size={14} />
                {TASK_STATUS_LABEL[status]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <dl className="grid grid-cols-[110px_minmax(0,1fr)] border-y border-line py-1.5">
        <Property label="Responsable">
          {assignee ? (
            <>
              <UserAvatar user={assignee} size={22} ring />
              {assignee.name}
            </>
          ) : (
            <span className="text-ink-muted">Sin asignar</span>
          )}
        </Property>
        {taskCycle && (
          <Property label="Ciclo">
            Ciclo {taskCycle.number} · {formatDayMonth(taskCycle.startsAt)} – {formatDayMonth(taskCycle.endsAt)}
          </Property>
        )}
        {taskProject && (
          <Property label="Proyecto">
            <span data-team={taskProject.teamId} className="size-2 rounded-full bg-team" />
            {taskProject.name}
          </Property>
        )}
        {milestone && (
          <Property label="Hito">
            {milestone.name} · {formatDayMonth(milestone.date)}
          </Property>
        )}
        {task.priority && (
          <Property label="Prioridad">
            <ChartNoAxesColumnIncreasing className="size-3.5" strokeWidth={1.8} />
            {PRIORITY_LABEL[task.priority]}
          </Property>
        )}
      </dl>

      {task.description && <p className="text-sm leading-[1.6] text-ink/85">{task.description}</p>}

      {(blockedBy.length > 0 || blocks.length > 0) && (
        <section className="flex flex-col gap-2">
          <Eyebrow>Relaciones</Eyebrow>
          {blockedBy.map((related) => (
            <RelationRow key={related.id} kind="Bloqueada por" task={related} directory={directory} />
          ))}
          {blocks.map((related) => (
            <RelationRow key={related.id} kind="Bloquea a" task={related} directory={directory} />
          ))}
        </section>
      )}

      {(source || mentions.length > 0) && (
        <section className="flex flex-col gap-0.5">
          <Eyebrow>Documentos</Eyebrow>
          {source && <DocumentRow kind="Creada desde" teamId={source.teamId} id={source.id} title={source.title} />}
          {mentions.map((doc) => (
            <DocumentRow key={doc.id} kind="Mencionada en" teamId={doc.teamId} id={doc.id} title={doc.title} />
          ))}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <Eyebrow>Actividad</Eyebrow>
        {events.map((event) => {
          const actor = findById(directory.users, event.actorId);
          if (!actor) return null;

          if (event.kind === "status") {
            return (
              <div key={event.id} className="flex items-center gap-2.5 text-[13px] text-ink-muted">
                <TaskStatusIcon status={event.status} size={14} />
                <span>
                  <b className="font-semibold text-ink">{actor.shortName}</b> movió a {TASK_STATUS_LABEL[event.status]}
                </span>
                <span className="ml-auto font-mono text-[10px] uppercase">{formatRelative(event.at)}</span>
              </div>
            );
          }

          return (
            <div key={event.id} className="flex gap-2.5">
              <UserAvatar user={actor} size={28} ring />
              <div className="flex grow flex-col gap-1 rounded-xl border border-line bg-surface px-3 py-2.5">
                <div className="flex items-center">
                  <span className="text-[13px] font-semibold">{actor.shortName}</span>
                  <span className="ml-auto font-mono text-[10px] text-ink-muted uppercase">{formatRelative(event.at)}</span>
                </div>
                <p className="text-[13px] leading-normal">
                  <TaskMentionText text={event.body} />
                </p>
              </div>
            </div>
          );
        })}
        <CommentForm taskId={task.id} actorId={currentUser.id} />
      </section>
    </aside>
  );
}

function Property({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="flex min-h-[34px] items-center">
        <Eyebrow className="text-[10px]">{label}</Eyebrow>
      </dt>
      <dd className="flex min-h-[34px] items-center gap-2 text-sm">{children}</dd>
    </>
  );
}

function RelationRow({ kind, task, directory }: { kind: string; task: Task; directory: BoardDirectory }) {
  const team = findById(directory.teams, task.teamId);

  return (
    <Link
      href={`${routes.tasks(task.teamId)}?task=${task.id}`}
      scroll={false}
      className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-2.5 transition-colors hover:border-line-strong"
    >
      <span className="w-[84px] shrink-0 font-mono text-[10px] tracking-[0.06em] text-ink-muted uppercase">{kind}</span>
      {team && <TeamAvatar team={team} size={22} decorative />}
      <span data-team={task.teamId} className="font-mono text-[11px] font-medium text-team-strong">
        {task.id}
      </span>
      <span className="truncate text-[13px]">{task.title}</span>
      <span className="ml-auto flex shrink-0 items-center gap-[5px] text-xs text-ink-muted">
        <TaskStatusIcon status={task.status} size={13} />
        {TASK_STATUS_LABEL[task.status]}
      </span>
    </Link>
  );
}

function DocumentRow({ kind, teamId, id, title }: { kind: string; teamId: string; id: string; title: string }) {
  return (
    <Link href={routes.document(teamId, id)} className="group flex items-center gap-2.5 px-1 py-2">
      <span className="w-24 shrink-0 font-mono text-[10px] tracking-[0.06em] text-ink-muted uppercase">{kind}</span>
      <File className="size-3.5 shrink-0 text-ink-muted" strokeWidth={1.8} />
      <span className="truncate text-sm underline decoration-line underline-offset-[3px] group-hover:decoration-ink-muted">
        {title}
      </span>
    </Link>
  );
}

function CommentForm({ taskId, actorId }: { taskId: string; actorId: string }) {
  const addComment = useTaskStore((state) => state.addComment);
  const [body, setBody] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!body.trim()) return;
    addComment(taskId, actorId, body.trim());
    setBody("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor={`comment-${taskId}`} className="sr-only">
        Comentario
      </label>
      <input
        id={`comment-${taskId}`}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Escribe un comentario…"
        className="h-[42px] w-full rounded-xl border border-input bg-surface px-3.5 text-sm outline-none placeholder:text-ink-faint focus-visible:border-ink-muted focus-visible:ring-3 focus-visible:ring-ring/25"
      />
    </form>
  );
}
