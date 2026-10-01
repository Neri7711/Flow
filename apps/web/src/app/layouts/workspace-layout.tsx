import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { getActiveCycle } from "@/entities/cycle";
import { getAllDocuments } from "@/entities/document";
import { getTeam, getTeams } from "@/entities/team";
import { getTriageRequests } from "@/entities/triage";
import { getCurrentUser, getUsers } from "@/entities/user";
import { DependencyAlerts } from "@/features/dependency-alerts";
import { Toaster } from "@/shared/ui/toaster";
import { AppSidebar } from "@/widgets/app-sidebar";
import { CommandPalette } from "@/widgets/command-palette";

type WorkspaceLayoutProps = {
  teamId: string;
  children: ReactNode;
};

/** Sidebar + content column for every page inside a space (team theme comes from `SpaceTheme`). */
export async function WorkspaceLayout({ teamId, children }: WorkspaceLayoutProps) {
  const team = await getTeam(teamId);
  if (!team) notFound();

  const [teams, user, users, allDocuments, triage, cycle] = await Promise.all([
    getTeams(),
    getCurrentUser(),
    getUsers(),
    getAllDocuments(),
    getTriageRequests(team.id),
    getActiveCycle(team.id),
  ]);
  const documents = allDocuments.filter((doc) => doc.teamId === team.id);

  return (
    <div className="flex min-h-dvh">
      <AppSidebar
        team={team}
        teams={teams}
        user={user}
        documents={documents}
        inboxCount={triage.length}
        search={<CommandPalette team={team} teams={teams} users={users} documents={allDocuments} cycleId={cycle?.id} />}
      />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      <DependencyAlerts teamId={team.id} teams={teams} />
      <Toaster className="left-[calc(var(--spacing-sidebar)+2rem)]" />
    </div>
  );
}
