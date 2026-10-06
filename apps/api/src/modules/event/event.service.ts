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
    const reference = now().getTime();
    const events = await this.prisma.calendarEvent.findMany({ where: { teamId } });
    return events
      .filter((event) => new Date(event.startsAt).getTime() >= reference)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
      .slice(0, limit)
      .map(toDto);
  }
}

function toDto(event: CalendarEvent): CalendarEventDto {
  return {
    id: event.id,
    teamId: event.teamId,
    title: event.title,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    tone: event.tone,
  };
}
