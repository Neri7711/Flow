import { notFound } from "next/navigation";

import { getRecentActivity } from "@/entities/activity";
import { getRecentDocuments } from "@/entities/document";
import { getUpcomingEvents } from "@/entities/event";
import { getActiveProject } from "@/entities/project";
import { getTaskLabels } from "@/entities/task";
import { getTeam } from "@/entities/team";
import { getCurrentUser, getUsers } from "@/entities/user";
import { now, routes } from "@/shared/config";
import { AppTopbar } from "@/widgets/app-topbar";

import { ActivityCard } from "./activity-card";
import { ProjectProgressCard } from "./project-progress-card";
import { RecentDocumentsCard } from "./recent-documents-card";
import { SpaceHero } from "./space-hero";
import { TodayTasksCard } from "./today-tasks-card";
import { UpcomingEventsCard } from "./upcoming-events-card";

export async function SpaceHomePage({ teamId }: { teamId: string }) {
  const team = await getTeam(teamId);
  if (!team) notFound();

  const [user, users, labels, events, project, documents, activity] = await Promise.all([
    getCurrentUser(),
    getUsers(),
    getTaskLabels(),
    getUpcomingEvents(team.id),
    getActiveProject(team.id),
    getRecentDocuments(team.id),
    getRecentActivity(team.id),
  ]);
  const presence = users.filter((candidate) => candidate.id !== user.id);
  const today = now().toISOString().slice(0, 10);

  return (
    <>
      <AppTopbar
        breadcrumb={[{ label: team.name, href: routes.space(team.id) }, { label: "Inicio" }]}
        presence={presence}
      />

      <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-12 pt-8 pb-14">
        <SpaceHero team={team} user={user} />

        <div className="grid gap-5 lg:grid-cols-3">
          <TodayTasksCard teamId={team.id} date={today} labels={labels} users={users} />
          <UpcomingEventsCard teamId={team.id} events={events} />
          {project && <ProjectProgressCard project={project} />}
          <RecentDocumentsCard documents={documents} users={users} className="lg:col-span-2" />
          <ActivityCard activity={activity} users={users} />
        </div>
      </main>
    </>
  );
}
