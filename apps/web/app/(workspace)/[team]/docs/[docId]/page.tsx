import type { Metadata } from "next";

import { getDocument } from "@/entities/document";
import { DocumentPage } from "@/pages/document";

// Pages are created at runtime, so they render on demand (unknown ids 404 in `DocumentPage`).

export async function generateMetadata({ params }: PageProps<"/[team]/docs/[docId]">): Promise<Metadata> {
  const document = await getDocument((await params).docId);
  return { title: document?.title ?? "Documento" };
}

export default async function Page({ params }: PageProps<"/[team]/docs/[docId]">) {
  const { team, docId } = await params;
  return <DocumentPage teamId={team} documentId={docId} />;
}
