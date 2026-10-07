import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { CalendarEvent } from "@prisma/client";

import type { CalendarEventDto } from "@/contracts";
import { PrismaService } from "@/prisma/prisma.service";
import { now } from "@/shared/clock";

import { recordActivity } from "../activity/activity.recorder";
import type { CreateEventDto, UpdateEventDto } from "./dto";

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

  /** Events starting in [from, to), for the calendar view. */
  async findInRange(teamId: string, from: Date, to: Date): Promise<CalendarEventDto[]> {
    if (to <= from) throw new BadRequestException("`to` must be after `from`");
    const events = await this.prisma.calendarEvent.findMany({
      where: { teamId, startsAt: { gte: from, lt: to } },
      orderBy: { startsAt: "asc" },
    });
    return events.map(toDto);
  }

  async create(input: CreateEventDto, actorId: string): Promise<CalendarEventDto> {
    const startsAt = new Date(input.startsAt);
    const endsAt = input.endsAt ? new Date(input.endsAt) : null;
    assertValidSpan(startsAt, endsAt);
    const tone = input.tone ?? input.teamId;
    await this.assertTone(tone);

    const [event] = await this.prisma.$transaction([
      this.prisma.calendarEvent.create({ data: { teamId: input.teamId, title: input.title, startsAt, endsAt, tone } }),
      recordActivity(this.prisma, { teamId: input.teamId, actorId, summary: `agregó ${input.title} al calendario` }),
    ]);
    return toDto(event);
  }

  async update(id: string, input: UpdateEventDto): Promise<CalendarEventDto> {
    const current = await this.prisma.calendarEvent.findUnique({ where: { id } });
    if (!current) throw notFound(id);

    const startsAt = input.startsAt ? new Date(input.startsAt) : current.startsAt;
    const endsAt = input.endsAt === undefined ? current.endsAt : input.endsAt ? new Date(input.endsAt) : null;
    assertValidSpan(startsAt, endsAt);
    if (input.tone) await this.assertTone(input.tone);

    const event = await this.prisma.calendarEvent.update({
      where: { id },
      data: { title: input.title, startsAt, endsAt, tone: input.tone },
    });
    return toDto(event);
  }

  async remove(id: string): Promise<{ id: string }> {
    const deleted = await this.prisma.calendarEvent.deleteMany({ where: { id } });
    if (deleted.count === 0) throw notFound(id);
    return { id };
  }

  /** Tones are team palette keys. */
  private async assertTone(tone: string): Promise<void> {
    if (!(await this.prisma.team.count({ where: { id: tone } }))) throw new BadRequestException(`Unknown tone "${tone}"`);
  }
}

function assertValidSpan(startsAt: Date, endsAt: Date | null): void {
  if (endsAt && endsAt <= startsAt) throw new BadRequestException("The event must end after it starts");
}

function notFound(id: string): NotFoundException {
  return new NotFoundException(`Event "${id}" not found`);
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
