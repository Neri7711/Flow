import type { Prisma, PrismaClient } from "@prisma/client";

import { now } from "@/shared/clock";

type Db = PrismaClient | Prisma.TransactionClient;

export type ActivityInput = {
  teamId: string;
  actorId: string;
  /** Rendered after the actor's name in the feed ("completó PL-42"). */
  summary: string;
};

/** The feed entry, as a Prisma operation so it can join the caller's transaction. */
export function recordActivity(db: Db, { teamId, actorId, summary }: ActivityInput) {
  return db.activity.create({ data: { teamId, actorId, summary, at: now() } });
}
