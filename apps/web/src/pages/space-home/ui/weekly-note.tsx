"use client";

import { useRouter } from "next/navigation";

import { type Team, updateWeeklyNote } from "@/entities/team";
import { toast } from "@/shared/lib/toast";
import { EditableText } from "@/shared/ui/editable-text";

type WeeklyNoteProps = {
  team: Team;
  /** Leaders of the space edit it in place; everyone else just reads it. */
  editable: boolean;
  className?: string;
};

export function WeeklyNote({ team, editable, className }: WeeklyNoteProps) {
  const router = useRouter();
  const fallback = `Todo lo de ${team.name}, en un solo lugar.`;

  const save = async (next: string) => {
    try {
      // Clearing it brings back the default line.
      await updateWeeklyNote(team.id, next === fallback ? null : next || null);
      router.refresh();
    } catch {
      toast("No se pudo guardar la nota de la semana.");
    }
  };

  return (
    <EditableText
      as="p"
      value={team.weeklyNote ?? fallback}
      onSave={save}
      label="Nota de la semana"
      editable={editable}
      allowEmpty
      className={className}
    />
  );
}
