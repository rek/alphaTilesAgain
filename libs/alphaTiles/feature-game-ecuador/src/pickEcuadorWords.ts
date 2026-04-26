/**
 * Port of Ecuador.java setWords() ~331–347.
 *
 * Steps (Java parity):
 *   1. Shuffle a copy of cumulativeStageBasedWordList.
 *   2. refWord = wordPool[0] (the prompt).
 *   3. tileWords = wordPool[1..8] (8 entries).
 *   4. Pick correctSlot = floor(rng() * 8).
 *   5. OVERWRITE tileWords[correctSlot] semantics: at render time the prompt's
 *      LOP text is rendered at correctSlot. We track correctSlot only and the
 *      caller renders prompt.wordInLOP at that slot.
 *
 * Java does NOT dedupe (per JP TODO at file head) — preserved here.
 */

import type { LangAssets } from '@alphaTiles/data-language-pack';

type Word = LangAssets['words']['rows'][number];

export type EcuadorWordPick =
  | {
      prompt: Word;
      tileWords: Word[];
      correctSlot: number;
    }
  | { error: 'insufficient-content' };

const REQUIRED_WORDS = 9; // 1 prompt + 8 tile slots
const TILE_COUNT = 8;

function shuffle<T>(arr: ReadonlyArray<T>, rng: () => number): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

export function pickEcuadorWords(opts: {
  words: ReadonlyArray<Word>;
  rng?: () => number;
}): EcuadorWordPick {
  const rng = opts.rng ?? Math.random;
  if (opts.words.length < REQUIRED_WORDS) {
    return { error: 'insufficient-content' };
  }
  const shuffled = shuffle(opts.words, rng);
  const prompt = shuffled[0];
  const tileWords = shuffled.slice(1, 1 + TILE_COUNT);
  const correctSlot = Math.floor(rng() * TILE_COUNT);
  return { prompt, tileWords, correctSlot };
}
