import type { TeamId } from "@/entities/team/@x/document";

export type Document = {
  id: string;
  teamId: TeamId;
  title: string;
  /** `null` for top-level pages of the space. */
  parentId: string | null;
  updatedAt: string;
  updatedById: string;
  properties?: DocumentProperties;
};

/** Notion-style page properties (all optional; only filled ones are shown). */
export type DocumentProperties = {
  /** Free-form review state of the page itself ("En revisión"), not a task status. */
  status?: string;
  ownerId?: string;
  tags?: string[];
};

export type DocumentComment = {
  id: string;
  documentId: string;
  /** `null` for a thread's first comment; replies point at it (threads are one level deep). */
  parentId: string | null;
  authorId: string;
  body: string;
  at: string;
};

export type DocumentTreeNode = Document & {
  children: DocumentTreeNode[];
};
