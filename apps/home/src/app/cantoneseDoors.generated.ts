// AUTO-GENERATED — DO NOT EDIT.
// Source: languages/yue/aa_games.txt
// Regenerate: bun tools/generate-cantonese-doors.ts

export type YueGameRow = {
  index: number;
  country: string;
  challengeLevel: number;
  syllOrTile: 'T' | 'S';
};

export const YUE_GAME_ROWS: readonly YueGameRow[] = [
  { index: 1, country: "Thailand", challengeLevel: 165, syllOrTile: "T" },
  { index: 2, country: "Thailand", challengeLevel: 265, syllOrTile: "T" },
  { index: 3, country: "Thailand", challengeLevel: 365, syllOrTile: "T" },
  { index: 4, country: "Thailand", challengeLevel: 234, syllOrTile: "T" },
  { index: 5, country: "Thailand", challengeLevel: 344, syllOrTile: "T" },
  { index: 6, country: "Taiwan", challengeLevel: 1, syllOrTile: "T" },
  { index: 7, country: "Taiwan", challengeLevel: 2, syllOrTile: "T" },
  { index: 8, country: "Taiwan", challengeLevel: 3, syllOrTile: "T" },
  { index: 9, country: "Georgia", challengeLevel: 1, syllOrTile: "S" },
];

/** Stable key for joining hand-authored content to a game row. */
export function doorContentKey(row: { country: string; challengeLevel: number; syllOrTile: 'T' | 'S' }): string {
  return `${row.country}-${row.challengeLevel}-${row.syllOrTile}`;
}
