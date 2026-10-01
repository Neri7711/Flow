"use client";

import { type KeyboardEvent, type ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { ArrowRight, File, Plus, Search } from "lucide-react";

import type { Document } from "@/entities/document";
import { TASK_STATUS_LABEL, TaskStatusIcon, useTaskStore } from "@/entities/task";
import type { Team } from "@/entities/team";
import { type User, UserAvatar } from "@/entities/user";
import { CreateTaskDialog } from "@/features/create-task";
import { routes } from "@/shared/config";
import { findMatch } from "@/shared/lib/text-match";
import { useHotkeys } from "@/shared/lib/use-hotkeys";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog";
import { Eyebrow } from "@/shared/ui/eyebrow";
import { Kbd } from "@/shared/ui/kbd";
import { Logo } from "@/shared/ui/logo";

type Scope = "all" | "tasks" | "documents" | "actions";

const SCOPES: Scope[] = ["all", "tasks", "documents", "actions"];
const SCOPE_LABEL: Record<Scope, string> = { all: "Todo", tasks: "Tareas", documents: "Documentos", actions: "Acciones" };
const RESULT_LIMIT = 5;

type CommandPaletteProps = {
  team: Team;
  teams: readonly Team[];
  users: readonly User[];
  documents: readonly Document[];
  /** Cycle new tasks join when created from anywhere in the space. */
  cycleId?: string;
};

/** "G then C" → Computer Science: first letter of each team name. */
const shortcutKey = (team: Team) => team.name.charAt(0).toLowerCase();

/**
 * Global ⌘K palette: search tasks and documents across teams and run actions without the mouse.
 * Also owns the global shortcuts (C create task, G + letter switch space).
 * Renders its own trigger, meant for the sidebar's search slot.
 */
export function CommandPalette({ team, teams, users, documents, cycleId }: CommandPaletteProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<Scope>("all");
  const [createTitle, setCreateTitle] = useState<string | null>(null);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const openPalette = (next: boolean) => {
    setOpen(next);
    if (next) {
      setQuery("");
      setScope("all");
    }
  };

  useHotkeys({
    "mod+k": (event) => {
      event.preventDefault();
      openPalette(!open);
    },
    c: () => setCreateTitle(""),
    ...Object.fromEntries(teams.map((target) => [`g ${shortcutKey(target)}`, () => go(routes.space(target.id))])),
  });

  // Tab cycles the result type, as hinted in the footer.
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Tab") return;
    event.preventDefault();
    const step = event.shiftKey ? -1 : 1;
    setScope((current) => SCOPES[(SCOPES.indexOf(current) + step + SCOPES.length) % SCOPES.length]);
  };

  const show = (kind: Scope) => scope === "all" || scope === kind;
  const trimmed = query.trim();

  return (
    <>
      <button
        type="button"
        onClick={() => openPalette(true)}
        className="flex h-9 cursor-pointer items-center gap-2.5 rounded-[10px] border border-line px-2.5 text-sm text-ink-muted transition-colors hover:bg-surface/60"
      >
        <Search className="size-4" strokeWidth={1.8} />
        <span>Buscar</span>
        <Kbd className="ml-auto">⌘K</Kbd>
      </button>

      <Dialog open={open} onOpenChange={openPalette}>
        <DialogContent
          showCloseButton={false}
          className="top-[120px] w-[640px] max-w-[calc(100%-2rem)] translate-y-0 gap-0 overflow-hidden rounded-[22px] p-0 shadow-[0_30px_80px_rgb(35_31_30/0.35)] sm:max-w-[640px]"
        >
          <DialogTitle className="sr-only">Paleta de comandos</DialogTitle>
          <DialogDescription className="sr-only">Busca tareas y documentos o ejecuta una acción.</DialogDescription>

          <Command shouldFilter={false} loop label="Paleta de comandos" onKeyDown={handleKeyDown}>
            <div className="flex items-center gap-3 border-b border-line px-5 py-4">
              <Search className="size-[18px] text-ink-muted" strokeWidth={1.8} />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Buscar o ejecutar comando"
                className="grow bg-transparent text-[17px] outline-none placeholder:text-ink-faint"
              />
              {scope !== "all" && (
                <span className="rounded-full bg-subtle px-2 py-0.5 text-xs text-ink-muted">{SCOPE_LABEL[scope]}</span>
              )}
              <Kbd variant="filled" size="sm">
                ESC
              </Kbd>
            </div>

            <Command.List className="max-h-[420px] overflow-y-auto p-2.5">
              <Command.Empty className="py-8 text-center text-sm text-ink-muted">
                {trimmed ? `Sin resultados para “${trimmed}”.` : "Escribe para buscar."}
              </Command.Empty>

              {show("tasks") && (
                <TaskResults query={trimmed} teams={teams} users={users} onSelect={(task) => go(`${routes.tasks(task.teamId)}?task=${task.id}`)} />
              )}

              {show("documents") && trimmed && (
                <Group heading="Documentos">
                  {documents
                    .map((doc) => ({ doc, match: findMatch(doc.title, trimmed) }))
                    .filter(({ match }) => match)
                    .slice(0, RESULT_LIMIT)
                    .map(({ doc, match }) => (
                      <Item key={doc.id} value={`doc:${doc.id}`} onSelect={() => go(routes.document(doc.teamId, doc.id))}>
                        <IconBox>
                          <File className="size-4" strokeWidth={1.8} />
                        </IconBox>
                        <ItemText meta={teams.find((candidate) => candidate.id === doc.teamId)?.name}>
                          {match && <Highlight {...match} />}
                        </ItemText>
                        <Kbd variant="filled" size="sm" className="ml-auto opacity-0 group-data-[selected=true]:opacity-100">
                          ↵
                        </Kbd>
                      </Item>
                    ))}
                </Group>
              )}

              {show("actions") && (
                <Group heading="Acciones">
                  <Item
                    value="action:create-task"
                    onSelect={() => {
                      setOpen(false);
                      setCreateTitle(trimmed);
                    }}
                  >
                    <IconBox>
                      <Plus className="size-4" strokeWidth={1.8} />
                    </IconBox>
                    <ItemText>{trimmed ? `Crear tarea “${trimmed}” en ${team.name}` : `Crear tarea en ${team.name}`}</ItemText>
                    <Kbd variant="filled" size="sm" className="ml-auto">
                      C
                    </Kbd>
                  </Item>
                  {teams
                    .filter((target) => target.id !== team.id && (!trimmed || findMatch(target.name, trimmed)))
                    .map((target) => (
                      <Item key={target.id} value={`go:${target.id}`} onSelect={() => go(routes.space(target.id))}>
                        <IconBox>
                          <ArrowRight className="size-4" strokeWidth={1.8} />
                        </IconBox>
                        <ItemText>Ir a {target.name}</ItemText>
                        <span className="ml-auto flex gap-1">
                          <Kbd variant="filled" size="sm">
                            G
                          </Kbd>
                          <Kbd variant="filled" size="sm">
                            {shortcutKey(target).toUpperCase()}
                          </Kbd>
                        </span>
                      </Item>
                    ))}
                </Group>
              )}
            </Command.List>

            <div className="flex items-center gap-4 border-t border-line bg-surface-sunken px-5 py-2.5 text-xs text-ink-muted">
              <span className="flex items-center gap-1.5">
                <Kbd variant="filled" size="sm">↑</Kbd>
                <Kbd variant="filled" size="sm">↓</Kbd>
                navegar
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd variant="filled" size="sm">↵</Kbd>
                abrir
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd variant="filled" size="sm">TAB</Kbd>
                filtrar por tipo
              </span>
              <Logo size="sm" className="ml-auto" />
            </div>
          </Command>
        </DialogContent>
      </Dialog>

      <CreateTaskDialog
        open={createTitle !== null}
        onOpenChange={(next) => !next && setCreateTitle(null)}
        team={team}
        defaultTitle={createTitle ?? ""}
        cycleId={cycleId}
        onCreated={(taskId) => router.push(`${routes.tasks(team.id)}?task=${taskId}`)}
      />
    </>
  );
}

