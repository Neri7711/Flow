import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";

/** Each property: omit to leave it unchanged, send `null` (or `[]` for tags) to clear it. */
export class DocumentPropertiesInput {
  @IsOptional()
  @IsString()
  status?: string | null;

  @IsOptional()
  @IsString()
  ownerId?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  teamId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  parentId?: string | null;

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
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  /** Send `null` to move the page to the top level of its space. */
  @IsOptional()
  @IsString()
  parentId?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => DocumentPropertiesInput)
  properties?: DocumentPropertiesInput;
}

export class AddDocumentCommentDto {
  @IsString()
  @IsNotEmpty()
  body!: string;

  /** Thread to reply to; omit to start a new thread. */
  @IsOptional()
  @IsString()
  parentId?: string;
}
