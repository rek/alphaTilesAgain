// AUTO-GENERATED — DO NOT EDIT.
// Source: languages/yue/aa_games.txt
// Regenerate: bun tools/generate-cantonese-doors.ts

export type YueGameRow = {
  index: number;
  classKey: string;
  challengeLevel: number;
  syllOrTile: 'T' | 'S';
};

export const YUE_GAME_ROWS: readonly YueGameRow[] = [
  { index: 1, classKey: "thailand", challengeLevel: 165, syllOrTile: "T" },
  { index: 2, classKey: "thailand", challengeLevel: 265, syllOrTile: "T" },
  { index: 3, classKey: "thailand", challengeLevel: 365, syllOrTile: "T" },
  { index: 4, classKey: "thailand", challengeLevel: 234, syllOrTile: "T" },
  { index: 5, classKey: "thailand", challengeLevel: 344, syllOrTile: "T" },
  { index: 6, classKey: "taiwan", challengeLevel: 1, syllOrTile: "T" },
  { index: 7, classKey: "taiwan", challengeLevel: 2, syllOrTile: "T" },
  { index: 8, classKey: "taiwan", challengeLevel: 3, syllOrTile: "T" },
  { index: 9, classKey: "georgia", challengeLevel: 1, syllOrTile: "S" },
];

/**
 * Stable key for joining hand-authored content to a game row.
 * Uses the parser-derived classKey (kebab-case) so a future Country rename
 * upstream doesn't silently invalidate every content entry.
 */
export function doorContentKey(row: { classKey: string; challengeLevel: number; syllOrTile: 'T' | 'S' }): string {
  return `${row.classKey}-${row.challengeLevel}-${row.syllOrTile}`;
}
