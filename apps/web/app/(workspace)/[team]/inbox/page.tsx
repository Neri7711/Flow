import { InboxPage } from "@/pages/inbox";

export const metadata = { title: "Bandeja" };

export default async function Page({ params }: PageProps<"/[team]/inbox">) {
  const { team } = await params;
  return <InboxPage teamId={team} />;
}
