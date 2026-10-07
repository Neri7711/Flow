/** `<span ... data-type="task-mention" ... data-id="PL-42" ...>` as TipTap serializes task pills. */
const MENTION_TAG = /<span\b[^>]*\bdata-type="task-mention"[^>]*>/g;
const DATA_ID = /\bdata-id="([^"]+)"/;

/** Identifiers of the tasks mentioned in a page's HTML, without duplicates, in order of appearance. */
export function extractTaskMentions(html: string): string[] {
  const ids = new Set<string>();
  for (const [tag] of html.matchAll(MENTION_TAG)) {
    const id = DATA_ID.exec(tag)?.[1];
    if (id) ids.add(id);
  }
  return [...ids];
}
