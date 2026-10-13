import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import type { NotificationDto } from "@/contracts";
import { PrismaService } from "@/prisma/prisma.service";
import { now } from "@/shared/clock";

const include = {
  task: { select: { teamId: true } },
  document: { select: { teamId: true } },
} satisfies Prisma.NotificationInclude;

type NotificationWithTeam = Prisma.NotificationGetPayload<{ include: typeof include }>;

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  /** The user's inbox, newest first. */
  async list(userId: string, { unread = false, limit = 50 }: { unread?: boolean; limit?: number }): Promise<NotificationDto[]> {
    const items = await this.prisma.notification.findMany({
      where: { userId, ...(unread ? { readAt: null } : {}) },
      orderBy: [{ createdAt: "desc" }, { position: "desc" }],
      take: limit,
      include,
    });
    return items.map(toDto);
  }

  async unreadCount(userId: string): Promise<{ count: number }> {
    return { count: await this.prisma.notification.count({ where: { userId, readAt: null } }) };
  }

  /** Only the recipient can mark it; someone else's id looks like a missing one. */
  async markRead(id: string, userId: string): Promise<NotificationDto> {
    const notification = await this.prisma.notification.findFirst({ where: { id, userId } });
    if (!notification) throw new NotFoundException(`Notification "${id}" not found`);
    const updated = await this.prisma.notification.update({
      where: { id },
      data: { readAt: notification.readAt ?? now() },
      include,
    });
    return toDto(updated);
  }

  async markAllRead(userId: string): Promise<{ count: number }> {
    const { count } = await this.prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: now() } });
    return { count };
  }
}

function toDto(notification: NotificationWithTeam): NotificationDto {
  const dto: NotificationDto = {
    id: notification.id,
    kind: notification.kind,
    title: notification.title,
    actorId: notification.actorId,
    createdAt: notification.createdAt.toISOString(),
    readAt: notification.readAt?.toISOString() ?? null,
  };
  if (notification.excerpt) dto.excerpt = notification.excerpt;
  if (notification.taskId) dto.taskId = notification.taskId;
  if (notification.documentId) dto.documentId = notification.documentId;
  const teamId = notification.task?.teamId ?? notification.document?.teamId;
  if (teamId) dto.teamId = teamId;
  return dto;
}
