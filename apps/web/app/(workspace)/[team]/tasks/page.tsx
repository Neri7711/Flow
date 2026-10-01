import type { Metadata } from "next";

import { getTeam } from "@/entities/team";
import { CycleBoardPage } from "@/pages/cycle-board";

export async function generateMetadata({ params }: PageProps<"/[team]/tasks">): Promise<Metadata> {
  const team = await getTeam((await params).team);
  return { title: team ? `Tareas · ${team.name}` : "Tareas" };
}

export default async function Page({ params }: PageProps<"/[team]/tasks">) {
  const { team } = await params;
  return <CycleBoardPage teamId={team} />;
}
