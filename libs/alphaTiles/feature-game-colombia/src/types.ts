/**
 * Shared types for the Colombia game.
 *
 * KeyTile = a single rendered keyboard slot. WordPiece = the textual unit (tile or
 * syllable) tracked in clickedKeys for evaluation purposes.
 */
export type KeyTile = {
  text: string;
  bgColor: string;
  /** typeOfThisTileInstance — only set for T variants (used by CL4 color rule). */
  type?: string;
};

export type WordPiece = {
  text: string;
};

export type ColombiaVariant = 'T' | 'S';
export type ChallengeLevel = 1 | 2 | 3 | 4;

export type AttemptStatus = 'yellow' | 'orange' | 'gray' | 'green';
