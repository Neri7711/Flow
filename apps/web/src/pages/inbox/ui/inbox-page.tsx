import { notFound } from "next/navigation";

import { getTeam, getTeams } from "@/entities/team";
import { getTriageRequests } from "@/entities/triage";
import { getCurrentUser, getUsers } from "@/entities/user";
import { routes } from "@/shared/config";
import { Card, CardHeader, CardTitle } from "@/shared/ui/card";
import { Eyebrow } from "@/shared/ui/eyebrow";
import { AppTopbar } from "@/widgets/app-topbar";

import { RequestList } from "./request-list";
import { SendRequestForm } from "./send-request-form";

/** Requests other teams sent to this space, and a way to ask another team for something. */
export async function InboxPage({ teamId }: { teamId: string }) {
  const team = await getTeam(teamId);
  if (!team) notFound();

  const [teams, user, users, requests] = await Promise.all([
    getTeams(),
    getCurrentUser(),
    getUsers(),
    getTriageRequests(team.id),
  ]);
  const canDecide = user.role === "leader" && user.teamId === team.id;

  return (
    <>
      <AppTopbar
        breadcrumb={[{ label: team.name, href: routes.space(team.id) }, { label: "Bandeja" }]}
        presence={users.filter((candidate) => candidate.id !== user.id)}
      />

      <main className="mx-auto flex w-full max-w-[880px] flex-col gap-6 px-12 pt-8 pb-14">
        <header className="flex flex-col gap-2">
          <Eyebrow>Bandeja · {team.name}</Eyebrow>
          <h1 className="text-[32px] leading-[1.1] font-bold tracking-display">Solicitudes</h1>
          <p className="font-serif text-xl text-ink-muted italic">Lo que otros equipos le piden a {team.name}.</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Pendientes</CardTitle>
            <Eyebrow>{requests.length}</Eyebrow>
          </CardHeader>
          <RequestList requests={requests} teams={teams} users={users} canDecide={canDecide} teamName={team.name} />
        </Card>

        <Card>
          <CardTitle className="mb-1">Pedir algo a otro equipo</CardTitle>
          <p className="mb-4 text-sm text-ink-muted">Llega a la bandeja del equipo; uno de sus líderes decide si se vuelve tarea.</p>
          <SendRequestForm
            teams={teams.filter((candidate) => candidate.id !== user.teamId)}
            defaultTeamId={team.id !== user.teamId ? team.id : undefined}
          />
        </Card>
      </main>
    </>
  );
}
