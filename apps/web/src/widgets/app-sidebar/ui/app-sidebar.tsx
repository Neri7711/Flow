import type { ReactNode } from "react";

import type { Document } from "@/entities/document";
import type { Team } from "@/entities/team";
import { type User, UserAvatar } from "@/entities/user";
import { SignOutButton } from "@/features/auth";

import { MainNav } from "./main-nav";
import { PageTree } from "./page-tree";
import { SpaceSwitcher } from "./space-switcher";
import { SpacesList } from "./spaces-list";

type AppSidebarProps = {
  team: Team;
  teams: readonly Team[];
  user: User;
  documents: readonly Document[];
  inboxCount: number;
  /** Search trigger slot (the command palette is composed in by the layout). */
  search: ReactNode;
};

const ROLE_LABEL: Record<User["role"], string> = {
  leader: "Líder de equipo",
  member: "Miembro",
};

export function AppSidebar({ team, teams, user, documents, inboxCount, search }: AppSidebarProps) {
  return (
    <aside className="sticky top-0 flex h-dvh w-sidebar shrink-0 flex-col gap-[22px] overflow-y-auto border-r border-line bg-sidebar px-3 py-4">
      <SpaceSwitcher activeTeam={team} teams={teams} />

      {search}

      <MainNav teamId={team.id} inboxCount={inboxCount} />
      <SpacesList activeTeamId={team.id} teams={teams} />
      <PageTree teamId={team.id} teamName={team.name} documents={documents} />

      <div className="mt-auto flex items-center gap-2.5 border-t border-line px-2 pt-2.5">
        <UserAvatar user={user} size={32} ring />
        <span className="flex flex-col">
          <span className="text-sm font-semibold">{user.name}</span>
          <span className="text-xs text-ink-muted">{ROLE_LABEL[user.role]}</span>
        </span>
        <SignOutButton className="ml-auto" />
      </div>
    </aside>
  );
}
