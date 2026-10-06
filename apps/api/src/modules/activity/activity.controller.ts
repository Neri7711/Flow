import { Controller, Get, Query } from "@nestjs/common";

import { TeamLimitQueryDto } from "@/shared/query.dto";

import { ActivityService } from "./activity.service";

@Controller("activity")
export class ActivityController {
  constructor(private readonly activity: ActivityService) {}

  /** GET /api/activity/recent?teamId=pl&limit=3 */
  @Get("recent")
  findRecent(@Query() { teamId, limit }: TeamLimitQueryDto) {
    return this.activity.findRecent(teamId, limit);
  }
}
