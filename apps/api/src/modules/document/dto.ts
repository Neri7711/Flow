import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from "class-validator";

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

/** Page look: emoji, cover color and draft label. `null` clears icon/cover. */
class PageLookFields {
  @IsOptional()
  @IsString()
  @MaxLength(16)
  icon?: string | null;

  /** Team palette key ("cs", "pl", "me", "ii"). */
  @IsOptional()
  @IsString()
  coverTone?: string | null;

  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;
}

export class CreateDocumentDto extends PageLookFields {
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

export class UpdateDocumentDto extends PageLookFields {
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
