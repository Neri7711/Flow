import { notFound } from "next/navigation";

import { getTeam, getTeams } from "@/entities/team";
import { getTriageRequests } from "@/entities/triage";
import { getCurrentUser, getTeamMembers, getUsers } from "@/entities/user";
import { routes } from "@/shared/config";
import { AppTopbar } from "@/widgets/app-topbar";

import { InboxView } from "./inbox-view";

/** Requests other teams sent to this space, and a way to ask another team for something. */
export async function InboxPage({ teamId }: { teamId: string }) {
  const team = await getTeam(teamId);
  if (!team) notFound();

  const [teams, user, users, members, requests] = await Promise.all([
    getTeams(),
    getCurrentUser(),
    getUsers(),
    getTeamMembers(team.id),
    getTriageRequests(team.id),
  ]);
  const canDecide = user.role === "leader" && user.teamId === team.id;

  return (
    <>
      <AppTopbar
        breadcrumb={[{ label: team.name, href: routes.space(team.id) }, { label: "Bandeja" }]}
        presence={users.filter((candidate) => candidate.id !== user.id)}
      />

      <InboxView
        space={team}
        teams={teams}
        users={users}
        members={members}
        requests={requests}
        canDecide={canDecide}
        // Teams you can ask: not your own. Viewing another team's inbox suggests that team.
        requestTargets={teams.filter((candidate) => candidate.id !== user.teamId)}
        defaultTargetId={team.id !== user.teamId ? team.id : undefined}
      />
    </>
  );
}
