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
  { index: 10, classKey: "georgia", challengeLevel: 2, syllOrTile: "S" },
  { index: 11, classKey: "georgia", challengeLevel: 3, syllOrTile: "S" },
  { index: 12, classKey: "mexico", challengeLevel: 1, syllOrTile: "T" },
  { index: 13, classKey: "mexico", challengeLevel: 2, syllOrTile: "T" },
  { index: 14, classKey: "mexico", challengeLevel: 3, syllOrTile: "T" },
  { index: 15, classKey: "ecuador", challengeLevel: 1, syllOrTile: "T" },
  { index: 16, classKey: "thailand", challengeLevel: 145, syllOrTile: "T" },
  { index: 17, classKey: "thailand", challengeLevel: 245, syllOrTile: "T" },
  { index: 18, classKey: "thailand", challengeLevel: 154, syllOrTile: "T" },
  { index: 19, classKey: "thailand", challengeLevel: 254, syllOrTile: "T" },
  { index: 20, classKey: "colombia", challengeLevel: 1, syllOrTile: "S" },
  { index: 21, classKey: "colombia", challengeLevel: 2, syllOrTile: "S" },
  { index: 22, classKey: "colombia", challengeLevel: 3, syllOrTile: "S" },
  { index: 23, classKey: "brazil", challengeLevel: 1, syllOrTile: "S" },
];

/**
 * Stable key for joining hand-authored content to a game row.
 * Uses the parser-derived classKey (kebab-case) so a future Country rename
 * upstream doesn't silently invalidate every content entry.
 */
export function doorContentKey(row: { classKey: string; challengeLevel: number; syllOrTile: 'T' | 'S' }): string {
  return `${row.classKey}-${row.challengeLevel}-${row.syllOrTile}`;
}
