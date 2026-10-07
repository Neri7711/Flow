import { Body, Controller, Get, HttpCode, Param, Post, Query } from "@nestjs/common";

import { CurrentUser, type SessionUser } from "@/auth/session";
import { TeamQueryDto } from "@/shared/query.dto";

import { AcceptTriageDto, CreateTriageDto } from "./dto";
import { TriageService } from "./triage.service";

@Controller("triage")
export class TriageController {
  constructor(private readonly triage: TriageService) {}

  /** GET /api/triage?teamId=pl -> requests waiting for that team. */
  @Get()
  findForTeam(@Query() { teamId }: TeamQueryDto) {
    return this.triage.findForTeam(teamId);
  }

  @Post()
  create(@Body() body: CreateTriageDto, @CurrentUser() user: SessionUser) {
    return this.triage.create(body, user);
  }

  /** Leaders only: work -> creates the task ({ request, task }); join -> adds the member ({ request, membership }). */
  @Post(":id/accept")
  @HttpCode(200)
  accept(@Param("id") id: string, @Body() body: AcceptTriageDto, @CurrentUser() user: SessionUser) {
    return this.triage.accept(id, user, body);
  }

  @Post(":id/decline")
  @HttpCode(200)
  decline(@Param("id") id: string, @CurrentUser() user: SessionUser) {
    return this.triage.decline(id, user);
  }
}
