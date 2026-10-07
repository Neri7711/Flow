import { Transform } from "class-transformer";
import { IsEmail, IsIn, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

import type { UserRole } from "@/contracts";

const normalizeEmail = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim().toLowerCase() : value);

export class CreateInvitationDto {
  @Transform(normalizeEmail)
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  @IsIn(["leader", "member"])
  role!: UserRole;
}

export class AcceptInvitationDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @MinLength(8, { message: "La contraseña debe tener al menos 8 caracteres" })
  @MaxLength(200)
  password!: string;
}
