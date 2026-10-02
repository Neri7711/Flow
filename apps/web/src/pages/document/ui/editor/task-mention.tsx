"use client";

import Link from "next/link";
import { InputRule, mergeAttributes, Node, type NodeViewProps, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";

import { TASK_STATUS_LABEL, TaskStatusIcon, useTaskStore } from "@/entities/task";
import { routes } from "@/shared/config";

/** Live pill: always shows the task's current status from the shared store. */
function TaskMentionView({ node }: NodeViewProps) {
  const id = node.attrs.id as string;
  const task = useTaskStore((state) => state.tasks[id]);

  if (!task) {
    return (
      <NodeViewWrapper as="span" className="font-mono text-[13px] text-ink-muted">
        {id}
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper as="span" className="inline-block align-baseline">
      <Link
        href={`${routes.tasks(task.teamId)}?task=${task.id}`}
        data-team={task.teamId}
        data-task-mention-id={task.id}
        title={`${task.title} · ${TASK_STATUS_LABEL[task.status]}`}
        contentEditable={false}
        className="mx-0.5 inline-flex items-center gap-1.5 rounded-full border border-line bg-surface py-0.5 pr-2.5 pl-1.5 align-[-2px] text-[13px] leading-5 no-underline transition-colors hover:border-line-strong"
      >
        <TaskStatusIcon status={task.status} size={14} />
        <span className="font-mono text-xs text-team-strong">{task.id}</span>
        <span className="max-w-[220px] truncate">{task.title}</span>
      </Link>
    </NodeViewWrapper>
  );
}

/** Typing an existing identifier followed by a space ("CS-17 ") turns it into a pill. */
const TASK_ID_AT_END = /\b([A-Z]{2}-\d+)\s$/;

export const TaskMention = Node.create({
  name: "taskMention",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      id: { default: null, parseHTML: (element) => element.getAttribute("data-id") },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="task-mention"]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { "data-type": "task-mention", "data-id": node.attrs.id }), node.attrs.id];
  },

  renderText({ node }) {
    return node.attrs.id as string;
  },

  addNodeView() {
    return ReactNodeViewRenderer(TaskMentionView);
  },

  addInputRules() {
    return [
      new InputRule({
        find: TASK_ID_AT_END,
        handler: ({ state, range, match }) => {
          const id = match[1];
          if (!useTaskStore.getState().tasks[id]) return null;

          const start = range.from + match[0].indexOf(id);
          state.tr.replaceWith(start, range.to, [this.type.create({ id }), state.schema.text(" ")]);
        },
      }),
    ];
  },
});
