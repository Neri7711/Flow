import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getTeam } from "@/entities/team";
import { getCurrentUser, getUsers } from "@/entities/user";
import { routes } from "@/shared/config";
import { Button } from "@/shared/ui/button";
import { MonoTag } from "@/shared/ui/mono-tag";
import { AppTopbar } from "@/widgets/app-topbar";

type ComingSoonPageProps = {
  teamId: string;
  title: string;
};

/** Empty state for sections that appear in the navigation but have no design yet. */
export async function ComingSoonPage({ teamId, title }: ComingSoonPageProps) {
  const team = await getTeam(teamId);
  if (!team) notFound();

  const [user, users] = await Promise.all([getCurrentUser(), getUsers()]);

  return (
    <>
      <AppTopbar
        breadcrumb={[{ label: team.name, href: routes.space(team.id) }, { label: title }]}
        presence={users.filter((candidate) => candidate.id !== user.id)}
      />
      <main className="flex flex-1 flex-col items-center justify-center gap-5 p-12 text-center">
        <div className="relative size-40 -rotate-3 overflow-hidden rounded-[26px] bg-team shadow-raised">
          <Image src={`/mascots/${team.id}.png`} alt="" fill sizes="160px" className="object-cover" />
        </div>
        <MonoTag className="self-center">Próximamente</MonoTag>
        <h1 className="text-[32px] font-bold tracking-display">{title}</h1>
        <p className="max-w-sm font-serif text-xl text-ink-muted italic">
          Esta sección todavía se está diseñando.
        </p>
        <Button size="md" variant="secondary" asChild>
          <Link href={routes.space(team.id)}>Volver al inicio</Link>
        </Button>
      </main>
    </>
  );
}
