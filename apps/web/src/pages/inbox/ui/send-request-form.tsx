"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import type { Team } from "@/entities/team";
import { createTriageRequest } from "@/entities/triage";
import { toast } from "@/shared/lib/toast";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { NativeSelect } from "@/shared/ui/native-select";

type SendRequestFormProps = {
  /** Teams you can ask (not your own). */
  teams: readonly Team[];
  defaultTeamId?: string;
};

export function SendRequestForm({ teams, defaultTeamId }: SendRequestFormProps) {
  const router = useRouter();
  const [toTeamId, setToTeamId] = useState(defaultTeamId ?? teams[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || !toTeamId || sending) return;

    setSending(true);
    try {
      await createTriageRequest(toTeamId, trimmed);
      const team = teams.find((candidate) => candidate.id === toTeamId);
      toast(<>Solicitud enviada a <b>{team?.name}</b>.</>);
      setTitle("");
      router.refresh();
    } catch {
      toast("No se pudo enviar la solicitud.");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="request-team">Equipo</Label>
        <NativeSelect id="request-team" value={toTeamId} onChange={(event) => setToTeamId(event.target.value)}>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="request-title">¿Qué necesitas?</Label>
        <Input
          id="request-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ej. Revisar el build de Windows"
        />
      </div>
      <Button type="submit" variant="secondary" className="self-start" disabled={!title.trim() || sending}>
        Enviar solicitud
      </Button>
    </form>
  );
}
