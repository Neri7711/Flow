import { ComingSoonPage } from "@/pages/coming-soon";

export const metadata = { title: "Bandeja" };

export default async function Page({ params }: PageProps<"/[team]/inbox">) {
  const { team } = await params;
  return <ComingSoonPage teamId={team} title="Bandeja" />;
}
