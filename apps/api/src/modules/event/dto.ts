import { ArrayMaxSize, IsArray, IsBoolean, IsISO8601, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class EventRangeQueryDto {
  /** Omit to get every team's events (the four-team calendar). */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  teamId?: string;

  /** Start of the range (ISO-8601). Events overlapping [from, to) are returned. */
  @IsISO8601()
  from!: string;

  /** Exclusive end of the range (ISO-8601). */
  @IsISO8601()
  to!: string;
}

class EventFields {
  /** Team color for the dot; defaults to the event's team. */
  @IsOptional()
  @IsString()
  tone?: string;

  /** All-day event; with `endsAt` it spans several days (e.g. a 2-day hackathon). */
  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  /** People attending, from any team. Replaces the whole list on update. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  attendeeIds?: string[];
}

export class CreateEventDto extends EventFields {
  @IsString()
  @IsNotEmpty()
  teamId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsISO8601()
  startsAt!: string;

  /** Omit or send `null` for a single all-day event. */
  @IsOptional()
  @IsISO8601()
  endsAt?: string | null;
}

export class UpdateEventDto extends EventFields {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsISO8601()
  startsAt?: string;

  @IsOptional()
  @IsISO8601()
  endsAt?: string | null;
}
