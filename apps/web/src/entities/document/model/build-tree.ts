import type { Document, DocumentTreeNode } from "./types";

/** Nests a flat, ordered document list by `parentId`, preserving order. */
export function buildDocumentTree(documents: readonly Document[]): DocumentTreeNode[] {
  const nodes = new Map<string, DocumentTreeNode>(documents.map((doc) => [doc.id, { ...doc, children: [] }]));
  const roots: DocumentTreeNode[] = [];

  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    (parent ? parent.children : roots).push(node);
  }

  return roots;
}

/** Ids of every ancestor of `id` (closest first). */
export function getAncestorIds(documents: readonly Document[], id: string): string[] {
  const byId = new Map(documents.map((doc) => [doc.id, doc]));
  const ancestors: string[] = [];
  let current = byId.get(id)?.parentId;

  while (current) {
    ancestors.push(current);
    current = byId.get(current)?.parentId;
  }

  return ancestors;
}
