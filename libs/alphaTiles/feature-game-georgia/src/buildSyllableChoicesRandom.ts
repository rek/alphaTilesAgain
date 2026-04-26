/**
 * Random syllable-choice branch (S-CL 1, 2, 3).
 *
 * Java reference: Georgia.java ~247–259, ~279–284.
 *
 * After `Collections.shuffle(syllableListCopy)`, the visible slots are the
 * first `visibleGameButtons` entries of the shuffled pool — sequential, NOT
 * a random sample.
 *
 * After the loop, if `correctText` isn't present in any visible slot,
 * overwrite `GAME_BUTTONS[floor(rng() * (visibleGameButtons - 1))]` (last
 * visible slot is never the fallback target — preserved off-by-one).
 */
import type { LangAssets } from '@alphaTiles/data-language-assets';

type SyllableRow = LangAssets['syllables']['rows'][number];

export function buildSyllableChoicesRandom({
  visibleGameButtons,
  syllablePool,
  correctText,
  rng,
}: {
  visibleGameButtons: number;
  syllablePool: SyllableRow[];
  correctText: string;
  rng: () => number;
}): string[] {
  const slots: string[] = [];
  for (let t = 0; t < visibleGameButtons; t++) {
    slots.push(syllablePool[t]?.syllable ?? '');
  }
  if (!slots.includes(correctText)) {
    const overwriteAt = Math.floor(rng() * (visibleGameButtons - 1));
    slots[overwriteAt] = correctText;
  }
  return slots;
}
