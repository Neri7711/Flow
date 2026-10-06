import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query } from "@nestjs/common";

import { EventService } from "./event.service";

@Controller("events")
export class EventController {
  constructor(private readonly events: EventService) {}

  /** GET /api/events/upcoming?teamId=pl&limit=3 */
  @Get("upcoming")
  findUpcoming(
    @Query("teamId") teamId: string,
    @Query("limit", new DefaultValuePipe(3), ParseIntPipe) limit: number,
  ) {
    return this.events.findUpcoming(teamId, limit);
  }
}
