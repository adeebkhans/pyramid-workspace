/**
 * Deterministic avatar generation.
 *
 * A workspace board shows a lot of faces at once, so each member needs a
 * visually distinct portrait. Rather than requiring an upload, one is derived
 * from a seed — the member's email, falling back to their id.
 *
 * "Deterministic" is the important word: the same seed always yields the same
 * face and the same background, so a member's avatar never changes between page
 * loads, deploys or database re-seeds, and nothing has to be stored.
 */

/** DiceBear collections that read as illustrated head-and-shoulders portraits. */
const PORTRAIT_COLLECTIONS = ['notionists', 'adventurer', 'lorelei', 'micah', 'open-peeps'] as const;

/** Soft pastel backgrounds that sit comfortably in both light and dark themes. */
const BACKGROUND_SWATCHES = ['c0aede', 'b6e3f4', 'd1d4f9', 'ffd5dc', 'ffdfbf', 'c9f2d4'] as const;

const DICEBEAR_ENDPOINT = 'https://api.dicebear.com/9.x';

/** FNV-1a — small, fast, and stable across Node versions (unlike `hashCode`-style sums). */
export function stableHash(seed: string): number {
  let hash = 0x811c9dc5;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

export interface AvatarOptions {
  /** Overrides the automatically chosen collection. */
  collection?: (typeof PORTRAIT_COLLECTIONS)[number];
  size?: number;
}

export function buildAvatarUrl(seed: string, options: AvatarOptions = {}): string {
  const normalisedSeed = seed.trim().toLowerCase() || 'anonymous';
  const hash = stableHash(normalisedSeed);

  const collection = options.collection ?? PORTRAIT_COLLECTIONS[hash % PORTRAIT_COLLECTIONS.length];
  const background = BACKGROUND_SWATCHES[(hash >>> 8) % BACKGROUND_SWATCHES.length];

  const query = new URLSearchParams({
    seed: normalisedSeed,
    backgroundColor: background,
    radius: '50',
    scale: '90',
  });

  if (options.size) query.set('size', String(options.size));

  return `${DICEBEAR_ENDPOINT}/${collection}/svg?${query.toString()}`;
}

/** Up to two upper-case letters, used by the client when an image fails to load. */
export function buildInitials(displayName: string): string {
  const words = displayName
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter(Boolean);

  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}
