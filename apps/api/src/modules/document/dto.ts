import { Type } from "class-transformer";
import { IsArray, IsOptional, IsString, MinLength, ValidateNested } from "class-validator";

export class DocumentPropertiesInput {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class CreateDocumentDto {
  @IsString()
  teamId!: string;

  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  parentId?: string | null;

  @IsString()
  updatedById!: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DocumentPropertiesInput)
  properties?: DocumentPropertiesInput;
}

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  parentId?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => DocumentPropertiesInput)
  properties?: DocumentPropertiesInput;

  /** Who performed the edit; stamped into updatedAt/updatedById. */
  @IsOptional()
  @IsString()
  updatedById?: string;
}

export class AddDocumentCommentDto {
  @IsString()
  authorId!: string;

  @IsString()
  @MinLength(1)
  body!: string;
}
