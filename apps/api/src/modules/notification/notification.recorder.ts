import type { NotificationKind, Prisma, PrismaClient } from "@prisma/client";

import { now } from "@/shared/clock";

type Db = PrismaClient | Prisma.TransactionClient;

const EXCERPT_LENGTH = 140;

export type NotifyInput = {
  /** May contain the actor, duplicates or nulls: they're filtered out. */
  recipients: Iterable<string | null | undefined>;
  actorId: string;
  kind: NotificationKind;
  title: string;
  excerpt?: string | null;
  taskId?: string;
  documentId?: string;
};

/** Writes inbox entries inside the caller's transaction. Nobody is notified about their own actions. */
export async function notify(db: Db, { recipients, actorId, excerpt, ...rest }: NotifyInput): Promise<void> {
  const userIds = [...new Set([...recipients].filter((id): id is string => Boolean(id) && id !== actorId))];
  if (userIds.length === 0) return;

  const snippet = excerpt?.replace(/\s+/g, " ").trim();
  const createdAt = now();
  await db.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      actorId,
      createdAt,
      excerpt: snippet ? (snippet.length > EXCERPT_LENGTH ? `${snippet.slice(0, EXCERPT_LENGTH - 1)}…` : snippet) : null,
      ...rest,
    })),
  });
}

/** Short name used in notification titles ("Ana te asignó PL-42"). */
export async function nameOf(db: Db, userId: string): Promise<string> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { shortName: true } });
  return user?.shortName ?? "Alguien";
}

const MENTION = /@([\p{L}\p{N}][\p{L}\p{N}._-]*)/gu;

/** People mentioned as `@Ana` in plain text (matched by short name, ignoring case). */
export async function mentionedUserIds(db: Db, text: string): Promise<string[]> {
  const names = new Set([...text.matchAll(MENTION)].map(([, name]) => name.toLocaleLowerCase("es")));
  if (names.size === 0) return [];
  const users = await db.user.findMany({ select: { id: true, shortName: true } });
  return users.filter((user) => names.has(user.shortName.toLocaleLowerCase("es"))).map((user) => user.id);
}
