import { Suspense } from "react";
import { notFound } from "next/navigation";

import { getActiveCycle } from "@/entities/cycle";
import { getTeamDocuments } from "@/entities/document";
import { getActiveProject } from "@/entities/project";
import { getTaskLabels } from "@/entities/task";
import { getTeam, getTeams } from "@/entities/team";
import { getTriageRequests } from "@/entities/triage";
import { getCurrentUser, getUsers } from "@/entities/user";
import { routes } from "@/shared/config";
import { AppTopbar } from "@/widgets/app-topbar";

import type { BoardDirectory } from "../model/directory";
import { CycleBoard, CycleBoardWithSelection } from "./cycle-board";
import { CycleHeader } from "./cycle-header";
import { TriageBanner } from "./triage-banner";

export async function CycleBoardPage({ teamId }: { teamId: string }) {
  const team = await getTeam(teamId);
  if (!team) notFound();

  const [teams, currentUser, users, labels, documents, cycle, project, triage] = await Promise.all([
    getTeams(),
    getCurrentUser(),
    getUsers(),
    getTaskLabels(),
    getTeamDocuments(team.id),
    getActiveCycle(team.id),
    getActiveProject(team.id),
    getTriageRequests(team.id),
  ]);
  const directory: BoardDirectory = { team, teams, users, currentUser, labels, documents, cycle, project };
  const header = (
    <>
      <TriageBanner teamId={team.id} requests={triage} teams={teams} />
      {cycle && <CycleHeader cycle={cycle} project={project} />}
    </>
  );

  return (
    <>
      <AppTopbar
        breadcrumb={[
          { label: team.name, href: routes.space(team.id) },
          { label: "Tareas", href: routes.tasks(team.id) },
          { label: cycle ? `Ciclo ${cycle.number}` : "Todas" },
        ]}
        presence={users.filter((user) => user.id !== currentUser.id)}
      />

      <div className="flex h-[calc(100dvh-var(--spacing-topbar))] flex-col">
        {/* `?task=` is only known on the client: the static HTML renders the board with nothing selected. */}
        <Suspense fallback={<CycleBoard directory={directory} header={header} selectedId={null} />}>
          <CycleBoardWithSelection directory={directory} header={header} />
        </Suspense>
      </div>
    </>
  );
}
