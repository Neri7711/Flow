"use client";

import { TaskList } from "@tiptap/extension-list";
import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import type { Team } from "@/entities/team";

import { Callout } from "./callout";
import { SlashCommand } from "./slash-command";
import { TaskItemWithConvert } from "./task-item-with-convert";
import { TaskMention } from "./task-mention";
import { TerminalCodeBlock } from "./terminal-code-block";

type DocumentEditorProps = {
  documentId: string;
  team: Team;
  /** Initial HTML. Edits live in memory only while data is simulated. */
  content: string;
};

export function DocumentEditor({ documentId, team, content }: DocumentEditorProps) {
  const editor = useEditor({
    // Rendered on the client only: avoids SSR/hydration mismatches with node views.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ codeBlock: false, heading: { levels: [2, 3] } }),
      TerminalCodeBlock,
      TaskList,
      TaskItemWithConvert.configure({ team, documentId }),
      Callout.configure({ team }),
      TaskMention,
      SlashCommand,
      Placeholder.configure({ placeholder: "Escribe “/” para insertar un bloque…" }),
    ],
    content,
    editorProps: {
      attributes: { class: "flow-editor", "aria-label": "Contenido del documento" },
    },
  });

  return <EditorContent editor={editor} className="min-h-[300px]" />;
}
