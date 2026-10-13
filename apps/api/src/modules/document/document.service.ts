import { randomUUID } from "node:crypto";

import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { Document, DocumentComment, Prisma } from "@prisma/client";

import type { DocumentCommentDto, DocumentDto, DocumentPropertiesDto } from "@/contracts";
import { PrismaService } from "@/prisma/prisma.service";
import { now } from "@/shared/clock";

import { recordActivity } from "../activity/activity.recorder";
import { mentionedUserIds, nameOf, notify } from "../notification/notification.recorder";
import type { AddDocumentCommentDto, CreateDocumentDto, UpdateDocumentDto } from "./dto";
import { extractTaskMentions, extractUserMentions } from "./task-mentions";

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
      select: { comments: { orderBy: [{ at: "asc" }, { position: "asc" }] } },
    });
    if (!doc) throw notFound(id);
    return doc.comments.map(toCommentDto);
  }

  async create(input: CreateDocumentDto, authorId: string): Promise<DocumentDto> {
    if (input.parentId) await this.assertValidParent(input.parentId, input.teamId);
    if (input.coverTone) await this.assertTone(input.coverTone);

    return this.prisma.$transaction(async (tx) => {
      const doc = await tx.document.create({
        data: {
          id: `doc-${randomUUID()}`,
          teamId: input.teamId,
          title: input.title,
          parentId: input.parentId ?? null,
          updatedById: authorId,
          updatedAt: now(),
          content: input.content ?? EMPTY_CONTENT,
          propStatus: input.properties?.status ?? null,
          propOwnerId: input.properties?.ownerId ?? null,
          propTags: input.properties?.tags ?? [],
          icon: input.icon || null,
          coverTone: input.coverTone || null,
          isDraft: input.isDraft ?? false,
        },
        omit: omitContent,
      });
      if (input.content !== undefined) {
        await syncTaskMentions(tx, doc.id, input.content);
        await notifyNewMentions(tx, { documentId: doc.id, title: doc.title, actorId: authorId, before: "", after: input.content });
      }
      await recordActivity(tx, { teamId: doc.teamId, actorId: authorId, summary: `creó la página ${doc.title}` });
      return toDto(doc);
    });
  }

  async update(id: string, input: UpdateDocumentDto, editorId: string): Promise<DocumentDto> {
    const current = await this.prisma.document.findUnique({
      where: { id },
      select: { teamId: true, content: input.content !== undefined },
    });
    if (!current) throw notFound(id);
    if (input.coverTone) await this.assertTone(input.coverTone);

    if (input.parentId) {
      await this.assertValidParent(input.parentId, current.teamId);
      if ((await this.subtreeIds(id)).includes(input.parentId)) {
        throw new BadRequestException("A page cannot be moved inside itself or one of its subpages");
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // `undefined` leaves a column untouched; `null` clears it.
      const doc = await tx.document.update({
        where: { id },
        data: {
          title: input.title,
          content: input.content,
          parentId: input.parentId,
          updatedById: editorId,
          updatedAt: now(),
          propStatus: input.properties?.status,
          propOwnerId: input.properties?.ownerId,
          propTags: input.properties?.tags,
          icon: input.icon === undefined ? undefined : input.icon || null,
          coverTone: input.coverTone === undefined ? undefined : input.coverTone || null,
          isDraft: input.isDraft,
        },
        omit: omitContent,
      });
      if (input.content !== undefined) {
        await syncTaskMentions(tx, id, input.content);
        // Autosave rewrites the page constantly: only mentions that weren't there before notify.
        await notifyNewMentions(tx, { documentId: id, title: doc.title, actorId: editorId, before: current.content ?? "", after: input.content });
      }
      return toDto(doc);
    });
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

  /**
   * A new thread, or a reply when `parentId` points at a thread of this same page.
   * `@Name` mentions notify those people; a new thread notifies the page owner, a reply the thread's participants.
   */
  async addComment(id: string, { body, parentId }: AddDocumentCommentDto, authorId: string): Promise<DocumentCommentDto> {
    const doc = await this.prisma.document.findUnique({ where: { id }, select: { teamId: true, title: true, propOwnerId: true } });
    if (!doc) throw notFound(id);

    if (parentId) {
      const parent = await this.prisma.documentComment.findUnique({
        where: { id: parentId },
        select: { documentId: true, parentId: true },
      });
      if (!parent || parent.documentId !== id) throw new BadRequestException("The thread doesn't belong to this page");
      if (parent.parentId) throw new BadRequestException("Reply to the thread, not to another reply");
    }

    return this.prisma.$transaction(async (tx) => {
      const comment = await tx.documentComment.create({ data: { documentId: id, parentId: parentId ?? null, authorId, body, at: now() } });
      await recordActivity(tx, { teamId: doc.teamId, actorId: authorId, summary: `${parentId ? "respondió" : "comentó"} en ${doc.title}` });

      const actor = await nameOf(tx, authorId);
      const mentioned = await mentionedUserIds(tx, body);
      await notify(tx, { recipients: mentioned, actorId: authorId, kind: "mention", title: `${actor} te mencionó en ${doc.title}`, excerpt: body, documentId: id });

      const participants = parentId
        ? (await tx.documentComment.findMany({ where: { OR: [{ id: parentId }, { parentId }] }, select: { authorId: true } })).map((c) => c.authorId)
        : [doc.propOwnerId];
      await notify(tx, {
        recipients: participants.filter((userId) => userId && !mentioned.includes(userId)),
        actorId: authorId,
        kind: "comment",
        title: `${actor} ${parentId ? "respondió" : "comentó"} en ${doc.title}`,
        excerpt: body,
        documentId: id,
      });
      return toCommentDto(comment);
    });
  }

  /** Cover tones are team palette keys. */
  private async assertTone(tone: string): Promise<void> {
    if (!(await this.prisma.team.count({ where: { id: tone } }))) throw new BadRequestException(`Unknown tone "${tone}"`);
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

/** Rebuilds the page's task backlinks from the pills in its HTML (unknown ids are ignored). */
async function syncTaskMentions(tx: Prisma.TransactionClient, documentId: string, html: string): Promise<void> {
  const ids = extractTaskMentions(html);
  const tasks = ids.length ? await tx.task.findMany({ where: { id: { in: ids } }, select: { id: true } }) : [];
  await tx.documentTaskMention.deleteMany({ where: { documentId } });
  if (tasks.length) {
    await tx.documentTaskMention.createMany({ data: tasks.map(({ id }) => ({ documentId, taskId: id })) });
  }
}

/** People and task assignees mentioned with pills that weren't in the previous version of the page. */
async function notifyNewMentions(
  tx: Prisma.TransactionClient,
  { documentId, title, actorId, before, after }: { documentId: string; title: string; actorId: string; before: string; after: string },
): Promise<void> {
  const added = (extract: (html: string) => string[]) => {
    const previous = new Set(extract(before));
    return extract(after).filter((id) => !previous.has(id));
  };
  const newPeople = added(extractUserMentions);
  const newTasks = added(extractTaskMentions);
  if (newPeople.length === 0 && newTasks.length === 0) return;

  const actor = await nameOf(tx, actorId);
  if (newPeople.length) {
    const people = await tx.user.findMany({ where: { id: { in: newPeople } }, select: { id: true } });
    await notify(tx, { recipients: people.map((p) => p.id), actorId, kind: "mention", title: `${actor} te mencionó en ${title}`, documentId });
  }
  const tasks = newTasks.length ? await tx.task.findMany({ where: { id: { in: newTasks } }, select: { id: true, assigneeId: true } }) : [];
  for (const task of tasks) {
    await notify(tx, { recipients: [task.assigneeId], actorId, kind: "mention", title: `${actor} mencionó ${task.id} en ${title}`, taskId: task.id, documentId });
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
  if (doc.icon) dto.icon = doc.icon;
  if (doc.coverTone) dto.coverTone = doc.coverTone;
  if (doc.isDraft) dto.isDraft = true;

  return dto;
}

function toCommentDto(comment: DocumentComment): DocumentCommentDto {
  return {
    id: comment.id,
    documentId: comment.documentId,
    parentId: comment.parentId,
    authorId: comment.authorId,
    body: comment.body,
    at: comment.at.toISOString(),
  };
}
