import type { Metadata } from "next";

import { getDocument, getTeamDocuments } from "@/entities/document";
import { DocumentPage } from "@/pages/document";

export const dynamicParams = false;

export async function generateStaticParams({ params }: { params: { team: string } }) {
  const documents = await getTeamDocuments(params.team);
  return documents.map((doc) => ({ docId: doc.id }));
}

export async function generateMetadata({ params }: PageProps<"/[team]/docs/[docId]">): Promise<Metadata> {
  const document = await getDocument((await params).docId);
  return { title: document?.title ?? "Documento" };
}

export default async function Page({ params }: PageProps<"/[team]/docs/[docId]">) {
  const { team, docId } = await params;
  return <DocumentPage teamId={team} documentId={docId} />;
}
