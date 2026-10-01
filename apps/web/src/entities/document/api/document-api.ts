import type { Document, DocumentComment } from "../model/types";
import { DOCUMENT_COMMENTS, DOCUMENT_CONTENT, DOCUMENTS } from "./fixtures";

// Static data for now. Async on purpose: same signature the backend-backed version will have.

export async function getAllDocuments(): Promise<readonly Document[]> {
  return DOCUMENTS;
}

export async function getTeamDocuments(teamId: string): Promise<readonly Document[]> {
  return DOCUMENTS.filter((doc) => doc.teamId === teamId);
}

export async function getRecentDocuments(teamId: string, limit = 4): Promise<readonly Document[]> {
  return DOCUMENTS.filter((doc) => doc.teamId === teamId)
    .toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit);
}

export async function getDocument(id: string): Promise<Document | undefined> {
  return DOCUMENTS.find((doc) => doc.id === id);
}

export async function getDocumentContent(id: string): Promise<string> {
  return DOCUMENT_CONTENT[id] ?? "<p></p>";
}

export async function getDocumentComments(id: string): Promise<readonly DocumentComment[]> {
  return DOCUMENT_COMMENTS.filter((comment) => comment.documentId === id);
}
