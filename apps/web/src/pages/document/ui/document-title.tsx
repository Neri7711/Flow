"use client";

import { useRouter } from "next/navigation";

import { renameDocument, UNTITLED_DOCUMENT } from "@/entities/document";
import { toast } from "@/shared/lib/toast";
import { EditableText } from "@/shared/ui/editable-text";

type DocumentTitleProps = {
  documentId: string;
  title: string;
  className?: string;
};

/** The page's title, renamed in place; a just-created page starts with it selected. */
export function DocumentTitle({ documentId, title, className }: DocumentTitleProps) {
  const router = useRouter();

  const rename = async (next: string) => {
    try {
      await renameDocument(documentId, next);
      // Breadcrumb, sidebar tree and tab title all come from the server.
      router.refresh();
    } catch {
      toast("No se pudo cambiar el título.");
    }
  };

  return (
    <EditableText
      as="h1"
      value={title}
      onSave={rename}
      label="Título de la página"
      autoSelect={title === UNTITLED_DOCUMENT}
      className={className}
    />
  );
}
