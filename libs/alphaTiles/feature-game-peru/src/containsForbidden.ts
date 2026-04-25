// Peru.java rejects any candidate containing the Arabic ligature 'للہ'.
const FORBIDDEN = 'للہ';

export function containsForbidden(s: string): boolean {
  return s.includes(FORBIDDEN);
}
