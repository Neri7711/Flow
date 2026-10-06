import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from "class-validator";

/** `?teamId=` is required: without it Prisma would drop the filter and return every team's data. */
export class TeamQueryDto {
  @IsString()
  @IsNotEmpty()
  teamId!: string;
}

export class TeamLimitQueryDto extends TeamQueryDto {
  /** Each endpoint applies its own default when omitted. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class OptionalTeamQueryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  teamId?: string;
}
