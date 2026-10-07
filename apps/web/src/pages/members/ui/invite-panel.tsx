"use client";

import { type FormEvent, useState } from "react";
import { Copy, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { createInvitation, type Invitation, revokeInvitation } from "@/entities/invitation";
import type { UserRole } from "@/entities/user";
import { routes } from "@/shared/config";
import { formatRelative } from "@/shared/lib/format-date";
import { toast } from "@/shared/lib/toast";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { Eyebrow } from "@/shared/ui/eyebrow";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { NativeSelect } from "@/shared/ui/native-select";

/** Leaders open this dialog to create, copy, and revoke one-time invitations. */
export function InvitePanel({ invitations }: { invitations: readonly Invitation[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("member");
  const [sending, setSending] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
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

    try {
      await navigator.clipboard.writeText(link.url);
      toast(
        <>
          Enlace para <b>{link.name}</b> copiado.
        </>,
      );
    } catch {
      toast("No se pudo copiar el enlace.");
    }
  };

  const revoke = async (invitation: Invitation) => {
    setRevokingId(invitation.id);
    try {
      await revokeInvitation(invitation.id);
      toast(
        <>
          Invitación de <b>{invitation.name}</b> revocada.
        </>,
      );
      router.refresh();
    } catch {
      toast("No se pudo revocar la invitación.");
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="md">
          <Plus aria-hidden="true" strokeWidth={1.8} />
          Invitar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(720px,calc(100dvh-2rem))] gap-5 overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-display">Invitar a alguien</DialogTitle>
          <DialogDescription>Genera un enlace de un solo uso (vale 7 días) para que elija su contraseña.</DialogDescription>
        </DialogHeader>

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
            {sending ? "Creando…" : "Crear invitación"}
          </Button>
        </form>

        {error && (
          <p role="alert" className="text-sm text-ink-muted">
            {error}
          </p>
        )}

        {link && (
          <div className="flex items-center gap-3 rounded-[14px] bg-team-soft py-2.5 pr-2.5 pl-4">
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-team-ink">{link.url}</span>
            <Button variant="outline" onClick={copyLink}>
              <Copy aria-hidden="true" strokeWidth={1.8} />
              Copiar enlace
            </Button>
          </div>
        )}

        {invitations.length > 0 && (
          <section className="border-t border-subtle pt-4" aria-labelledby="pending-invitations-title">
            <Eyebrow id="pending-invitations-title">Pendientes</Eyebrow>
            <div className="mt-2">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center gap-3 border-t border-subtle py-2.5 first:border-t-0">
                  <div className="flex min-w-0 flex-col gap-[3px]">
                    <span className="text-sm font-medium">{invitation.name}</span>
                    <span className="truncate text-xs text-ink-muted" suppressHydrationWarning>
                      {invitation.email} · {invitation.role === "leader" ? "Líder" : "Miembro"} · {formatRelative(invitation.createdAt)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    className="ml-auto"
                    onClick={() => void revoke(invitation)}
                    disabled={revokingId === invitation.id}
                  >
                    {revokingId === invitation.id ? "Revocando…" : "Revocar"}
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}
      </DialogContent>
    </Dialog>
  );
}
