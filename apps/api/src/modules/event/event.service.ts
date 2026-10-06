import { Injectable } from "@nestjs/common";
import type { CalendarEvent } from "@prisma/client";

import type { CalendarEventDto } from "@/contracts";
import { PrismaService } from "@/prisma/prisma.service";
import { now } from "@/shared/clock";

@Injectable()
export class EventService {
  constructor(private readonly prisma: PrismaService) {}

  /** Upcoming events for a team, soonest first. */
  async findUpcoming(teamId: string, limit = 3): Promise<CalendarEventDto[]> {
    const events = await this.prisma.calendarEvent.findMany({
      where: { teamId, startsAt: { gte: now() } },
      orderBy: { startsAt: "asc" },
      take: limit,
    });
    return events.map(toDto);
  }
}

function toDto(event: CalendarEvent): CalendarEventDto {
  return {
    id: event.id,
    teamId: event.teamId,
    title: event.title,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt?.toISOString() ?? null,
    tone: event.tone,
  };
}
