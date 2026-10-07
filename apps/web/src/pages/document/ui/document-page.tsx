import { notFound } from "next/navigation";

import { getAncestorIds, getDocument, getDocumentComments, getDocumentContent, getTeamDocuments } from "@/entities/document";
import { getTeam, TeamAvatar } from "@/entities/team";
import { getCurrentUser, getUsers } from "@/entities/user";
import { routes } from "@/shared/config";
import { formatRelative } from "@/shared/lib/format-date";
import { StripeBand } from "@/shared/ui/brand-stripes";
import { AppTopbar } from "@/widgets/app-topbar";

import { DocumentComments } from "./document-comments";
import { DocumentProperties } from "./document-properties";
import { DocumentTitle } from "./document-title";
import { DocumentEditor } from "./editor/document-editor";

type DocumentPageProps = {
  teamId: string;
  documentId: string;
};

export async function DocumentPage({ teamId, documentId }: DocumentPageProps) {
  const [team, document] = await Promise.all([getTeam(teamId), getDocument(documentId)]);
  if (!team || !document || document.teamId !== team.id) notFound();

  const [teamDocuments, content, comments, users, currentUser] = await Promise.all([
    getTeamDocuments(team.id),
    getDocumentContent(document.id),
    getDocumentComments(document.id),
    getUsers(),
    getCurrentUser(),
  ]);
  const ancestors = getAncestorIds(teamDocuments, document.id)
    .toReversed()
    .map((id) => teamDocuments.find((doc) => doc.id === id))
    .filter((doc) => doc !== undefined);

  return (
    <>
      <AppTopbar
        breadcrumb={[
          { label: team.name, href: routes.space(team.id) },
          ...ancestors.map((doc) => ({ label: doc.title, href: routes.document(team.id, doc.id) })),
          { label: document.title },
        ]}
        meta={`Editado ${formatRelative(document.updatedAt)}`}
        page={{ id: document.id, teamId: team.id, title: document.title }}
        presence={users.filter((user) => user.id !== currentUser.id)}
      />

      {/* Cover in the team color, signed with the thin brand stripes. */}
      <div className="relative h-[150px] shrink-0 overflow-hidden bg-team-soft">
        <StripeBand className="absolute inset-x-0 bottom-0" />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,720px)_minmax(0,1fr)] gap-8 px-10 pb-16">
        <div />
        <article className="-mt-11 flex flex-col gap-[22px]">
          <TeamAvatar team={team} size={88} className="ring-[5px] ring-cream" decorative />
          <DocumentTitle
            documentId={document.id}
            title={document.title}
            className="text-[42px] leading-[1.08] font-bold tracking-[-0.035em]"
          />
          <DocumentProperties document={document} users={users} />
          <DocumentEditor documentId={document.id} team={team} content={content} />
        </article>
        <aside className="hidden pt-[470px] xl:block">
          <DocumentComments documentId={document.id} comments={comments} users={users} />
        </aside>
      </div>
    </>
  );
}
