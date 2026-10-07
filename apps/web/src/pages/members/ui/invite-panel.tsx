"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";

import { createInvitation, type Invitation, revokeInvitation } from "@/entities/invitation";
import type { UserRole } from "@/entities/user";
import { routes } from "@/shared/config";
import { formatRelative } from "@/shared/lib/format-date";
import { toast } from "@/shared/lib/toast";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader, CardTitle } from "@/shared/ui/card";
import { Eyebrow } from "@/shared/ui/eyebrow";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { NativeSelect } from "@/shared/ui/native-select";

/** Leaders: invite someone and share the one-time link; pending invitations can be revoked. */
export function InvitePanel({ invitations }: { invitations: readonly Invitation[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("member");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** The link is only known right after creating the invitation. */
  const [link, setLink] = useState<{ name: string; url: string } | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !email.trim() || sending) return;

    setSending(true);
    setError(null);
    try {
      const { invitation, token } = await createInvitation({ name: name.trim(), email: email.trim(), role });
      setLink({ name: invitation.name, url: `${window.location.origin}${routes.invite(token)}` });
      setName("");
      setEmail("");
      router.refresh();
    } catch {
      setError("No se pudo crear la invitación. Revisa el correo: puede que esa persona ya tenga cuenta.");
    } finally {
      setSending(false);
    }
  };

  const copyLink = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link.url);
    toast(<>Enlace para <b>{link.name}</b> copiado.</>);
  };

  const revoke = async (invitation: Invitation) => {
    try {
      await revokeInvitation(invitation.id);
      toast(<>Invitación de <b>{invitation.name}</b> revocada.</>);
      router.refresh();
    } catch {
      toast("No se pudo revocar la invitación.");
    }
  };

  return (
    <Card>
      <CardTitle className="mb-1">Invitar a alguien</CardTitle>
      <p className="mb-4 text-sm text-ink-muted">Genera un enlace de un solo uso (vale 7 días) para que elija su contraseña.</p>

      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="invite-name">Nombre</Label>
          <Input id="invite-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Sofía Ramírez" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="invite-email">Correo</Label>
          <Input
            id="invite-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nombre@up.edu.mx"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="invite-role">Rol</Label>
          <NativeSelect id="invite-role" value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
            <option value="member">Miembro</option>
            <option value="leader">Líder</option>
          </NativeSelect>
        </div>
        <Button type="submit" size="md" className="h-12 self-end" disabled={!name.trim() || !email.trim() || sending}>
          Crear invitación
        </Button>
      </form>

      {error && (
        <p role="alert" className="mt-3 text-sm text-ink-muted">
          {error}
        </p>
      )}

      {link && (
        <div className="mt-4 flex items-center gap-3 rounded-[14px] bg-team-soft py-2.5 pr-2.5 pl-4">
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-team-ink">{link.url}</span>
          <Button variant="outline" onClick={copyLink}>
            <Copy strokeWidth={1.8} />
            Copiar enlace
          </Button>
        </div>
      )}

      {invitations.length > 0 && (
        <section className="mt-5">
          <CardHeader>
            <Eyebrow>Pendientes</Eyebrow>
          </CardHeader>
          {invitations.map((invitation) => (
            <div key={invitation.id} className="flex items-center gap-3 border-t border-subtle py-2.5">
              <div className="flex min-w-0 flex-col gap-[3px]">
                <span className="text-sm font-medium">{invitation.name}</span>
                <span className="truncate text-xs text-ink-muted">
                  {invitation.email} · {invitation.role === "leader" ? "Líder" : "Miembro"} · {formatRelative(invitation.createdAt)}
                </span>
              </div>
              <Button variant="ghost" className="ml-auto" onClick={() => revoke(invitation)}>
                Revocar
              </Button>
            </div>
          ))}
        </section>
      )}
    </Card>
  );
}
