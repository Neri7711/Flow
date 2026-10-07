import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";

import { CurrentUser, type SessionUser } from "@/auth/session";
import { TeamLimitQueryDto } from "@/shared/query.dto";

import { CreateEventDto, EventRangeQueryDto, UpdateEventDto } from "./dto";
import { EventService } from "./event.service";

@Controller("events")
export class EventController {
  constructor(private readonly events: EventService) {}

  /** GET /api/events?teamId=pl&from=2026-10-01T06:00:00Z&to=2026-11-01T06:00:00Z */
  @Get()
  findInRange(@Query() { teamId, from, to }: EventRangeQueryDto) {
    return this.events.findInRange(teamId, new Date(from), new Date(to));
  }

  /** GET /api/events/upcoming?teamId=pl&limit=3 */
  @Get("upcoming")
  findUpcoming(@Query() { teamId, limit }: TeamLimitQueryDto) {
    return this.events.findUpcoming(teamId, limit);
  }

  @Post()
  create(@Body() body: CreateEventDto, @CurrentUser() user: SessionUser) {
    return this.events.create(body, user.id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: UpdateEventDto) {
    return this.events.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.events.remove(id);
  }
}
