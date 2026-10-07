"use client";

import { useEffect, useState } from "react";
import { TaskList } from "@tiptap/extension-list";
import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { saveDocumentContent } from "@/entities/document";
import { useTaskStoreApi } from "@/entities/task";
import type { Team } from "@/entities/team";
import { toast } from "@/shared/lib/toast";

import { Callout } from "./callout";
import { SlashCommand } from "./slash-command";
import { TaskItemWithConvert } from "./task-item-with-convert";
import { TaskMention } from "./task-mention";
import { TerminalCodeBlock } from "./terminal-code-block";

/** Quiet time after the last keystroke before the page is saved. */
const AUTOSAVE_DELAY_MS = 800;

/** Debounced saver: `schedule` on every change, `flush` to save what's pending right away. */
function createAutosave(save: (html: string) => Promise<void>) {
  let pending: { html: string; timer: ReturnType<typeof setTimeout> } | null = null;

  const flush = () => {
    if (!pending) return;
    clearTimeout(pending.timer);
    const { html } = pending;
    pending = null;
    save(html).catch(() => toast("No se pudieron guardar los últimos cambios."));
  };

  const schedule = (html: string) => {
    if (pending) clearTimeout(pending.timer);
    pending = { html, timer: setTimeout(flush, AUTOSAVE_DELAY_MS) };
  };

  return { schedule, flush };
}

type DocumentEditorProps = {
  documentId: string;
  team: Team;
  /** Initial HTML; edits are saved automatically. */
  content: string;
};

export function DocumentEditor({ documentId, team, content }: DocumentEditorProps) {
  const taskStore = useTaskStoreApi();
  const [autosave] = useState(() => createAutosave((html) => saveDocumentContent(documentId, html)));

  // Leaving the page saves whatever is still pending.
  useEffect(() => autosave.flush, [autosave]);

  const editor = useEditor({
    // Rendered on the client only: avoids SSR/hydration mismatches with node views.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ codeBlock: false, heading: { levels: [2, 3] } }),
      TerminalCodeBlock,
      TaskList,
      TaskItemWithConvert.configure({ team, documentId }),
      Callout.configure({ team }),
      TaskMention.configure({ hasTask: (id) => id in taskStore.getState().tasks }),
      SlashCommand,
      Placeholder.configure({ placeholder: "Escribe “/” para insertar un bloque…" }),
    ],
    content,
    editorProps: {
      attributes: { class: "flow-editor", "aria-label": "Contenido del documento" },
    },
    onUpdate: ({ editor: updated }) => autosave.schedule(updated.getHTML()),
  });

  return <EditorContent editor={editor} className="min-h-[300px]" />;
}
