/**
 * Build a row of syllable choices for SL1 / SL2 of Brazil.
 *
 * Port of Brazil.java setUpSyllables (~lines 470-530):
 * - SL1 (CL=1, syllableGame=S): SYLLABLES[0..3] from pre-shuffled pool, then
 *   guarantee correct.
 * - SL2 (CL>=2, syllableGame=S): correct + 3 distractors from syllableHashMap;
 *   if duplicates collapse the set, fill with random syllables.
 */
import type { LangAssets } from '@alphaTiles/data-language-assets';
import type { Choice } from './buildChoices';

type SyllableRow = LangAssets['syllables']['rows'][number];

const SLOT_COUNT = 15;

export type BuildSyllableChoicesArgs = {
  challengeLevel: number;
  correct: SyllableRow;
  syllablePool: string[];
  allSyllables: SyllableRow[];
  rand?: () => number;
};

export function buildSyllableChoices({
  challengeLevel,
  correct,
  syllablePool,
  allSyllables,
  rand = Math.random,
}: BuildSyllableChoicesArgs): { choices: Choice[]; visibleChoiceCount: number } {
  const visibleChoiceCount = 4;

  if (challengeLevel === 1) {
    const shuffled = shuffle(syllablePool.slice(), rand);
    const slice = shuffled.slice(0, visibleChoiceCount);
    if (!slice.includes(correct.syllable)) {
      const overwriteAt = Math.floor(rand() * Math.max(slice.length, 1));
      slice[overwriteAt] = correct.syllable;
    }
    while (slice.length < visibleChoiceCount) slice.push('');
    const choices: Choice[] = Array.from({ length: SLOT_COUNT }, (_, i) =>
      i < visibleChoiceCount ? { text: slice[i], visible: true } : { text: '', visible: false },
    );
    return { choices, visibleChoiceCount };
  }

  // SL2: correct + 3 distractors; backfill from random syllables if dedup loses entries.
  const set = new Set<string>([correct.syllable, ...correct.distractors]);
  while (set.size < 4 && allSyllables.length > 0) {
    set.add(allSyllables[Math.floor(rand() * allSyllables.length)].syllable);
  }
  const slice = shuffle(Array.from(set), rand).slice(0, 4);
  if (!slice.includes(correct.syllable) && slice.length > 0) {
    const overwriteAt = Math.floor(rand() * slice.length);
    slice[overwriteAt] = correct.syllable;
  }
  while (slice.length < visibleChoiceCount) slice.push('');
  const choices: Choice[] = Array.from({ length: SLOT_COUNT }, (_, i) =>
    i < visibleChoiceCount ? { text: slice[i], visible: true } : { text: '', visible: false },
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
