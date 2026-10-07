import Link from "next/link";

import { getInvitationPreview } from "@/entities/invitation";
import { routes } from "@/shared/config";
import { Button } from "@/shared/ui/button";
import { Logo } from "@/shared/ui/logo";
import { MonoTag } from "@/shared/ui/mono-tag";

import { AcceptInvitationForm } from "./accept-invitation-form";

/** Where an invited person chooses a password; the account is created on submit. */
export async function InvitePage({ token }: { token: string }) {
  const preview = await getInvitationPreview(token);

  return (
    <main data-team={preview?.teamId} className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col justify-center gap-8 px-6 py-12">
      <Logo />

      {preview ? (
        <div className="flex flex-col gap-7">
          <div className="flex flex-col gap-3.5">
            <MonoTag>Invitación · {preview.teamName}</MonoTag>
            <h1 className="text-[40px] leading-[1.05] font-bold tracking-[-0.035em]">Únete a {preview.teamName}</h1>
            <p className="font-serif text-xl text-ink-muted italic">
              Hola, {preview.name.split(/\s+/)[0]}. Elige una contraseña para entrar como{" "}
              {preview.role === "leader" ? "líder" : "miembro"}.
            </p>
          </div>
          <AcceptInvitationForm token={token} email={preview.email} />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <MonoTag className="self-start">Invitación</MonoTag>
          <h1 className="text-[34px] leading-[1.08] font-bold tracking-display">Este enlace ya no funciona</h1>
          <p className="font-serif text-xl text-ink-muted italic">Ya se usó, expiró o fue revocado. Pide a tu líder que te mande otro.</p>
          <Button size="md" variant="secondary" className="self-start" asChild>
            <Link href={routes.login()}>Ir a iniciar sesión</Link>
          </Button>
        </div>
      )}
    </main>
  );
}
