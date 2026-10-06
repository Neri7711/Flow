import { randomUUID } from "node:crypto";

import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { Document, DocumentComment, Prisma } from "@prisma/client";

import type { DocumentCommentDto, DocumentDto, DocumentPropertiesDto } from "@/contracts";
import { PrismaService } from "@/prisma/prisma.service";
import { now } from "@/shared/clock";

import type { AddDocumentCommentDto, CreateDocumentDto, UpdateDocumentDto } from "./dto";

export type DocumentTreeNode = DocumentDto & { children: DocumentTreeNode[] };

/** Lists never need the page body; it is served by `getContent`. */
const omitContent = { content: true } satisfies Prisma.DocumentOmit;

const EMPTY_CONTENT = "<p></p>";

@Injectable()
export class DocumentService {
  constructor(private readonly prisma: PrismaService) {}

  /** In sidebar order. Pass `teamId` to scope to one space. */
  async findAll(teamId?: string): Promise<DocumentDto[]> {
    const docs = await this.prisma.document.findMany({
      where: { teamId },
      omit: omitContent,
      orderBy: { position: "asc" },
    });
    return docs.map(toDto);
  }

  async findRecent(teamId: string, limit = 4): Promise<DocumentDto[]> {
    const docs = await this.prisma.document.findMany({
      where: { teamId },
      omit: omitContent,
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
    return docs.map(toDto);
  }

  /** Nested tree for a team's sidebar (parentId -> children), preserving order. */
  async findTree(teamId: string): Promise<DocumentTreeNode[]> {
    const docs = await this.findAll(teamId);
    const nodes = new Map<string, DocumentTreeNode>(docs.map((doc) => [doc.id, { ...doc, children: [] }]));
    const roots: DocumentTreeNode[] = [];
    for (const node of nodes.values()) {
      const parent = node.parentId ? nodes.get(node.parentId) : undefined;
      (parent ? parent.children : roots).push(node);
    }
    return roots;
  }

  async findOne(id: string): Promise<DocumentDto> {
    const doc = await this.prisma.document.findUnique({ where: { id }, omit: omitContent });
    if (!doc) throw notFound(id);
    return toDto(doc);
  }

  async getContent(id: string): Promise<{ content: string }> {
    const doc = await this.prisma.document.findUnique({ where: { id }, select: { content: true } });
    if (!doc) throw notFound(id);
    return { content: doc.content || EMPTY_CONTENT };
  }

  async getComments(id: string): Promise<DocumentCommentDto[]> {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      select: { comments: { orderBy: { at: "asc" } } },
    });
    if (!doc) throw notFound(id);
    return doc.comments.map(toCommentDto);
  }

  async create(input: CreateDocumentDto): Promise<DocumentDto> {
    if (input.parentId) await this.assertValidParent(input.parentId, input.teamId);

    const doc = await this.prisma.document.create({
      data: {
        id: `doc-${randomUUID()}`,
        teamId: input.teamId,
        title: input.title,
        parentId: input.parentId ?? null,
        updatedById: input.updatedById,
        updatedAt: now(),
        content: input.content ?? EMPTY_CONTENT,
        propStatus: input.properties?.status ?? null,
        propOwnerId: input.properties?.ownerId ?? null,
        propTags: input.properties?.tags ?? [],
      },
      omit: omitContent,
    });
    return toDto(doc);
  }

  async update(id: string, input: UpdateDocumentDto): Promise<DocumentDto> {
    const current = await this.prisma.document.findUnique({ where: { id }, select: { teamId: true } });
    if (!current) throw notFound(id);

    if (input.parentId) {
      await this.assertValidParent(input.parentId, current.teamId);
      if ((await this.subtreeIds(id)).includes(input.parentId)) {
        throw new BadRequestException("A page cannot be moved inside itself or one of its subpages");
      }
    }

    // `undefined` leaves a column untouched; `null` clears it.
    const doc = await this.prisma.document.update({
      where: { id },
      data: {
        title: input.title,
        content: input.content,
        parentId: input.parentId,
        updatedById: input.updatedById,
        updatedAt: now(),
        propStatus: input.properties?.status,
        propOwnerId: input.properties?.ownerId,
        propTags: input.properties?.tags,
      },
      omit: omitContent,
    });
    return toDto(doc);
  }

  /** Deletes a page and its whole subtree (Notion semantics; the FK cascades). */
  async remove(id: string): Promise<{ deletedIds: string[] }> {
    return this.prisma.$transaction(async (tx) => {
      const deletedIds = await this.subtreeIds(id, tx);
      if (deletedIds.length === 0) throw notFound(id);
      await tx.document.delete({ where: { id } });
      return { deletedIds };
    });
  }

  async addComment(id: string, input: AddDocumentCommentDto): Promise<DocumentCommentDto> {
    const exists = await this.prisma.document.count({ where: { id } });
    if (!exists) throw notFound(id);

    const comment = await this.prisma.documentComment.create({
      data: { documentId: id, authorId: input.authorId, body: input.body, at: now() },
    });
    return toCommentDto(comment);
  }

  private async assertValidParent(parentId: string, teamId: string): Promise<void> {
    const parent = await this.prisma.document.findUnique({ where: { id: parentId }, select: { teamId: true } });
    if (!parent) throw new BadRequestException(`Parent document "${parentId}" does not exist`);
    if (parent.teamId !== teamId) throw new BadRequestException("A page can only live under pages of its own space");
  }

  /** `id` plus every descendant, in one recursive query. Empty when `id` doesn't exist. */
  private async subtreeIds(id: string, db: Prisma.TransactionClient = this.prisma): Promise<string[]> {
    const rows = await db.$queryRaw<{ id: string }[]>`
      WITH RECURSIVE subtree AS (
        SELECT id FROM "Document" WHERE id = ${id}
        UNION ALL
        SELECT d.id FROM "Document" d JOIN subtree s ON d."parentId" = s.id
      )
      SELECT id FROM subtree`;
    return rows.map((row) => row.id);
  }
}

function notFound(id: string): NotFoundException {
  return new NotFoundException(`Document "${id}" not found`);
}

function toDto(doc: Omit<Document, "content">): DocumentDto {
  const dto: DocumentDto = {
    id: doc.id,
    teamId: doc.teamId,
    title: doc.title,
    parentId: doc.parentId,
    updatedAt: doc.updatedAt.toISOString(),
    updatedById: doc.updatedById,
  };

  // Only filled properties are sent, matching the frontend's optional `properties`.
  const properties: DocumentPropertiesDto = {};
  if (doc.propStatus != null) properties.status = doc.propStatus;
  if (doc.propOwnerId != null) properties.ownerId = doc.propOwnerId;
  if (doc.propTags.length > 0) properties.tags = doc.propTags;
  if (Object.keys(properties).length > 0) dto.properties = properties;

  return dto;
}

function toCommentDto(comment: DocumentComment): DocumentCommentDto {
  return {
    id: comment.id,
    documentId: comment.documentId,
    authorId: comment.authorId,
    body: comment.body,
    at: comment.at.toISOString(),
  };
}
