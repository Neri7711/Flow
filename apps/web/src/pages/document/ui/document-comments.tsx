"use client";

import { type FormEvent, useState } from "react";

import { addDocumentComment, type DocumentComment } from "@/entities/document";
import { type User, UserAvatar } from "@/entities/user";
import { formatRelative } from "@/shared/lib/format-date";
import { toast } from "@/shared/lib/toast";
import { Card } from "@/shared/ui/card";

type DocumentCommentsProps = {
  documentId: string;
  /** Flat list as the API returns it: threads (`parentId: null`) and their replies. */
  comments: readonly DocumentComment[];
  users: readonly User[];
};

/** Margin comment threads; replies are saved as the signed-in user. */
export function DocumentComments({ documentId, comments, users }: DocumentCommentsProps) {
  const [all, setAll] = useState(comments);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const threads = all.filter((comment) => comment.parentId === null);

  const submitReply = async (event: FormEvent<HTMLFormElement>, threadId: string) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;

    setSending(true);
    try {
      const saved = await addDocumentComment(documentId, body, threadId);
      setAll((current) => [...current, saved]);
      setDraft("");
      setReplyingTo(null);
    } catch {
      toast("No se pudo publicar la respuesta.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {threads.map((thread) => (
        <Card key={thread.id} className="flex max-w-[260px] flex-col gap-2.5 rounded-[18px] p-4">
          {[thread, ...all.filter((comment) => comment.parentId === thread.id)].map((comment) => {
            const author = users.find((user) => user.id === comment.authorId);
            return (
              <div key={comment.id} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2.5">
                  {author && <UserAvatar user={author} size={28} ring />}
                  <span className="text-sm font-semibold">{author?.shortName}</span>
                  <span className="ml-auto font-mono text-[10px] whitespace-nowrap text-ink-muted uppercase" suppressHydrationWarning>{formatRelative(comment.at)}</span>
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
                disabled={sending}
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
