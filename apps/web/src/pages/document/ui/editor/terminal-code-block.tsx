"use client";

import { CodeBlock } from "@tiptap/extension-code-block";
import { NodeViewContent, type NodeViewProps, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";

import { toast } from "@/shared/lib/toast";

/** Shell-like languages are labelled as a terminal, everything else by its name. */
const SHELL_LANGUAGES = new Set(["bash", "sh", "shell", "zsh"]);

function CodeBlockView({ node }: NodeViewProps) {
  const language = (node.attrs.language as string | null) ?? "";
  const label = !language || SHELL_LANGUAGES.has(language) ? "Terminal" : language;

  const copy = async () => {
    await navigator.clipboard.writeText(node.textContent);
    toast("Código copiado.");
  };

  return (
    <NodeViewWrapper className="my-1 overflow-hidden rounded-2xl bg-night">
      <div contentEditable={false} className="flex items-center border-b border-cream/10 px-4 py-2.5 select-none">
        <span className="font-mono text-[10px] tracking-label text-cream/70 uppercase">{label}</span>
        <button
          type="button"
          onClick={copy}
          className="ml-auto cursor-pointer rounded-lg border border-cream/20 px-2.5 py-1 font-mono text-[11px] text-cream/90 transition-colors hover:bg-cream/10"
        >
          Copiar
        </button>
      </div>
      <pre className="m-0 overflow-x-auto px-[18px] py-4 font-mono text-sm leading-[1.7] text-cream">
        <NodeViewContent<"code"> as="code" />
      </pre>
    </NodeViewWrapper>
  );
}

/** Dark "terminal" code block with a copy button (bash by default). */
export const TerminalCodeBlock = CodeBlock.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView);
  },
}).configure({ defaultLanguage: "bash" });
