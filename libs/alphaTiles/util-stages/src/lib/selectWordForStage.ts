import type { ParsedWordTile, StageTile, StageWord } from './types';

// Ports GameActivity.java chooseWord() (line 417).
// Mutates previouslyShown in-place (caller owns the array, same as Java Queue).
export function selectWordForStage<
  W extends StageWord,
  ST extends StageTile,
  PT extends ParsedWordTile,
>(opts: {
  stage: number;
  wordStagesLists: W[][];
  previousStagesWordList: W[];
  previouslyShown: string[]; // wordInLOP values; mutated
  correspondenceRatio: number;
  stage1Tiles: ST[];
  parseWordIntoTiles: (word: W) => PT[];
  rng?: () => number;
}): W {
  const {
    stage,
    wordStagesLists,
    previousStagesWordList,
    previouslyShown,
    correspondenceRatio,
    stage1Tiles,
    parseWordIntoTiles,
    rng = Math.random,
  } = opts;

  const stage1WordCount = wordStagesLists[0].length;
  const windowSize = Math.min(stage1WordCount - 1, 12);

  for (;;) {
    // Stage ratchet: find highest non-empty stage <= requested stage.
    let localStage = stage;
    while (localStage > 1 && wordStagesLists[localStage - 1].length === 0) {
      localStage--;
    }

    let candidate: W;

    if (localStage === 1) {
      // Split stage-1 words into high / low correspondence pools.
      const higherThreshold = correspondenceRatio + (1 - correspondenceRatio) / 2;
      const stage1BaseSet = new Set(stage1Tiles.map((t) => t.base));
      const higherWords: W[] = [];
      const lowerWords: W[] = [];

      for (const word of wordStagesLists[0]) {
        const wordTiles = parseWordIntoTiles(word);
        const matching = wordTiles.filter((t) => stage1BaseSet.has(t.base)).length;
        const ratio = wordTiles.length > 0 ? matching / wordTiles.length : 0;
        (ratio >= higherThreshold ? higherWords : lowerWords).push(word);
      }

      if (rng() < 0.5 || lowerWords.length === 0) {
        const pool = higherWords.length > 0 ? higherWords : lowerWords;
        candidate = pool[Math.floor(rng() * pool.length)];
      } else {
        candidate = lowerWords[Math.floor(rng() * lowerWords.length)];
      }
    } else {
      // Stage > 1: 50/50 between current-stage words and all previous-stage words.
      const currentStageWords = wordStagesLists[localStage - 1];
      if (rng() < 0.5) {
        candidate = currentStageWords[Math.floor(rng() * currentStageWords.length)];
      } else {
        candidate = previousStagesWordList[Math.floor(rng() * previousStagesWordList.length)];
      }
    }

    if (!previouslyShown.includes(candidate.wordInLOP)) {
      if (previouslyShown.length >= windowSize) {
        previouslyShown.shift();
      }
      previouslyShown.push(candidate.wordInLOP);
      return candidate;
    }
    // Candidate was recently shown — retry.
  }
}
