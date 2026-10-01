import type { Metadata } from "next";

import { getTeam } from "@/entities/team";
import { SpaceHomePage } from "@/pages/space-home";

export async function generateMetadata({ params }: PageProps<"/[team]">): Promise<Metadata> {
  const team = await getTeam((await params).team);
  return { title: team ? `Inicio · ${team.name}` : "Inicio" };
}

export default async function Page({ params }: PageProps<"/[team]">) {
  const { team } = await params;
  return <SpaceHomePage teamId={team} />;
}