type TaskResultsProps = {
  query: string;
  teams: readonly Team[];
  users: readonly User[];
  onSelect: (task: { id: string; teamId: string }) => void;
};

/** Matches by identifier or title across every team; empty query shows nothing (actions first). */
function TaskResults({ query, teams, users, onSelect }: TaskResultsProps) {
  const tasks = useTaskStore((state) => state.tasks);
  if (!query) return null;

  const results = Object.values(tasks)
    .map((task) => ({ task, match: findMatch(task.title, query), byId: task.id.toLowerCase().startsWith(query.toLowerCase()) }))
    .filter(({ match, byId }) => match || byId)
    .slice(0, RESULT_LIMIT);

  if (results.length === 0) return null;

  return (
    <Group heading="Tareas">
      {results.map(({ task, match }) => {
        const team = teams.find((candidate) => candidate.id === task.teamId);
        const assignee = users.find((user) => user.id === task.assigneeId);

        return (
          <Item key={task.id} value={`task:${task.id}`} onSelect={() => onSelect(task)}>
            <TaskStatusIcon status={task.status} />
            <ItemText meta={`${team?.name ?? ""} · ${TASK_STATUS_LABEL[task.status]}`}>
              <span data-team={task.teamId} className="mr-1 font-mono text-xs text-team-strong">
                {task.id}
              </span>
              {match ? <Highlight {...match} /> : task.title}
            </ItemText>
            {assignee && <UserAvatar user={assignee} size={22} ring className="ml-auto" />}
          </Item>
        );
      })}
    </Group>
  );
}

function Group({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <Command.Group
      heading={<Eyebrow className="text-[10px]">{heading}</Eyebrow>}
      className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:pb-1"
    >
      {children}
    </Command.Group>
  );
}

function Item({ value, onSelect, children }: { value: string; onSelect: () => void; children: ReactNode }) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 data-[selected=true]:bg-team-soft"
    >
      {children}
    </Command.Item>
  );
}

function ItemText({ meta, children }: { meta?: string; children: ReactNode }) {
  return (
    <span className="flex min-w-0 items-baseline gap-2">
      <span className="truncate text-sm font-medium">{children}</span>
      {meta && <span className="text-xs whitespace-nowrap text-ink-muted">{meta}</span>}
    </span>
  );
}

function IconBox({ children }: { children: ReactNode }) {
  return (
    <span className="flex size-[30px] shrink-0 items-center justify-center rounded-[9px] border border-line bg-surface text-ink-muted">
      {children}
    </span>
  );
}

function Highlight({ before, match, after }: { before: string; match: string; after: string }) {
  return (
    <>
      {before}
      <mark className="bg-transparent text-inherit underline decoration-team decoration-2 underline-offset-[3px]">{match}</mark>
      {after}
    </>
  );
}
