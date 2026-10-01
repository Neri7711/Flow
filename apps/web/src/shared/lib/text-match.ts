/** Lowercase without diacritics, so "diseno" matches "Diseño". */
export function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export type MatchParts = { before: string; match: string; after: string };

/**
 * Splits `text` around the first case/accent-insensitive occurrence of `query`.
 * Returns `null` when there is no match. Normalization keeps string length for
 * Spanish text (one base char per accented char), so indexes map back 1:1.
 */
export function findMatch(text: string, query: string): MatchParts | null {
  const needle = normalize(query.trim());
  if (!needle) return null;

  const index = normalize(text).indexOf(needle);
  if (index === -1) return null;

  return {
    before: text.slice(0, index),
    match: text.slice(index, index + needle.length),
    after: text.slice(index + needle.length),
  };
}
