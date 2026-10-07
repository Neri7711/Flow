import { WorkspaceLayout } from "@/app/layouts/workspace-layout";
import { TEAM_IDS } from "@/entities/team";

// Only the predefined teams exist; any other slug is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return TEAM_IDS.map((team) => ({ team }));
}

export default async function Layout({ children, params }: LayoutProps<"/[team]">) {
  const { team } = await params;
  return <WorkspaceLayout teamId={team}>{children}</WorkspaceLayout>;
}
