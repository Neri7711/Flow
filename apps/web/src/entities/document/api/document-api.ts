"use server";

import { api, query, segment } from "@/shared/api";

import type { Document, DocumentComment } from "../model/types";

const EMPTY_CONTENT = "<p></p>";

export async function getAllDocuments(): Promise<readonly Document[]> {
  return api.get<Document[]>("/documents");
}

export async function getTeamDocuments(teamId: string): Promise<readonly Document[]> {
  return api.get<Document[]>(`/documents${query({ teamId })}`);
}

export async function getRecentDocuments(teamId: string, limit = 4): Promise<readonly Document[]> {
  return api.get<Document[]>(`/documents/recent${query({ teamId, limit })}`);
}

export async function getDocument(id: string): Promise<Document | undefined> {
  return api.find<Document>(`/documents/${segment(id)}`);
}

export async function getDocumentContent(id: string): Promise<string> {
  const page = await api.find<{ content: string }>(`/documents/${segment(id)}/content`);
  return page?.content ?? EMPTY_CONTENT;
}

export async function getDocumentComments(id: string): Promise<readonly DocumentComment[]> {
  return api.get<DocumentComment[]>(`/documents/${segment(id)}/comments`);
}

/** Persists the editor's HTML (autosave). */
export async function saveDocumentContent(id: string, content: string): Promise<void> {
  await api.patch(`/documents/${segment(id)}`, { content });
}
