// Minimal structural interfaces — satisfied by runtime types from util-lang-pack-parser
// and util-phoneme. No imports needed; duck typing ensures compatibility.

export interface StageTile {
  base: string;
  stageOfFirstAppearance: number;
}

export interface StageWord {
  wordInLOP: string;
  /** Raw string from wordlist col 5 — digit string or empty. */
  stageOfFirstAppearance: string;
}

export interface ParsedWordTile {
  base: string;
}
