import { notFound } from "next/navigation";

import { getPendingInvitations } from "@/entities/invitation";
import { getTeam } from "@/entities/team";
import { getCurrentUser, getTeamMembers, getUsers } from "@/entities/user";
import { routes } from "@/shared/config";
import { Card, CardHeader, CardTitle } from "@/shared/ui/card";
import { Eyebrow } from "@/shared/ui/eyebrow";
import { AppTopbar } from "@/widgets/app-topbar";

import { InvitePanel } from "./invite-panel";
import { MemberList } from "./member-list";

/** People in this space; its leaders manage roles and invitations. */
export async function MembersPage({ teamId }: { teamId: string }) {
  const team = await getTeam(teamId);
  if (!team) notFound();

  const [user, users, members] = await Promise.all([getCurrentUser(), getUsers(), getTeamMembers(team.id)]);
  const isLeader = user.role === "leader" && user.teamId === team.id;
  const invitations = isLeader ? await getPendingInvitations(team.id) : [];

  return (
    <>
      <AppTopbar
        breadcrumb={[{ label: team.name, href: routes.space(team.id) }, { label: "Miembros" }]}
        presence={users.filter((candidate) => candidate.id !== user.id)}
      />

      <main className="mx-auto flex w-full max-w-[880px] flex-col gap-6 px-12 pt-8 pb-14">
        <header className="flex flex-col gap-2">
          <Eyebrow>Miembros · {team.name}</Eyebrow>
          <h1 className="text-[32px] leading-[1.1] font-bold tracking-display">Equipo</h1>
          <p className="font-serif text-xl text-ink-muted italic">
            {members.length === 1 ? "1 persona" : `${members.length} personas`} en {team.name}.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Integrantes</CardTitle>
            <Eyebrow>{members.length}</Eyebrow>
          </CardHeader>
          <MemberList members={members} currentUserId={user.id} canManage={isLeader} />
        </Card>

        {isLeader ? (
          <InvitePanel invitations={invitations} />
        ) : (
          <p className="text-sm text-ink-muted">¿Falta alguien? Pide a un líder de {team.name} que le mande una invitación.</p>
        )}
      </main>
    </>
  );
}
