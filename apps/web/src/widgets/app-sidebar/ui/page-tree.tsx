"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, File, Plus } from "lucide-react";

import { buildDocumentTree, type Document, type DocumentTreeNode, getAncestorIds } from "@/entities/document";
import { useCreatePage } from "@/features/create-page";
import { routes } from "@/shared/config";
import { cn } from "@/shared/lib/utils";
import { Eyebrow } from "@/shared/ui/eyebrow";

type PageTreeProps = {
  teamId: string;
  teamName: string;
  documents: readonly Document[];
};

/** Base left padding plus one indentation step per level (10px, 28px, 46px…). */
const indentFor = (depth: number) => 10 + depth * 18;

export function PageTree({ teamId, teamName, documents }: PageTreeProps) {
  const pathname = usePathname();
  const activeId = documents.find((doc) => pathname === routes.document(teamId, doc.id))?.id;
  const { createPage, pending } = useCreatePage(teamId);

  // Ancestors of the open document are expanded by default; `toggled` stores the user's
  // overrides, so navigating to another page still reveals it in the tree.
  const activeAncestors = new Set(activeId ? getAncestorIds(documents, activeId) : []);
  const [toggled, setToggled] = useState<ReadonlySet<string>>(() => new Set());
  const toggle = (id: string) =>
    setToggled((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const renderNode = (node: DocumentTreeNode, depth: number) => {
    const isActive = node.id === activeId;
    const isExpanded = activeAncestors.has(node.id) !== toggled.has(node.id);
    const hasChildren = node.children.length > 0;

    return (
      <li key={node.id}>
        <div
          className={cn(
            "group flex h-8 items-center gap-2 rounded-[10px] pr-2.5 text-sm transition-colors",
            isActive ? "bg-surface font-semibold shadow-[0_1px_2px_rgb(42_36_32/0.08)]" : "hover:bg-surface/60",
          )}
          style={{ paddingLeft: indentFor(depth) }}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggle(node.id)}
              aria-expanded={isExpanded}
              aria-label={`${isExpanded ? "Contraer" : "Expandir"} ${node.title}`}
              className="relative flex size-4 shrink-0 cursor-pointer items-center justify-center text-ink-muted"
            >
              {/* Notion-style: the page icon turns into a chevron on hover. */}
              <File className="size-4 group-hover:invisible" strokeWidth={1.8} />
              <ChevronRight
                className={cn("invisible absolute size-4 transition-transform group-hover:visible", isExpanded && "rotate-90")}
                strokeWidth={1.8}
              />
            </button>
          ) : (
            <File className="size-4 shrink-0 text-ink-muted" strokeWidth={1.8} />
          )}
          <Link
            href={routes.document(teamId, node.id)}
            aria-current={isActive ? "page" : undefined}
            className="min-w-0 flex-1 truncate"
          >
            {node.title}
          </Link>
        </div>
        {hasChildren && (
          // 0fr → 1fr animates the height without measuring; `inert` hides collapsed links from focus/AT.
          <div
            inert={!isExpanded}
            className={cn(
              "grid transition-[grid-template-rows] duration-(--motion-base) ease-out",
              isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
            )}
          >
            <ul className="flex min-h-0 flex-col gap-px overflow-hidden">
              {node.children.map((child) => renderNode(child, depth + 1))}
            </ul>
          </div>
        )}
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center px-2.5">
        <Eyebrow>Páginas de {teamName}</Eyebrow>
        <button
          type="button"
          aria-label="Nueva página"
          onClick={createPage}
          disabled={pending}
          className="ml-auto flex cursor-pointer p-0.5 text-ink-muted"
        >
          <Plus className="size-3.5" strokeWidth={1.8} />
        </button>
      </div>
      <ul className="flex flex-col gap-px">{buildDocumentTree(documents).map((node) => renderNode(node, 0))}</ul>
    </div>
  );
}
