import { WorkspaceLayout } from "@/app/layouts/workspace-layout";
import { getTeams } from "@/entities/team";

// Only the predefined teams exist; any other slug is a 404.
export const dynamicParams = false;

export async function generateStaticParams() {
  const teams = await getTeams();
  return teams.map((team) => ({ team: team.id }));
}

export default async function Layout({ children, params }: LayoutProps<"/[team]">) {
  const { team } = await params;
  return <WorkspaceLayout teamId={team}>{children}</WorkspaceLayout>;
}
