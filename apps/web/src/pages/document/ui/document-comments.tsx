"use client";

import { type FormEvent, useState } from "react";

import type { DocumentComment } from "@/entities/document";
import { type User, UserAvatar } from "@/entities/user";
import { now } from "@/shared/config";
import { formatRelative } from "@/shared/lib/format-date";
import { Card } from "@/shared/ui/card";

type DocumentCommentsProps = {
  comments: readonly DocumentComment[];
  users: readonly User[];
  currentUser: User;
};

/** Margin comment threads. Replies are kept in memory while data is simulated. */
export function DocumentComments({ comments, users, currentUser }: DocumentCommentsProps) {
  const [replies, setReplies] = useState<Record<string, DocumentComment[]>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const submitReply = (event: FormEvent<HTMLFormElement>, threadId: string) => {
    event.preventDefault();
    if (!draft.trim()) return;

    const body = draft.trim();
    setReplies((current) => {
      const thread = current[threadId] ?? [];
      const reply: DocumentComment = {
        id: `${threadId}-reply-${thread.length + 1}`,
        documentId: threadId,
        authorId: currentUser.id,
        body,
        at: now().toISOString(),
      };
      return { ...current, [threadId]: [...thread, reply] };
    });
    setDraft("");
    setReplyingTo(null);
  };

  return (
    <div className="flex flex-col gap-3">
      {comments.map((thread) => (
        <Card key={thread.id} className="flex max-w-[260px] flex-col gap-2.5 rounded-[18px] p-4">
          {[thread, ...(replies[thread.id] ?? [])].map((comment) => {
            const author = users.find((user) => user.id === comment.authorId);
            return (
              <div key={comment.id} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2.5">
                  {author && <UserAvatar user={author} size={28} ring />}
                  <span className="text-sm font-semibold">{author?.shortName}</span>
                  <span className="ml-auto font-mono text-[10px] whitespace-nowrap text-ink-muted uppercase">{formatRelative(comment.at)}</span>
                </div>
                <p className="text-sm leading-normal">{comment.body}</p>
              </div>
            );
          })}

          {replyingTo === thread.id ? (
            <form onSubmit={(event) => submitReply(event, thread.id)}>
              <label htmlFor={`reply-${thread.id}`} className="sr-only">
                Respuesta
              </label>
              <input
                id={`reply-${thread.id}`}
                autoFocus
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onBlur={() => !draft && setReplyingTo(null)}
                placeholder="Responder…"
                className="h-9 w-full rounded-[10px] border border-input bg-surface px-3 text-sm outline-none placeholder:text-ink-faint focus-visible:border-ink-muted"
              />
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setReplyingTo(thread.id)}
              className="cursor-pointer self-start text-[13px] font-semibold text-team-strong"
            >
              Responder
            </button>
          )}
        </Card>
      ))}
    </div>
  );
}
