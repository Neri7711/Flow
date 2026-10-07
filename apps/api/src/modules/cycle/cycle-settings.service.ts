import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { Cycle, CycleRollover, CycleSettings } from "@prisma/client";

import { assertLeaderOf } from "@/auth/permissions";
import type { SessionUser } from "@/auth/session";
import type { CycleDto, CycleSettingsDto } from "@/contracts";
import { PrismaService } from "@/prisma/prisma.service";
import { now } from "@/shared/clock";

import { recordActivity } from "../activity/activity.recorder";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Mexico City (the app's time zone) has no DST: cycles start at local midnight = 06:00 UTC. */
const UTC_OFFSET_MS = 6 * 60 * 60 * 1000;
const UPCOMING_PREVIEW = 3;

const DEFAULTS: Omit<CycleSettings, "teamId"> = { enabled: true, lengthWeeks: 2, startDay: 1, rollover: "next_cycle" };

export type SettingsPatch = Partial<{ enabled: boolean; lengthWeeks: number; startDay: number; rollover: CycleRollover }>;

/** Local (Mexico City) midnight of the first `startDay` on or after `after`. */
function nextStart(after: Date, startDay: number): Date {
  const local = new Date(after.getTime() - UTC_OFFSET_MS);
  let midnight = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  if (midnight < local.getTime()) midnight += DAY_MS;
  while (new Date(midnight).getUTCDay() !== startDay) midnight += DAY_MS;
  return new Date(midnight + UTC_OFFSET_MS);
}

/** A cycle of `lengthWeeks` starting at `start`, ending at 23:59 of its last day. */
function spanFrom(start: Date, lengthWeeks: number): { startsAt: Date; endsAt: Date } {
  return { startsAt: start, endsAt: new Date(start.getTime() + lengthWeeks * 7 * DAY_MS - 60 * 1000) };
}

@Injectable()
export class CycleSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(teamId: string): Promise<CycleSettingsDto> {
    await this.assertTeam(teamId);
    return this.toDto(teamId, await this.load(teamId));
  }

  /** Leaders of the space only. */
  async update(teamId: string, patch: SettingsPatch, leader: SessionUser): Promise<CycleSettingsDto> {
    await this.assertTeam(teamId);
    assertLeaderOf(leader, teamId);
    const settings = await this.prisma.cycleSettings.upsert({
      where: { teamId },
      create: { teamId, ...DEFAULTS, ...patch },
      update: patch,
    });
    return this.toDto(teamId, settings);
  }

  /**
   * Leaders close their space's current cycle: the next one is created from the settings and
   * unfinished tasks move to it (or back to the backlog, per `rollover`).
   */
  async close(cycleId: string, leader: SessionUser): Promise<{ closed: CycleDto; next: CycleDto; moved: string[] }> {
    const cycle = await this.prisma.cycle.findUnique({ where: { id: cycleId } });
    if (!cycle) throw new NotFoundException(`Cycle "${cycleId}" not found`);
    assertLeaderOf(leader, cycle.teamId);
    const settings = await this.load(cycle.teamId);
    if (!settings.enabled) throw new BadRequestException("Los ciclos están desactivados en este espacio");
    const latest = await this.prisma.cycle.findFirst({ where: { teamId: cycle.teamId }, orderBy: { number: "desc" } });
    if (latest && latest.id !== cycle.id) throw new ConflictException(`Ya existe el ciclo ${latest.number}`);

    const span = spanFrom(nextStart(new Date(cycle.endsAt.getTime() + 60 * 1000), settings.startDay), settings.lengthWeeks);
    return this.prisma.$transaction(async (tx) => {
      const next = await tx.cycle.create({
        data: { id: `${cycle.teamId}-c${cycle.number + 1}`, teamId: cycle.teamId, number: cycle.number + 1, ...span },
      });
      const unfinished = await tx.task.findMany({ where: { cycleId: cycle.id, status: { not: "done" } }, select: { id: true } });
      const ids = unfinished.map((task) => task.id);
      if (ids.length) {
        await tx.task.updateMany({
          where: { id: { in: ids } },
          data: settings.rollover === "next_cycle" ? { cycleId: next.id } : { cycleId: null, status: "backlog" },
        });
      }
      await recordActivity(tx, { teamId: cycle.teamId, actorId: leader.id, summary: `cerró el ciclo ${cycle.number}` });
      return { closed: toCycleDto(cycle), next: toCycleDto(next), moved: ids };
    });
  }

  private async load(teamId: string): Promise<Omit<CycleSettings, "teamId">> {
    return (await this.prisma.cycleSettings.findUnique({ where: { teamId } })) ?? DEFAULTS;
  }

  private async assertTeam(teamId: string): Promise<void> {
    if (!(await this.prisma.team.count({ where: { id: teamId } }))) throw new NotFoundException(`Team "${teamId}" not found`);
  }

  /** Settings plus the next cycles they would schedule (after the latest existing one, or from today). */
  private async toDto(teamId: string, settings: Omit<CycleSettings, "teamId">): Promise<CycleSettingsDto> {
    const latest = await this.prisma.cycle.findFirst({ where: { teamId }, orderBy: { number: "desc" } });
    const upcoming: CycleSettingsDto["upcoming"] = [];
    if (settings.enabled) {
      let after = latest ? new Date(latest.endsAt.getTime() + 60 * 1000) : now();
      for (let i = 1; i <= UPCOMING_PREVIEW; i++) {
        const span = spanFrom(nextStart(after, settings.startDay), settings.lengthWeeks);
        upcoming.push({ number: (latest?.number ?? 0) + i, startsAt: span.startsAt.toISOString(), endsAt: span.endsAt.toISOString() });
        after = new Date(span.endsAt.getTime() + 60 * 1000);
      }
    }
    return {
      teamId,
      enabled: settings.enabled,
      lengthWeeks: settings.lengthWeeks,
      startDay: settings.startDay,
      rollover: settings.rollover,
      upcoming,
    };
  }
}

function toCycleDto(cycle: Cycle): CycleDto {
  return { id: cycle.id, teamId: cycle.teamId, number: cycle.number, startsAt: cycle.startsAt.toISOString(), endsAt: cycle.endsAt.toISOString() };
}
