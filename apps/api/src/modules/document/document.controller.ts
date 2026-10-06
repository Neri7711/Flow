import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";

import { AddDocumentCommentDto, CreateDocumentDto, UpdateDocumentDto } from "./dto";
import { DocumentService } from "./document.service";

@Controller("documents")
export class DocumentController {
  constructor(private readonly documents: DocumentService) {}

  /** GET /api/documents          -> all documents
   *  GET /api/documents?teamId=pl -> that team's documents */
  @Get()
  findAll(@Query("teamId") teamId?: string) {
    return teamId ? this.documents.findForTeam(teamId) : this.documents.findAll();
  }

  /** GET /api/documents/tree?teamId=pl -> nested sidebar tree. */
  @Get("tree")
  findTree(@Query("teamId") teamId: string) {
    return this.documents.findTree(teamId);
  }

  /** GET /api/documents/recent?teamId=pl&limit=4 */
  @Get("recent")
  findRecent(
    @Query("teamId") teamId: string,
    @Query("limit", new DefaultValuePipe(4), ParseIntPipe) limit: number,
  ) {
    return this.documents.findRecent(teamId, limit);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.documents.findOne(id);
  }

  @Get(":id/content")
  getContent(@Param("id") id: string) {
    return this.documents.getContent(id);
  }

  @Get(":id/comments")
  getComments(@Param("id") id: string) {
    return this.documents.getComments(id);
  }

  @Post()
  create(@Body() body: CreateDocumentDto) {
    return this.documents.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: UpdateDocumentDto) {
    return this.documents.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.documents.remove(id);
  }

  @Post(":id/comments")
  addComment(@Param("id") id: string, @Body() body: AddDocumentCommentDto) {
    return this.documents.addComment(id, body);
  }
}
