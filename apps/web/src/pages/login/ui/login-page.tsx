import { getTeams } from "@/entities/team";
import { getCurrentUser } from "@/entities/user";
import { CurvedStripes } from "@/shared/ui/brand-stripes";
import { Eyebrow } from "@/shared/ui/eyebrow";
import { Logo } from "@/shared/ui/logo";
import { MonoTag } from "@/shared/ui/mono-tag";

import { SignInForm } from "./sign-in-form";
import { TeamShowcaseCard } from "./team-showcase-card";

/** Slight, alternating tilt per card, as in the design. */
const CARD_TILTS = ["-rotate-3", "rotate-[2.5deg]", "rotate-2", "-rotate-[2.5deg]"];

export async function LoginPage() {
  const [teams, user] = await Promise.all([getTeams(), getCurrentUser()]);

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)]">
      <main className="flex flex-col justify-between gap-10 px-6 py-10 sm:px-12 lg:px-[72px] lg:py-12">
        <Logo />

        <div className="flex w-full max-w-[400px] flex-col gap-7">
          <div className="flex flex-col gap-3.5">
            <MonoTag>Iniciar sesión</MonoTag>
            <h1 className="text-[46px] leading-[1.02] font-bold tracking-[-0.035em]">Bienvenido de vuelta</h1>
            <p className="font-serif text-2xl text-ink-muted italic">Tu equipo te está esperando.</p>
          </div>

          <SignInForm redirectTo={`/${user.teamId}`} />

          <p className="text-sm text-ink-muted">¿Eres nuevo? Pide acceso a tu líder de equipo.</p>
        </div>

        <Eyebrow>Hecho por estudiantes · Universidad Panamericana</Eyebrow>
      </main>

      <section
        aria-label="Equipos"
        className="relative m-4 hidden overflow-hidden rounded-[28px] bg-night text-cream lg:block"
      >
        <CurvedStripes className="absolute top-0 right-11 bottom-11 left-0" />

        <div className="relative flex h-full flex-col gap-10 pt-14 pr-32 pb-32 pl-14">
          <div className="flex flex-col gap-[18px]">
            <MonoTag>{teams.length} equipos · un espacio</MonoTag>
            <h2 className="text-[40px] leading-[1.08] font-bold tracking-display">
              Donde los proyectos de Panteras{" "}
              <span className="font-serif text-[46px] font-normal italic">toman forma.</span>
            </h2>
          </div>

          <div className="grid max-w-[520px] grid-cols-2 gap-[22px]">
            {teams.map((team, index) => (
              <TeamShowcaseCard key={team.id} team={team} className={CARD_TILTS[index % CARD_TILTS.length]} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
