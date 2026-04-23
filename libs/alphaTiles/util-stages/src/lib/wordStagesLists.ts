import type { ParsedWordTile, StageTile, StageWord } from './types';

// Ports Start.java buildWordStagesLists (line 475).
// result[i] = words whose earliest fully-covered stage is i+1. Length always 7.
// v1: differentiatesTileTypes=false and firstLetterStageCorrespondence=false assumed;
//     explicit stageOfFirstAppearance column override is applied.
export function wordStagesLists<
  W extends StageWord,
  ST extends StageTile,
  PT extends ParsedWordTile,
>(
  wordList: W[],
  tileStages: ST[][], // length 7, from tileStagesLists()
  parseWordIntoTiles: (word: W) => PT[],
  correspondenceRatio: number,
): W[][] {
  // Find last non-empty stage as default assignment for all words.
  let lastStage = 7;
  for (let i = 6; i >= 0; i--) {
    if (tileStages[i].length > 0) {
      lastStage = i + 1;
      break;
    }
  }

  const stagesOfFirstAppearance = new Map<W, number>();
  for (const word of wordList) {
    stagesOfFirstAppearance.set(word, lastStage);
  }

  // Loop from stage 6 down to 1 (i = 5..0).
  // Each pass lowers a word's assigned stage if cumulative tiles cover it.
  // Final assigned stage = earliest stage where coverage >= correspondenceRatio.
  for (let i = 5; i >= 0; i--) {
    const cumulativeBaseSet = new Set<string>();
    for (let s = 0; s <= i; s++) {
      for (const tile of tileStages[s]) {
        cumulativeBaseSet.add(tile.base);
      }
    }

    for (const word of wordList) {
      const wordTiles = parseWordIntoTiles(word);
      if (wordTiles.length === 0) continue;
      const matching = wordTiles.filter((t) => cumulativeBaseSet.has(t.base)).length;
      if (matching / wordTiles.length >= correspondenceRatio) {
        stagesOfFirstAppearance.set(word, i + 1);
      }
    }
  }

  // Explicit override: wordlist col 5 digit overrides computed stage.
  for (const word of wordList) {
    if (/^[0-9]+$/.test(word.stageOfFirstAppearance)) {
      const stage = parseInt(word.stageOfFirstAppearance, 10);
      if (stage >= 1 && stage <= 7) {
        stagesOfFirstAppearance.set(word, stage);
      }
    }
  }

  const result: W[][] = Array.from({ length: 7 }, () => []);
  for (const word of wordList) {
    const stage = stagesOfFirstAppearance.get(word) ?? lastStage;
    result[stage - 1].push(word);
  }
  return result;
}
