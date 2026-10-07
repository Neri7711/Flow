import { IsISO8601, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class EventRangeQueryDto {
  @IsString()
  @IsNotEmpty()
  teamId!: string;

  /** Inclusive start of the range (ISO-8601). */
  @IsISO8601()
  from!: string;

  /** Exclusive end of the range (ISO-8601). */
  @IsISO8601()
  to!: string;
}

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  teamId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsISO8601()
  startsAt!: string;

  /** Omit or send `null` for an all-day event. */
  @IsOptional()
  @IsISO8601()
  endsAt?: string | null;

  /** Team color for the dot; defaults to the event's team. */
  @IsOptional()
  @IsString()
  tone?: string;
}

export class UpdateEventDto {
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

  @IsOptional()
  @IsString()
  tone?: string;
}
