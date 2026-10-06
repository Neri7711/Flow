import { Controller, Get, Query } from "@nestjs/common";

import { TeamLimitQueryDto } from "@/shared/query.dto";

import { EventService } from "./event.service";

@Controller("events")
export class EventController {
  constructor(private readonly events: EventService) {}

  /** GET /api/events/upcoming?teamId=pl&limit=3 */
  @Get("upcoming")
  findUpcoming(@Query() { teamId, limit }: TeamLimitQueryDto) {
    return this.events.findUpcoming(teamId, limit);
  }
}
