"use client";

import { useActionState } from "react";

import { acceptInvitation, type AcceptInvitationState } from "@/features/auth";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

const INITIAL_STATE: AcceptInvitationState = { error: null };

export function AcceptInvitationForm({ token, email }: { token: string; email: string }) {
  const [state, formAction, pending] = useActionState(acceptInvitation, INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-[18px]">
      <input type="hidden" name="token" value={token} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="invite-email">Correo</Label>
        <Input id="invite-email" type="email" value={email} readOnly autoComplete="username" className="text-ink-muted" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="invite-password">Contraseña</Label>
        <Input id="invite-password" name="password" type="password" autoComplete="new-password" minLength={8} required placeholder="Al menos 8 caracteres" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="invite-confirm">Repite la contraseña</Label>
        <Input id="invite-confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-ink-muted">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" className="font-semibold" disabled={pending}>
        {pending ? "Creando tu cuenta…" : "Entrar a Flow"}
      </Button>
    </form>
  );
}
