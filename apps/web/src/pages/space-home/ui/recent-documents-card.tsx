import Link from "next/link";
import { File } from "lucide-react";

import type { Document } from "@/entities/document";
import { type User, UserAvatar } from "@/entities/user";
import { routes } from "@/shared/config";
import { formatRelative } from "@/shared/lib/format-date";
import { cn } from "@/shared/lib/utils";
import { Card, CardHeader, CardTitle } from "@/shared/ui/card";

type RecentDocumentsCardProps = {
  documents: readonly Document[];
  users: readonly User[];
  className?: string;
};

export function RecentDocumentsCard({ documents, users, className }: RecentDocumentsCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="mb-2">
        <CardTitle>Documentos recientes</CardTitle>
        <span className="text-[13px]">Ver todos</span>
      </CardHeader>

      <div className="grid gap-1 sm:grid-cols-2">
        {documents.map((doc) => {
          const editor = users.find((user) => user.id === doc.updatedById);

          return (
            <Link
              key={doc.id}
              href={routes.document(doc.teamId, doc.id)}
              className={cn("flex items-center gap-3.5 rounded-[14px] p-3 transition-colors hover:bg-surface-sunken")}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-team-soft text-team-strong">
                <File className="size-4" strokeWidth={1.8} />
              </span>
              <span className="flex min-w-0 flex-col gap-[3px]">
                <span className="truncate text-sm font-medium">{doc.title}</span>
                <span className="font-mono text-[10px] tracking-[0.06em] text-ink-muted uppercase">
                  Editado {formatRelative(doc.updatedAt)}
                </span>
              </span>
              {editor && <UserAvatar user={editor} size={26} ring className="ml-auto" />}
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
