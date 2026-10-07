import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";

import { CurrentUser, type SessionUser } from "@/auth/session";
import { OptionalTeamQueryDto, TeamLimitQueryDto, TeamQueryDto } from "@/shared/query.dto";

import { AddDocumentCommentDto, CreateDocumentDto, UpdateDocumentDto } from "./dto";
import { DocumentService } from "./document.service";

@Controller("documents")
export class DocumentController {
  constructor(private readonly documents: DocumentService) {}

  /** GET /api/documents[?teamId=pl] -> documents in sidebar order. */
  @Get()
  findAll(@Query() { teamId }: OptionalTeamQueryDto) {
    return this.documents.findAll(teamId);
  }

  /** GET /api/documents/tree?teamId=pl -> nested sidebar tree. */
  @Get("tree")
  findTree(@Query() { teamId }: TeamQueryDto) {
    return this.documents.findTree(teamId);
  }

  /** GET /api/documents/recent?teamId=pl&limit=4 */
  @Get("recent")
  findRecent(@Query() { teamId, limit }: TeamLimitQueryDto) {
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
  create(@Body() body: CreateDocumentDto, @CurrentUser() user: SessionUser) {
    return this.documents.create(body, user.id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: UpdateDocumentDto, @CurrentUser() user: SessionUser) {
    return this.documents.update(id, body, user.id);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.documents.remove(id);
  }

  @Post(":id/comments")
  addComment(@Param("id") id: string, @Body() body: AddDocumentCommentDto, @CurrentUser() user: SessionUser) {
    return this.documents.addComment(id, body, user.id);
  }
}
