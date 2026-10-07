/** `<span ... data-type="task-mention" ... data-id="PL-42" ...>` as TipTap serializes pills. */
const pillTag = (type: string) => new RegExp(`<span\\b[^>]*\\bdata-type="${type}"[^>]*>`, "g");
const DATA_ID = /\bdata-id="([^"]+)"/;

function extractPills(html: string, type: "task-mention" | "user-mention"): string[] {
  const ids = new Set<string>();
  for (const [tag] of html.matchAll(pillTag(type))) {
    const id = DATA_ID.exec(tag)?.[1];
    if (id) ids.add(id);
  }
  return [...ids];
}

/** Identifiers of the tasks mentioned in a page's HTML, without duplicates, in order of appearance. */
export function extractTaskMentions(html: string): string[] {
  return extractPills(html, "task-mention");
}

/** Ids of the people mentioned with user pills (`data-type="user-mention" data-id="u-ana"`). */
export function extractUserMentions(html: string): string[] {
  return extractPills(html, "user-mention");
}
