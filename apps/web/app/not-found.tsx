import Image from "next/image";
import Link from "next/link";

import { routes } from "@/shared/config/routes";
import { Button } from "@/shared/ui/button";
import { Logo } from "@/shared/ui/logo";
import { MonoTag } from "@/shared/ui/mono-tag";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-5 p-12 text-center">
      <Logo />
      <div className="relative mt-4 size-40 rotate-3 overflow-hidden rounded-[26px] bg-surface-sunken shadow-raised">
        <Image src="/mascots/base.png" alt="" fill sizes="160px" className="object-cover" />
      </div>
      <MonoTag className="self-center">Error 404</MonoTag>
      <h1 className="text-[32px] font-bold tracking-display">Esta página no existe</h1>
      <Button size="md" variant="secondary" asChild>
        <Link href={routes.login()}>Volver a Flow</Link>
      </Button>
    </main>
  );
}
