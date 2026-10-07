import { Controller, Get, HttpCode, Param, Patch, Post, Query } from "@nestjs/common";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, Max, Min } from "class-validator";

import { CurrentUser, type SessionUser } from "@/auth/session";

import { NotificationService } from "./notification.service";

class NotificationQueryDto {
  /** `?unread=true` -> only unread ones. */
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  unread?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

/** The signed-in user's notifications (each person only ever sees their own). */
@Controller("notifications")
export class NotificationController {
  constructor(private readonly notifications: NotificationService) {}

  @Get()
  list(@Query() query: NotificationQueryDto, @CurrentUser() user: SessionUser) {
    return this.notifications.list(user.id, query);
  }

  /** For the inbox badge (the web adds pending triage requests). */
  @Get("unread-count")
  unreadCount(@CurrentUser() user: SessionUser) {
    return this.notifications.unreadCount(user.id);
  }

  @Patch(":id/read")
  markRead(@Param("id") id: string, @CurrentUser() user: SessionUser) {
    return this.notifications.markRead(id, user.id);
  }

  @Post("read-all")
  @HttpCode(200)
  markAllRead(@CurrentUser() user: SessionUser) {
    return this.notifications.markAllRead(user.id);
  }
}
