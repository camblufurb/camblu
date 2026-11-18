import type { GestaoMember, GestaoTerm } from '../types/domain';

function extractTermTimestamp(term: Pick<GestaoTerm, 'id' | 'createdAt'>): number {
  if (term.createdAt) {
    const parsed = Date.parse(term.createdAt);
    if (Number.isFinite(parsed)) return parsed;
  }
  const match = term.id.match(/^gestao-\d{4}-([a-z0-9]+)$/i);
  if (match?.[1]) {
    const decoded = Number.parseInt(match[1], 36);
    if (Number.isFinite(decoded)) return decoded;
  }
  return 0;
}

/**
 * Sorts management terms from newest year to oldest, breaking same-year ties
 * by registration timestamp descending so newly created terms always appear first.
 */
export function sortGestaoTermsDesc(terms: GestaoTerm[]): GestaoTerm[] {
  return [...terms].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    const tsDiff = extractTermTimestamp(b) - extractTermTimestamp(a);
    if (tsDiff !== 0) return tsDiff;
    return b.id.localeCompare(a.id);
  });
}

/**
 * Builds one marquee half guaranteed to be wide enough (>= minItems) so any desktop
 * viewport stays 100% filled at both 0% and -50% loop offsets without blank tails or jumps.
 */
export function buildMarqueeRowItems(
  members: GestaoMember[],
  rowIndex: number,
  rowCount = 3,
  minItems = 24,
): GestaoMember[] {
  if (members.length === 0) return [];
  const subset = members.filter((_, i) => i % rowCount === rowIndex);
  const source = subset.length > 0 ? subset : members;
  const repeated: GestaoMember[] = [];
  while (repeated.length < minItems) {
    repeated.push(...source);
  }
  return repeated;
}

export function getMemberInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CM';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
