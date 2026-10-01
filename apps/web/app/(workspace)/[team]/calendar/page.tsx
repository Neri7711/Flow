import { ComingSoonPage } from "@/pages/coming-soon";

export const metadata = { title: "Calendario" };

export default async function Page({ params }: PageProps<"/[team]/calendar">) {
  const { team } = await params;
  return <ComingSoonPage teamId={team} title="Calendario" />;
}
