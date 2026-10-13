import { Body, Controller, Get, HttpCode, Param, Patch, Post } from "@nestjs/common";
import { IsBoolean, IsIn, IsInt, IsOptional, Max, Min } from "class-validator";

import { CurrentUser, type SessionUser } from "@/auth/session";
import type { CycleRollover } from "@/contracts";

import { CycleSettingsService } from "./cycle-settings.service";

class UpdateCycleSettingsDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  lengthWeeks?: number;

  /** 0 = domingo, 1 = lunes, …, 6 = sábado. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  startDay?: number;

  @IsOptional()
  @IsIn(["next_cycle", "backlog"])
  rollover?: CycleRollover;
}

@Controller()
export class CycleSettingsController {
  constructor(private readonly settings: CycleSettingsService) {}

  /** Ajustes · Ciclos, plus a preview of the next cycles. */
  @Get("teams/:teamId/cycle-settings")
  get(@Param("teamId") teamId: string) {
    return this.settings.get(teamId);
  }

  /** Leaders of the space only. */
  @Patch("teams/:teamId/cycle-settings")
  update(@Param("teamId") teamId: string, @Body() body: UpdateCycleSettingsDto, @CurrentUser() user: SessionUser) {
    return this.settings.update(teamId, body, user);
  }

  /** Leaders: close the space's latest cycle -> { closed, next, moved } (unfinished tasks roll over). */
  @Post("cycles/:id/close")
  @HttpCode(200)
  close(@Param("id") id: string, @CurrentUser() user: SessionUser) {
    return this.settings.close(id, user);
  }
}
