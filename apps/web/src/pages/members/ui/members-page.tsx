import { notFound } from "next/navigation";

import { getPendingInvitations } from "@/entities/invitation";
import { getTeam } from "@/entities/team";
import { getCurrentUser, getTeamMembers, getUsers } from "@/entities/user";
import { routes } from "@/shared/config";
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

      <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-[22px] px-12 pt-7 pb-12">
        <header className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-2.5">
            <span className="self-start rounded-lg border border-team-strong px-[9px] py-1 font-mono text-[11px] tracking-[0.1em] text-team-strong uppercase">
              Espacio · {team.name}
            </span>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="text-[32px] leading-[1.1] font-bold tracking-display">Miembros</h1>
              <p className="font-serif text-xl text-ink-muted italic">las personas detrás de {team.name}</p>
            </div>
          </div>
          <div className="ml-auto">{isLeader && <InvitePanel invitations={invitations} />}</div>
        </header>

        <MemberList members={members} currentUserId={user.id} canManage={isLeader} teamName={team.name} />

        {!isLeader && <p className="text-sm text-ink-muted">¿Falta alguien? Pide a un líder de {team.name} que le mande una invitación.</p>}
      </main>
    </>
  );
}
