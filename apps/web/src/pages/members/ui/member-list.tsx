"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { changeUserRole, type User, UserAvatar, type UserRole } from "@/entities/user";
import { toast } from "@/shared/lib/toast";
import { Chip } from "@/shared/ui/chip";
import { NativeSelect } from "@/shared/ui/native-select";

const ROLE_LABEL: Record<UserRole, string> = { leader: "Líder", member: "Miembro" };

type MemberListProps = {
  members: readonly User[];
  currentUserId: string;
  /** Leaders change other members' roles (never their own). */
  canManage: boolean;
};

export function MemberList({ members, currentUserId, canManage }: MemberListProps) {
  const router = useRouter();
  const [savingId, setSavingId] = useState<string | null>(null);

  const changeRole = async (member: User, role: UserRole) => {
    setSavingId(member.id);
    try {
      await changeUserRole(member.id, role);
      toast(<><b>{member.shortName}</b> ahora es {ROLE_LABEL[role].toLowerCase()}.</>);
      router.refresh();
    } catch {
      toast("No se pudo cambiar el rol.");
    } finally {
      setSavingId(null);
    }
  };

  if (members.length === 0) {
    return <p className="border-t border-subtle py-3 text-sm text-ink-muted">Este espacio todavía no tiene integrantes.</p>;
  }

  return members.map((member) => {
    const isSelf = member.id === currentUserId;
    return (
      <div key={member.id} className="flex items-center gap-3 border-t border-subtle py-3">
        <UserAvatar user={member} size={36} ring />
        <div className="flex min-w-0 flex-col gap-[3px]">
          <span className="text-sm font-medium">
            {member.name}
            {isSelf && <span className="text-ink-muted"> (tú)</span>}
          </span>
          <span className="truncate text-xs text-ink-muted">{member.email}</span>
        </div>
        <div className="ml-auto shrink-0">
          {canManage && !isSelf ? (
            <NativeSelect
              aria-label={`Rol de ${member.name}`}
              value={member.role}
              disabled={savingId === member.id}
              onChange={(event) => changeRole(member, event.target.value as UserRole)}
              className="h-9 w-[130px] px-3 text-sm"
            >
              <option value="member">{ROLE_LABEL.member}</option>
              <option value="leader">{ROLE_LABEL.leader}</option>
            </NativeSelect>
          ) : (
            <Chip size="md">{ROLE_LABEL[member.role]}</Chip>
          )}
        </div>
      </div>
    );
  });
}
