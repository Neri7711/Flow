"use client";

import { TaskItem } from "@tiptap/extension-list";
import { NodeViewContent, type NodeViewProps, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { SquareArrowOutUpRight } from "lucide-react";

import { useTaskStore } from "@/entities/task";
import type { Team } from "@/entities/team";
import { measureText, morphTextInto } from "@/shared/lib/morph";
import { toast } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";
import { Checkbox } from "@/shared/ui/checkbox";

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

    // Measure the item's text before the DOM changes, to morph it into the new pill.
    const paragraph = (editor.view.nodeDOM(position) as HTMLElement | null)?.querySelector("p");
    const source = paragraph ? measureText(paragraph) : null;

    const id = createTask({
      teamId: team.id,
      abbreviation: team.abbreviation,
      title,
      status: checked ? "done" : "todo",
      sourceDocumentId: documentId ?? undefined,
    });
    // The item's text becomes the task: replace the paragraph's content (<li> → <p>, hence +2)
    // with the live pill, which already shows the title.
    const textStart = position + 2;
    const textEnd = textStart + node.child(0).content.size;
    editor.chain().insertContentAt({ from: textStart, to: textEnd }, { type: "taskMention", attrs: { id } }).run();

    // The pill is a React node view, rendered a frame or two after the transaction.
    if (source) {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          const pill = editor.view.dom.querySelector<HTMLElement>(`[data-task-mention-id="${id}"]`);
          if (pill) morphTextInto(source, pill);
        }),
      );
    }
    toast(
      <>
        Se creó <b>{id}</b> desde este documento.
      </>,
    );
  };

  return (
    <NodeViewWrapper as="li" data-checked={checked} className="group/item flex items-start gap-3">
      <span contentEditable={false} className="mt-[3px] shrink-0">
        <Checkbox checked={checked} onChange={handleCheck} aria-label={title ? `Completar “${title}”` : "Completar"} />
      </span>
      <NodeViewContent
        className={cn(
          // Always struck, but transparent until checked: the line fades in and out.
          "min-w-0 flex-1 line-through decoration-transparent transition-[color,text-decoration-color] duration-(--motion-base) [&_p]:!m-0 [&_p]:!text-base",
          checked && "text-ink-muted decoration-current",
        )}
      />
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
