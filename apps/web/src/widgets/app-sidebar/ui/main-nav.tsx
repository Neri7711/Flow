"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, House, Inbox, type LucideIcon, SquareCheck, Users } from "lucide-react";

import { useTaskStore } from "@/entities/task";
import { routes } from "@/shared/config";
import { cn } from "@/shared/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  count?: number;
  /** Home only matches its exact path; sections also match nested paths. */
  exact?: boolean;
};

type MainNavProps = {
  teamId: string;
  inboxCount: number;
};

export function MainNav({ teamId, inboxCount }: MainNavProps) {
  // `null` is only possible under the Pages Router; this is always an App Router route.
  const pathname = usePathname() ?? "";
  const openTaskCount = useTaskStore(
    (state) => Object.values(state.tasks).filter((task) => task.teamId === teamId && task.status !== "done").length,
  );

  const items: NavItem[] = [
    { label: "Inicio", href: routes.space(teamId), icon: House, exact: true },
    { label: "Bandeja", href: routes.inbox(teamId), icon: Inbox, count: inboxCount },
    { label: "Calendario", href: routes.calendar(teamId), icon: Calendar },
    { label: "Tareas", href: routes.tasks(teamId), icon: SquareCheck, count: openTaskCount },
    { label: "Miembros", href: routes.members(teamId), icon: Users },
  ];

  return (
    <nav aria-label="Principal" className="flex flex-col gap-0.5">
      {items.map(({ label, href, icon: Icon, count, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex h-[34px] items-center gap-2.5 rounded-[10px] px-2.5 text-sm font-medium transition-colors",
              isActive ? "bg-surface font-semibold shadow-[0_1px_2px_rgb(42_36_32/0.08)]" : "hover:bg-surface/60",
            )}
          >
            <Icon className="size-4" strokeWidth={1.8} />
            <span>{label}</span>
            {count ? <span className="ml-auto font-mono text-[11px] text-ink-muted">{count}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
