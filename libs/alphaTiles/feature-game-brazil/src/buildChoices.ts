/**
 * Build the row of tile choices for one Brazil round.
 *
 * Port of Brazil.java setUpTiles (~lines 350-470). One pure fn covers all 7
 * challenge levels:
 * - CL1 / CL4: random fill from VOWELS / CONSONANTS pool, then guarantee correct.
 * - CL2 / CL5: correct + 3 distractors from `correct.distractors`, shuffled.
 * - CL3 / CL6: first N (≤15) of pool, then guarantee correct.
 * - CL7: first N (≤4) of TONES, then guarantee correct; remaining slots hidden.
 */
import type { LangAssets } from '@alphaTiles/data-language-assets';

type TileRow = LangAssets['tiles']['rows'][number];

export type Choice = { text: string; visible: boolean };

export type BuildChoicesArgs = {
  challengeLevel: number;
  correct: { base: string; alt1: string; alt2: string; alt3: string };
  vowels: TileRow[];
  consonants: TileRow[];
  tones: TileRow[];
  rand?: () => number;
};

const SLOT_COUNT = 15; // max grid slots; UI hides beyond visibleChoiceCount

export function buildChoices({
  challengeLevel,
  correct,
  vowels,
  consonants,
  tones,
  rand = Math.random,
}: BuildChoicesArgs): { choices: Choice[]; visibleChoiceCount: number } {
  const correctText = correct.base;
  const distractors: [string, string, string] = [correct.alt1, correct.alt2, correct.alt3];

  if (challengeLevel === 3 || challengeLevel === 6) {
    const pool = challengeLevel === 3 ? vowels : consonants;
    const visibleChoiceCount = Math.min(pool.length, 15);
    const shuffled = shuffle(pool.slice(), rand);
    const slice = shuffled.slice(0, visibleChoiceCount).map((t) => t.base);
    ensureCorrect(slice, correctText, rand);
    const choices: Choice[] = Array.from({ length: SLOT_COUNT }, (_, i) =>
      i < visibleChoiceCount ? { text: slice[i], visible: true } : { text: '', visible: false },
    );
    return { choices, visibleChoiceCount };
  }

  if (challengeLevel === 7) {
    const visibleChoiceCount = Math.min(tones.length, 4);
    const shuffled = shuffle(tones.slice(), rand);
    const slice = shuffled.slice(0, visibleChoiceCount).map((t) => t.base);
    ensureCorrect(slice, correctText, rand);
    const choices: Choice[] = Array.from({ length: SLOT_COUNT }, (_, i) =>
      i < visibleChoiceCount ? { text: slice[i], visible: true } : { text: '', visible: false },
    );
    return { choices, visibleChoiceCount };
  }

  if (challengeLevel === 1 || challengeLevel === 4) {
    const pool = challengeLevel === 1 ? vowels : consonants;
    const visibleChoiceCount = 4;
    const shuffled = shuffle(pool.slice(), rand);
    const slice = shuffled.slice(0, visibleChoiceCount).map((t) => t.base);
    ensureCorrect(slice, correctText, rand);
    const choices: Choice[] = Array.from({ length: SLOT_COUNT }, (_, i) =>
      i < visibleChoiceCount ? { text: slice[i], visible: true } : { text: '', visible: false },
    );
    return { choices, visibleChoiceCount };
  }

  // CL2 / CL5 — sample 4 unique entries from {correct, distractors[0..2]}.
  const pool4 = [correctText, distractors[0], distractors[1], distractors[2]];
  const slice = shuffle(pool4, rand);
  const visibleChoiceCount = 4;
  // Dedup while preserving order; if duplicates collapsed, append correct first then any remaining unique distractors.
  const unique: string[] = [];
  for (const s of slice) {
    if (s && !unique.includes(s)) unique.push(s);
    if (unique.length === 4) break;
  }
  if (!unique.includes(correctText)) unique[Math.floor(rand() * unique.length)] = correctText;
  while (unique.length < 4) unique.push('');
  const choices: Choice[] = Array.from({ length: SLOT_COUNT }, (_, i) =>
    i < visibleChoiceCount ? { text: unique[i], visible: true } : { text: '', visible: false },
  );
  return { choices, visibleChoiceCount };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function ensureCorrect(slice: string[], correctText: string, rand: () => number): void {
  if (slice.length === 0) return;
  if (slice.includes(correctText)) return;
  const overwriteAt = Math.floor(rand() * slice.length);
  slice[overwriteAt] = correctText;
}
