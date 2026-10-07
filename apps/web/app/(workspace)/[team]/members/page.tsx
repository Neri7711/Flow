import { MembersPage } from "@/pages/members";

export const metadata = { title: "Miembros" };

export default async function Page({ params }: PageProps<"/[team]/members">) {
  const { team } = await params;
  return <MembersPage teamId={team} />;
}
