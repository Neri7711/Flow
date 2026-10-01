"use client";

import { mergeAttributes, Node, NodeViewContent, type NodeViewProps, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";

import { type Team, TeamAvatar } from "@/entities/team";

type CalloutOptions = {
  /** Space the document belongs to: its mascot signs the callout. */
  team: Team | null;
};

function CalloutView({ extension }: NodeViewProps) {
  const { team } = extension.options as CalloutOptions;

  return (
    <NodeViewWrapper
      data-team={team?.id}
      className="my-1 flex items-center gap-3.5 rounded-2xl bg-team-soft/60 px-[18px] py-4 text-[15px] leading-[1.55] text-team-ink"
    >
      {team && (
        <span contentEditable={false} className="shrink-0 select-none">
          <TeamAvatar team={team} size={40} decorative />
        </span>
      )}
      <NodeViewContent className="min-w-0 flex-1 [&_p]:!m-0 [&_p]:!text-[15px]" />
    </NodeViewWrapper>
  );
}

/** Highlighted note block signed by the space mascot. */
export const Callout = Node.create<CalloutOptions>({
  name: "callout",
  group: "block",
  content: "paragraph+",
  defining: true,

  addOptions() {
    return { team: null };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "callout" }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutView);
  },
});
