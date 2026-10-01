"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Eyebrow } from "@/shared/ui/eyebrow";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

type SignInFormProps = {
  /** Where to land after a (simulated) successful sign-in. */
  redirectTo: string;
};

/**
 * Institutional account + email/password sign-in.
 * Auth is simulated: any submission signs in as the fixture user.
 */
export function SignInForm({ redirectTo }: SignInFormProps) {
  const router = useRouter();
  const signIn = () => router.push(redirectTo);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    signIn();
  };

  return (
    <div className="flex flex-col gap-7">
      <Button type="button" variant="outline" size="lg" onClick={signIn}>
        <Mail className="size-[18px]" strokeWidth={1.8} />
        Continuar con cuenta institucional
      </Button>

      <div className="flex items-center gap-3">
        <span className="h-px grow bg-line-strong" />
        <Eyebrow>o con tu correo</Eyebrow>
        <span className="h-px grow bg-line-strong" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Correo</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="nombre@up.edu.mx" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" />
        </div>
        <div className="-mt-1.5 flex justify-end">
          {/* Password recovery is out of the simulated scope. */}
          <button type="button" className="cursor-pointer text-[13px] underline underline-offset-2">
            ¿Olvidaste tu contraseña?
          </button>
        </div>
        <Button type="submit" size="lg" className="font-semibold">
          Entrar
        </Button>
      </form>
    </div>
  );
}
