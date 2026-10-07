import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from "@nestjs/common";

import { CurrentUser, Public, type SessionUser } from "@/auth/session";
import { TeamQueryDto } from "@/shared/query.dto";

import { AcceptInvitationDto, CreateInvitationDto } from "./dto";
import { InvitationService } from "./invitation.service";

@Controller("invitations")
export class InvitationController {
  constructor(private readonly invitations: InvitationService) {}

  /** Leaders: invite someone to your team -> { invitation, token } (the token builds the link, shown once). */
  @Post()
  create(@Body() body: CreateInvitationDto, @CurrentUser() user: SessionUser) {
    return this.invitations.create(body, user);
  }

  /** Leaders: pending invitations of your team. */
  @Get()
  findPending(@Query() { teamId }: TeamQueryDto, @CurrentUser() user: SessionUser) {
    return this.invitations.findPending(teamId, user);
  }

  @Delete(":id")
  revoke(@Param("id") id: string, @CurrentUser() user: SessionUser) {
    return this.invitations.revoke(id, user);
  }

  /** Public: who is being invited, for the "choose your password" screen. */
  @Public()
  @Get("preview/:token")
  preview(@Param("token") token: string) {
    return this.invitations.preview(token);
  }

  /** Public: sets the password, creates the account -> { token, user } (signed in). */
  @Public()
  @Post("accept")
  @HttpCode(200)
  accept(@Body() body: AcceptInvitationDto) {
    return this.invitations.accept(body);
  }
}
