import type { ReactNode } from "react";

import type { Document } from "@/entities/document";
import { type User, UserAvatar } from "@/entities/user";
import { formatDayMonth } from "@/shared/lib/format-date";
import { Eyebrow } from "@/shared/ui/eyebrow";

type DocumentPropertiesProps = {
  document: Document;
  users: readonly User[];
};

const yearFormat = new Intl.DateTimeFormat("es-MX", { year: "numeric", timeZone: "America/Mexico_City" });

export function DocumentProperties({ document, users }: DocumentPropertiesProps) {
  const { status, ownerId, tags } = document.properties ?? {};
  const owner = users.find((user) => user.id === ownerId);

  return (
    <dl className="grid grid-cols-[150px_minmax(0,1fr)] gap-y-1 border-b border-line pb-5">
      {status && (
        <Property label="Estado">
          <span className="flex items-center gap-1.5 rounded-full bg-team-soft px-2.5 py-1 text-[13px] font-medium text-team-strong">
            <span className="size-[7px] rounded-full bg-team-strong" />
            {status}
          </span>
        </Property>
      )}
      {owner && (
        <Property label="Responsable">
          <UserAvatar user={owner} size={24} ring />
          {owner.name}
        </Property>
      )}
      {tags && tags.length > 0 && (
        <Property label="Etiquetas">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full border border-line px-2.5 py-[3px] text-[13px]">
              {tag}
            </span>
          ))}
        </Property>
      )}
      <Property label="Actualizado">
        {formatDayMonth(document.updatedAt)} {yearFormat.format(new Date(document.updatedAt))}
      </Property>
    </dl>
  );
}

function Property({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="flex h-9 items-center">
        <Eyebrow>{label}</Eyebrow>
      </dt>
      <dd className="flex min-h-9 flex-wrap items-center gap-2 text-sm">{children}</dd>
    </>
  );
}
