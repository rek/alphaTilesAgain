import type { ParsedWordTile, StageTile, StageWord } from './types';

// Fraction of word's tiles whose base appears in stageTiles. Returns 0..1.
export function computeStageCorrespondence<
  W extends StageWord,
  ST extends StageTile,
  PT extends ParsedWordTile,
>(
  word: W,
  stageTiles: ST[],
  parseWordIntoTiles: (word: W) => PT[],
): number {
  const wordTiles = parseWordIntoTiles(word);
  if (wordTiles.length === 0) return 0;
  const stageBaseSet = new Set(stageTiles.map((t) => t.base));
  const matching = wordTiles.filter((t) => stageBaseSet.has(t.base)).length;
  return matching / wordTiles.length;
}
