"use client";

import { type ClipboardEvent, type KeyboardEvent, useEffect, useRef } from "react";

import { cn } from "@/shared/lib/utils";

type EditableTextProps = {
  /** Element to render: the same tag (and classes) the static text used, so nothing looks different. */
  as?: "h1" | "h2" | "p";
  value: string;
  /** Called with the trimmed text when it changed (on Enter or when focus leaves). */
  onSave: (next: string) => void;
  /** Accessible name of the field ("Título de la página"). */
  label: string;
  className?: string;
  /** When false it renders plain text. */
  editable?: boolean;
  /** Empty text is saved as "" instead of being reverted. */
  allowEmpty?: boolean;
  /** Focus and select everything on mount (a page that was just created). */
  autoSelect?: boolean;
};

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Inline, single-line editing in place (Notion-style titles). Enter saves, Escape cancels,
 * pasted content arrives as plain text.
 */
export function EditableText({
  as: Tag = "p",
  value,
  onSave,
  label,
  className,
  editable = true,
  allowEmpty = false,
  autoSelect = false,
}: EditableTextProps) {
  const ref = useRef<HTMLHeadingElement & HTMLParagraphElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!autoSelect || !element) return;
    element.focus();
    const range = document.createRange();
    range.selectNodeContents(element);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
  }, [autoSelect]);

  if (!editable) return <Tag className={className}>{value}</Tag>;

  const commit = () => {
    const element = ref.current;
    if (!element) return;
    const next = (element.textContent ?? "").replace(/\s+/g, " ").trim();
    if (!next && !allowEmpty) {
      element.textContent = value;
      return;
    }
    if (next !== value) onSave(next);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    } else if (event.key === "Escape") {
      event.currentTarget.textContent = value;
      event.currentTarget.blur();
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLElement>) => {
    event.preventDefault();
    document.execCommand("insertText", false, event.clipboardData.getData("text/plain").replace(/\s+/g, " "));
  };

  return (
    <Tag
      ref={ref}
      role="textbox"
      aria-label={label}
      contentEditable
      // React doesn't manage the text inside a contentEditable: it's set as HTML from `value`.
      dangerouslySetInnerHTML={{ __html: escapeHtml(value) }}
      spellCheck
      onBlur={commit}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      className={cn(className, "cursor-text outline-none")}
    />
  );
}
