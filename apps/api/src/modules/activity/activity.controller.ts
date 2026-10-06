import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query } from "@nestjs/common";

import { ActivityService } from "./activity.service";

@Controller("activity")
export class ActivityController {
  constructor(private readonly activity: ActivityService) {}

  /** GET /api/activity/recent?teamId=pl&limit=3 */
  @Get("recent")
  findRecent(
    @Query("teamId") teamId: string,
    @Query("limit", new DefaultValuePipe(3), ParseIntPipe) limit: number,
  ) {
    return this.activity.findRecent(teamId, limit);
  }
}
