import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

import { CurrentUser, type SessionUser } from "@/auth/session";
import type { UserRole } from "@/contracts";
import { OptionalTeamQueryDto } from "@/shared/query.dto";

import { MAX_AVATAR_BYTES, UserService } from "./user.service";

class ChangeRoleDto {
  @IsIn(["leader", "member", "guest"])
  role!: UserRole;

  /** Space where the role changes; defaults to the person's home space. */
  @IsOptional()
  @IsString()
  teamId?: string;
}

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name?: string;

  /** "Cómo te dicen". */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  shortName?: string;

  /** `null` or empty clears it. */
  @IsOptional()
  @IsString()
  @MaxLength(60)
  area?: string | null;
}

@Controller("users")
export class UserController {
  constructor(private readonly users: UserService) {}

  /** GET /api/users[?teamId=pl] — with teamId, that space's members and their role there. */
  @Get()
  findAll(@Query() { teamId }: OptionalTeamQueryDto) {
    return this.users.findAll(teamId);
  }

  /** The signed-in user. */
  @Get("me")
  findCurrent(@CurrentUser() user: SessionUser) {
    return this.users.findOne(user.id);
  }

  /** Name, nickname and area of the signed-in user. */
  @Patch("me")
  updateProfile(@Body() body: UpdateProfileDto, @CurrentUser() user: SessionUser) {
    return this.users.updateProfile(user.id, body);
  }

  /** multipart/form-data with the image in `file` (PNG, JPG or WebP, up to 2 MB). */
  @Post("me/avatar")
  @HttpCode(200)
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_AVATAR_BYTES + 1 } }))
  setAvatar(@UploadedFile() file: Express.Multer.File | undefined, @CurrentUser() user: SessionUser) {
    return this.users.setAvatar(user.id, file);
  }

  @Delete("me/avatar")
  removeAvatar(@CurrentUser() user: SessionUser) {
    return this.users.removeAvatar(user.id);
  }

  /** The onboarding was completed (don't show it again). */
  @Post("me/onboarded")
  @HttpCode(200)
  markOnboarded(@CurrentUser() user: SessionUser) {
    return this.users.markOnboarded(user.id);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.users.findOne(id);
  }

  /** Leaders only, for members of their space (not themselves). */
  @Patch(":id/role")
  changeRole(@Param("id") id: string, @Body() { role, teamId }: ChangeRoleDto, @CurrentUser() user: SessionUser) {
    return this.users.changeRole(id, role, user, teamId);
  }
}
