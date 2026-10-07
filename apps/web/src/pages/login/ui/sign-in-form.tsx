"use client";

import { useActionState, useState } from "react";
import { Mail } from "lucide-react";

import { type SignInState, signIn } from "@/features/auth";
import { Button } from "@/shared/ui/button";
import { Eyebrow } from "@/shared/ui/eyebrow";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

const INITIAL_STATE: SignInState = { error: null, email: "" };

/** Institutional account + email/password sign-in. */
export function SignInForm() {
  const [state, formAction, pending] = useActionState(signIn, INITIAL_STATE);
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-7">
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={() =>
          // Needs the university to register Flow with its identity provider; until then, email + password.
          setNotice("El acceso con cuenta institucional todavía no está habilitado. Entra con tu correo y contraseña.")
        }
      >
        <Mail className="size-[18px]" strokeWidth={1.8} />
        Continuar con cuenta institucional
      </Button>

      <div className="flex items-center gap-3">
        <span className="h-px grow bg-line-strong" />
        <Eyebrow>o con tu correo</Eyebrow>
        <span className="h-px grow bg-line-strong" />
      </div>

      <form action={formAction} className="flex flex-col gap-[18px]">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Correo</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nombre@up.edu.mx"
            defaultValue={state.email}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" name="password" type="password" autoComplete="current-password" placeholder="••••••••" required />
        </div>
        <div className="-mt-1.5 flex justify-end">
          {/* Password recovery needs an email service; not available yet. */}
          <button type="button" className="cursor-pointer text-[13px] underline underline-offset-2">
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        {(state.error ?? notice) && (
          <p role="alert" className="text-sm text-ink-muted">
            {state.error ?? notice}
          </p>
        )}

        <Button type="submit" size="lg" className="font-semibold" disabled={pending}>
          {pending ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
