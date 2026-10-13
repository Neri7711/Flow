import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import type { CalendarEventDto } from "@/contracts";
import { PrismaService } from "@/prisma/prisma.service";
import { now } from "@/shared/clock";

import { recordActivity } from "../activity/activity.recorder";
import type { CreateEventDto, UpdateEventDto } from "./dto";

const include = {
  attendees: { select: { userId: true }, orderBy: { userId: "asc" } },
} satisfies Prisma.CalendarEventInclude;

type EventWithAttendees = Prisma.CalendarEventGetPayload<{ include: typeof include }>;

/** Events that overlap [from, to): they start before `to` and haven't ended before `from`. */
function overlapping(from: Date, to: Date): Prisma.CalendarEventWhereInput {
  return {
    startsAt: { lt: to },
    OR: [{ endsAt: { gte: from } }, { endsAt: null, startsAt: { gte: from } }],
  };
}

@Injectable()
export class EventService {
  constructor(private readonly prisma: PrismaService) {}

  /** Upcoming (or still running) events for a team, soonest first. */
  async findUpcoming(teamId: string, limit = 3): Promise<CalendarEventDto[]> {
    const reference = now();
    const events = await this.prisma.calendarEvent.findMany({
      where: { teamId, OR: [{ startsAt: { gte: reference } }, { endsAt: { gte: reference } }] },
      orderBy: { startsAt: "asc" },
      take: limit,
      include,
    });
    return events.map(toDto);
  }

  /** Events overlapping [from, to), for one team or (without `teamId`) all of them. */
  async findInRange(teamId: string | undefined, from: Date, to: Date): Promise<CalendarEventDto[]> {
    if (to <= from) throw new BadRequestException("`to` must be after `from`");
    const events = await this.prisma.calendarEvent.findMany({
      where: { teamId, ...overlapping(from, to) },
      orderBy: [{ startsAt: "asc" }, { id: "asc" }],
      include,
    });
    return events.map(toDto);
  }

  async create(input: CreateEventDto, actorId: string): Promise<CalendarEventDto> {
    const startsAt = new Date(input.startsAt);
    const endsAt = input.endsAt ? new Date(input.endsAt) : null;
    assertValidSpan(startsAt, endsAt);
    const tone = input.tone ?? input.teamId;
    await this.assertTone(tone);
    const attendeeIds = [...new Set(input.attendeeIds ?? [])];

    return this.prisma.$transaction(async (tx) => {
      const event = await tx.calendarEvent.create({
        data: {
          teamId: input.teamId,
          title: input.title,
          startsAt,
          endsAt,
          // Without an explicit flag, "no end" keeps meaning "all day".
          allDay: input.allDay ?? endsAt === null,
          tone,
          attendees: { create: attendeeIds.map((userId) => ({ userId })) },
        },
        include,
      });
      await recordActivity(tx, { teamId: input.teamId, actorId, summary: `agregó ${input.title} al calendario` });
      return toDto(event);
    });
  }

  async update(id: string, input: UpdateEventDto): Promise<CalendarEventDto> {
    const current = await this.prisma.calendarEvent.findUnique({ where: { id } });
    if (!current) throw notFound(id);

    const startsAt = input.startsAt ? new Date(input.startsAt) : current.startsAt;
    const endsAt = input.endsAt === undefined ? current.endsAt : input.endsAt ? new Date(input.endsAt) : null;
    assertValidSpan(startsAt, endsAt);
    if (input.tone) await this.assertTone(input.tone);
    const attendeeIds = input.attendeeIds ? [...new Set(input.attendeeIds)] : undefined;

    return this.prisma.$transaction(async (tx) => {
      if (attendeeIds) {
        await tx.eventAttendee.deleteMany({ where: { eventId: id } });
        if (attendeeIds.length) await tx.eventAttendee.createMany({ data: attendeeIds.map((userId) => ({ eventId: id, userId })) });
      }
      const event = await tx.calendarEvent.update({
        where: { id },
        data: {
          title: input.title,
          startsAt,
          endsAt,
          allDay: input.allDay ?? (input.endsAt === null ? true : undefined),
          tone: input.tone,
        },
        include,
      });
      return toDto(event);
    });
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

function toDto(event: EventWithAttendees): CalendarEventDto {
  return {
    id: event.id,
    teamId: event.teamId,
    title: event.title,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt?.toISOString() ?? null,
    allDay: event.allDay,
    tone: event.tone,
    attendeeIds: event.attendees.map((attendee) => attendee.userId),
  };
}
