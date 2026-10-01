"use client";

import { TaskItem } from "@tiptap/extension-list";
import { NodeViewContent, type NodeViewProps, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { SquareArrowOutUpRight } from "lucide-react";

import { useTaskStore } from "@/entities/task";
import type { Team } from "@/entities/team";
import { toast } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";

type ConvertOptions = {
  team: Team | null;
  documentId: string | null;
};

/** Id of the task already linked to this checklist item, if any. */
function linkedTaskId(node: NodeViewProps["node"]): string | null {
  let id: string | null = null;
  node.descendants((child) => {
    if (child.type.name === "taskMention") id = child.attrs.id as string;
    return id === null;
  });
  return id;
}

function TaskItemView({ node, updateAttributes, getPos, editor, extension }: NodeViewProps) {
  const { team, documentId } = extension.options as ConvertOptions & { nested: boolean };
  const createTask = useTaskStore((state) => state.createTask);
  const toggleDone = useTaskStore((state) => state.toggleDone);
  const checked = Boolean(node.attrs.checked);
  const linkedId = linkedTaskId(node);
  const title = node.textContent.trim();

  const handleCheck = () => {
    updateAttributes({ checked: !checked });
    // A converted item stays in sync with its task.
    if (linkedId) toggleDone(linkedId);
  };

  const convert = () => {
    const position = getPos();
    if (!team || !title || typeof position !== "number") return;

    const id = createTask({
      teamId: team.id,
      abbreviation: team.abbreviation,
      title,
      status: checked ? "done" : "todo",
      sourceDocumentId: documentId ?? undefined,
    });
    // Inside <li> → <p>: +2 lands at the start of the item's text.
    editor.chain().insertContentAt(position + 2, [{ type: "taskMention", attrs: { id } }, { type: "text", text: " " }]).run();
    toast(
      <>
        Se creó <b>{id}</b> desde este documento.
      </>,
    );
  };

  return (
    <NodeViewWrapper as="li" data-checked={checked} className="group/item flex items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={handleCheck}
        contentEditable={false}
        aria-label={title ? `Completar “${title}”` : "Completar"}
        className="mt-[5px] size-[18px] shrink-0 cursor-pointer accent-ink"
      />
      <NodeViewContent className={cn("min-w-0 flex-1 [&_p]:!m-0 [&_p]:!text-base", checked && "text-ink-muted line-through")} />
      {!linkedId && title && team && (
        <button
          type="button"
          onClick={convert}
          contentEditable={false}
          className="mt-0.5 flex shrink-0 cursor-pointer items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-0.5 text-xs text-ink-muted opacity-0 transition-opacity group-hover/item:opacity-100 hover:text-ink focus-visible:opacity-100"
        >
          <SquareArrowOutUpRight className="size-3" strokeWidth={1.8} />
          Convertir en tarea
        </button>
      )}
    </NodeViewWrapper>
  );
}

/** Checklist item that can become a tracked task with one click (doc → task bridge). */
export const TaskItemWithConvert = TaskItem.extend<ConvertOptions & { nested: boolean }>({
  addOptions() {
    return { ...this.parent?.(), nested: false, team: null, documentId: null };
  },
  addNodeView() {
    return ReactNodeViewRenderer(TaskItemView);
  },
});
