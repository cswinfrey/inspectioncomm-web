export type MediaGroup<T> = { tag: string; items: T[] };

const UNTAGGED = 'Untagged';

// Groups media items by their tag, alphabetical by tag with "Untagged" last,
// so the gallery reads as clusters of like photos rather than a flat list.
export function groupMediaByTag<T extends { tag: string | null }>(
  media: T[]
): MediaGroup<T>[] {
  const groups = new Map<string, T[]>();

  for (const item of media) {
    const key = item.tag?.trim() || UNTAGGED;
    const existing = groups.get(key);
    if (existing) {
      existing.push(item);
    } else {
      groups.set(key, [item]);
    }
  }

  const keys = [...groups.keys()].sort((a, b) => {
    if (a === UNTAGGED) return 1;
    if (b === UNTAGGED) return -1;
    return a.localeCompare(b);
  });

  return keys.map((tag) => ({ tag, items: groups.get(tag)! }));
}
