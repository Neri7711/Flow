import { Fragment } from "react";
import Link from "next/link";
import { ChevronRight, Ellipsis, Share } from "lucide-react";

import { type User, UserAvatar } from "@/entities/user";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Eyebrow } from "@/shared/ui/eyebrow";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type AppTopbarProps = {
  /** Last item is the current page. */
  breadcrumb: BreadcrumbItem[];
  /** People currently viewing the page. */
  presence: readonly User[];
  /** Optional metadata after the breadcrumb ("EDITADO HACE 5 MIN"). */
  meta?: string;
};

export function AppTopbar({ breadcrumb, presence, meta }: AppTopbarProps) {
  return (
    <header className="flex h-topbar shrink-0 items-center gap-3 border-b border-line px-7">
      <nav aria-label="Ruta" className="flex min-w-0 items-center gap-1.5 text-sm">
        {breadcrumb.map((item, index) => {
          const isCurrent = index === breadcrumb.length - 1;
          const className = cn("truncate", isCurrent ? "font-semibold text-ink" : "text-ink-muted");

          return (
            <Fragment key={`${item.label}-${index}`}>
              {index > 0 && <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 text-ink-muted" />}
              {item.href && !isCurrent ? (
                <Link href={item.href} className={cn(className, "hover:text-ink")}>
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isCurrent ? "page" : undefined} className={className}>
                  {item.label}
                </span>
              )}
            </Fragment>
          );
        })}
      </nav>
      {meta && <Eyebrow className="ml-2 shrink-0 text-[10px]">{meta}</Eyebrow>}

      <div className="ml-auto flex items-center gap-3">
        <div className="flex" aria-label={`${presence.length} personas viendo`}>
          {presence.map((person, index) => (
            <UserAvatar key={person.id} user={person} size={26} ring className={cn(index > 0 && "-ml-1.5")} />
          ))}
        </div>
        {/* Sharing is out of the simulated scope. */}
        <Button>
          <Share strokeWidth={1.8} />
          Compartir
        </Button>
        <Button variant="ghost" size="icon" aria-label="Más opciones">
          <Ellipsis strokeWidth={1.8} />
        </Button>
      </div>
    </header>
  );
}
