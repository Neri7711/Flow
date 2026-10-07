import { CalendarPage } from "@/pages/calendar";

export const metadata = { title: "Calendario" };

export default async function Page({ params, searchParams }: PageProps<"/[team]/calendar">) {
  const [{ team }, { month }] = await Promise.all([params, searchParams]);
  return <CalendarPage teamId={team} month={typeof month === "string" ? month : undefined} />;
}
