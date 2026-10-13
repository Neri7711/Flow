"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search, ShieldCheck, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import { changeUserRole, type User, UserAvatar, type UserRole } from "@/entities/user";
import { toast } from "@/shared/lib/toast";
import { normalize } from "@/shared/lib/text-match";
import { cn } from "@/shared/lib/utils";
import { AnimatedNumber } from "@/shared/ui/animated-number";
import { Chip } from "@/shared/ui/chip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Input } from "@/shared/ui/input";

const ROLE_LABEL: Record<UserRole, string> = { leader: "Líder", member: "Miembro" };
const ROLE_ORDER: Record<UserRole, number> = { leader: 0, member: 1 };

type RoleFilter = "all" | UserRole;

type MemberListProps = {
  members: readonly User[];
  currentUserId: string;
  /** Leaders change other members' roles (never their own). */
  canManage: boolean;
  teamName: string;
};

/** Dense, keyboard-friendly directory for the people in a space. */
export function MemberList({ members, currentUserId, canManage, teamName }: MemberListProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [savingId, setSavingId] = useState<string | null>(null);

  const orderedMembers = useMemo(
    () =>
      [...members].sort((left, right) => {
        if (left.id === currentUserId) return -1;
        if (right.id === currentUserId) return 1;

        const roleDifference = ROLE_ORDER[left.role] - ROLE_ORDER[right.role];
        return roleDifference || left.name.localeCompare(right.name, "es", { sensitivity: "base" });
      }),
    [currentUserId, members],
  );

  const visibleMembers = useMemo(() => {
    const search = normalize(query.trim());
    return orderedMembers.filter(
      (member) =>
        (roleFilter === "all" || member.role === roleFilter) &&
        (!search || normalize(member.name).includes(search) || normalize(member.email).includes(search)),
    );
  }, [orderedMembers, query, roleFilter]);

  const leaders = members.filter((member) => member.role === "leader").length;
  const regularMembers = members.length - leaders;

  const changeRole = async (member: User, role: UserRole) => {
    if (role === member.role || savingId) return;

    setSavingId(member.id);
    try {
      await changeUserRole(member.id, role);
      toast(
        <>
          <b>{member.shortName}</b> ahora es {ROLE_LABEL[role].toLowerCase()}.
        </>,
      );
      router.refresh();
    } catch {
      toast("No se pudo cambiar el rol.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      <section aria-label="Roles del espacio" className="grid gap-3 sm:grid-cols-2">
        <RoleCard
          icon={<ShieldCheck aria-hidden="true" className="size-[17px]" />}
          iconClassName="bg-team-soft text-team-strong"
          label="Líder"
          count={leaders}
          description="Acepta solicitudes, aprueba tareas en revisión y gestiona los ciclos del espacio."
        />
        <RoleCard
          icon={<UserRound aria-hidden="true" className="size-[17px]" />}
          iconClassName="bg-subtle text-ink"
          label="Miembro"
          count={regularMembers}
          description="Crea y edita páginas, tareas y eventos. Comenta y menciona a otros equipos."
        />
      </section>

      <section aria-label="Buscar y filtrar miembros" className="flex flex-wrap items-center gap-2.5">
        <div className="relative w-full sm:w-[280px]">
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-[15px] -translate-y-1/2 text-ink-muted" />
          <Input
            aria-label="Buscar miembros"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar miembros"
            className="h-[38px] rounded-xl py-0 pr-3 pl-9 text-sm"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex h-[34px] cursor-pointer items-center gap-1.5 rounded-full border border-line bg-transparent px-3 text-[13px] text-ink outline-none transition-colors hover:bg-surface-sunken focus-visible:ring-3 focus-visible:ring-ring/25"
            >
              Rol: {roleFilter === "all" ? "todos" : ROLE_LABEL[roleFilter].toLowerCase()}
              <ChevronDown aria-hidden="true" className="size-[13px] text-ink-muted" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-36">
            <DropdownMenuRadioGroup value={roleFilter} onValueChange={(value) => setRoleFilter(value as RoleFilter)}>
              <DropdownMenuRadioItem value="all">Todos</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="leader">Líderes</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="member">Miembros</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </section>

      <section role="table" aria-label={`Miembros de ${teamName}`} className="overflow-hidden rounded-[18px] border border-line bg-surface">
        <div role="row" className="grid grid-cols-[minmax(0,1fr)_140px] items-center gap-3 bg-surface-sunken/45 px-4 py-2.5">
          <span role="columnheader" className="font-mono text-[11px] tracking-label text-ink-muted uppercase">Nombre</span>
          <span role="columnheader" className="font-mono text-[11px] tracking-label text-ink-muted uppercase">Rol</span>
        </div>

        {visibleMembers.length > 0 ? (
          <div role="rowgroup">
            {visibleMembers.map((member) => {
              const isSelf = member.id === currentUserId;
              const canChangeRole = canManage && !isSelf;

              return (
                <div
                  key={member.id}
                  role="row"
                  className="grid grid-cols-[minmax(0,1fr)_140px] items-center gap-3 border-t border-subtle px-4 py-2.5 transition-colors hover:bg-surface-sunken/60"
                >
                  <div role="cell" className="flex min-w-0 items-center gap-3">
                    <UserAvatar user={member} size={34} ring />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="flex items-center gap-2 truncate text-sm font-medium">
                        <span className="truncate">{member.name}</span>
                        {isSelf && <Chip className="px-1.5 py-[2px] text-[9px]" title="Tu cuenta">Tú</Chip>}
                      </span>
                      <span className="truncate text-xs text-ink-muted">{member.email}</span>
                    </div>
                  </div>
                  <div role="cell" className="justify-self-start">
                    {canChangeRole ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild disabled={savingId === member.id}>
                          <button
                            type="button"
                            aria-label={`Cambiar rol de ${member.name}`}
                            className={roleButtonClass(member.role)}
                          >
                            {savingId === member.id ? "Guardando…" : ROLE_LABEL[member.role]}
                            <ChevronDown aria-hidden="true" className="size-[13px]" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-32">
                          <DropdownMenuRadioGroup value={member.role} onValueChange={(role) => void changeRole(member, role as UserRole)}>
                            <DropdownMenuRadioItem value="leader">Líder</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="member">Miembro</DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Chip className={cn("h-[30px] px-3 py-0 text-[11px] normal-case", member.role === "leader" && "bg-team-soft text-team-strong")}>
                        {ROLE_LABEL[member.role]}
                      </Chip>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border-t border-subtle px-4 py-10 text-center">
            <p className="text-sm font-medium">No encontramos miembros que coincidan.</p>
            <p className="mt-1 text-sm text-ink-muted">Prueba con otro nombre, correo o filtro de rol.</p>
          </div>
        )}
      </section>
    </>
  );
}

function RoleCard({
  icon,
  iconClassName,
  label,
  count,
  description,
}: {
  icon: React.ReactNode;
  iconClassName: string;
  label: string;
  count: number;
  description: string;
}) {
  return (
    <article className="flex flex-col gap-2.5 rounded-[18px] border border-line bg-surface px-[18px] py-4">
      <div className="flex items-center gap-2.5">
        <span className={cn("flex size-[34px] items-center justify-center rounded-[10px]", iconClassName)}>{icon}</span>
        <h2 className="text-[15px] font-semibold">{label}</h2>
        <AnimatedNumber value={count} className="ml-auto font-mono text-[11px] text-ink-muted" />
      </div>
      <p className="text-[13px] leading-5 text-ink-muted">{description}</p>
    </article>
  );
}

function roleButtonClass(role: UserRole) {
  return cn(
    "inline-flex h-[30px] cursor-pointer items-center gap-1.5 rounded-full px-3 text-[13px] font-medium outline-none transition-[color,background-color,scale] active:scale-[0.97] focus-visible:ring-3 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-50",
    role === "leader" ? "bg-team-soft text-team-strong" : "bg-subtle text-ink",
  );
}
