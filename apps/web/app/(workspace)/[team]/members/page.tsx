import { ComingSoonPage } from "@/pages/coming-soon";

export const metadata = { title: "Miembros" };

export default async function Page({ params }: PageProps<"/[team]/members">) {
  const { team } = await params;
  return <ComingSoonPage teamId={team} title="Miembros" />;
}
