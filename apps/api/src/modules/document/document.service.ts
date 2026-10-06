import { randomUUID } from "node:crypto";

import { Injectable, NotFoundException } from "@nestjs/common";
import type { Document, DocumentComment } from "@prisma/client";

import type { DocumentCommentDto, DocumentDto, DocumentPropertiesDto } from "@/contracts";
import { PrismaService } from "@/prisma/prisma.service";
import { now } from "@/shared/clock";

import type { AddDocumentCommentDto, CreateDocumentDto, UpdateDocumentDto } from "./dto";

export type DocumentTreeNode = DocumentDto & { children: DocumentTreeNode[] };

@Injectable()
export class DocumentService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<DocumentDto[]> {
    const docs = await this.prisma.document.findMany({ orderBy: { id: "asc" } });
    return docs.map(toDto);
  }

  async findForTeam(teamId: string): Promise<DocumentDto[]> {
    const docs = await this.prisma.document.findMany({ where: { teamId }, orderBy: { id: "asc" } });
    return docs.map(toDto);
  }

  async findRecent(teamId: string, limit = 4): Promise<DocumentDto[]> {
    const docs = await this.prisma.document.findMany({
      where: { teamId },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
    return docs.map(toDto);
  }

  /** Nested tree for a team's sidebar (parentId -> children), preserving order. */
  async findTree(teamId: string): Promise<DocumentTreeNode[]> {
    const docs = await this.findForTeam(teamId);
    const nodes = new Map<string, DocumentTreeNode>(docs.map((doc) => [doc.id, { ...doc, children: [] }]));
    const roots: DocumentTreeNode[] = [];
    for (const node of nodes.values()) {
      const parent = node.parentId ? nodes.get(node.parentId) : undefined;
      (parent ? parent.children : roots).push(node);
    }
    return roots;
  }

  async findOne(id: string): Promise<DocumentDto> {
    return toDto(await this.ensureExists(id));
  }

  async getContent(id: string): Promise<{ content: string }> {
    const doc = await this.ensureExists(id);
    return { content: doc.content || "<p></p>" };
  }

  async getComments(id: string): Promise<DocumentCommentDto[]> {
    await this.ensureExists(id);
    const comments = await this.prisma.documentComment.findMany({
      where: { documentId: id },
      orderBy: { at: "asc" },
    });
    return comments.map(toCommentDto);
  }

  async create(input: CreateDocumentDto): Promise<DocumentDto> {
    if (input.parentId) await this.ensureExists(input.parentId);
    const doc = await this.prisma.document.create({
      data: {
        id: `doc-${randomUUID()}`,
        teamId: input.teamId,
        title: input.title,
        parentId: input.parentId ?? null,
        updatedById: input.updatedById,
        updatedAt: now().toISOString(),
        content: input.content ?? "<p></p>",
        propStatus: input.properties?.status ?? null,
        propOwnerId: input.properties?.ownerId ?? null,
        propTags: input.properties?.tags ?? [],
      },
    });
    return toDto(doc);
  }

  async update(id: string, input: UpdateDocumentDto): Promise<DocumentDto> {
    const current = await this.ensureExists(id);
    if (input.parentId) {
      if (input.parentId === id) throw new NotFoundException("A document cannot be its own parent");
      await this.ensureExists(input.parentId);
    }

    const doc = await this.prisma.document.update({
      where: { id },
      data: {
        title: input.title ?? undefined,
        content: input.content ?? undefined,
        parentId: input.parentId === undefined ? undefined : input.parentId,
        updatedById: input.updatedById ?? current.updatedById,
        updatedAt: now().toISOString(),
        propStatus: input.properties?.status ?? undefined,
        propOwnerId: input.properties?.ownerId ?? undefined,
        propTags: input.properties?.tags ?? undefined,
      },
    });
    return toDto(doc);
  }

  /** Deletes a page and its whole subtree (Notion semantics). */
  async remove(id: string): Promise<{ deletedIds: string[] }> {
    await this.ensureExists(id);
    const all = await this.prisma.document.findMany({ select: { id: true, parentId: true } });
    const childrenOf = new Map<string, string[]>();
    for (const doc of all) {
      if (!doc.parentId) continue;
      const list = childrenOf.get(doc.parentId) ?? [];
      list.push(doc.id);
      childrenOf.set(doc.parentId, list);
    }

    const toDelete: string[] = [];
    const stack = [id];
    while (stack.length) {
      const current = stack.pop()!;
      toDelete.push(current);
      stack.push(...(childrenOf.get(current) ?? []));
    }

    // Delete leaves first so self-relation FKs stay satisfied.
    await this.prisma.document.deleteMany({ where: { id: { in: toDelete } } });
    return { deletedIds: toDelete };
  }

  async addComment(id: string, input: AddDocumentCommentDto): Promise<DocumentCommentDto> {
    await this.ensureExists(id);
    const comment = await this.prisma.documentComment.create({
      data: { documentId: id, authorId: input.authorId, body: input.body, at: now().toISOString() },
    });
    return toCommentDto(comment);
  }

  private async ensureExists(id: string): Promise<Document> {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException(`Document "${id}" not found`);
    return doc;
  }
}

function toDto(doc: Document): DocumentDto {
  const dto: DocumentDto = {
    id: doc.id,
    teamId: doc.teamId,
    title: doc.title,
    parentId: doc.parentId,
    updatedAt: doc.updatedAt,
    updatedById: doc.updatedById,
  };

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
    at: comment.at,
  };
}
