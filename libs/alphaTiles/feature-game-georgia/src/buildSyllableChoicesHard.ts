/**
 * Hard syllable-choice branch (S-CL 4, 5, 6).
 *
 * Java reference: Georgia.java ~204–235.
 *
 * Two-pass insertion-ordered Set fill:
 *   - Pass A (sequential over syllablePool): if both lengths >= 2, prefer
 *     same first+second char, else same first char. If either length < 2,
 *     prefer same first char, else same last char. Bounded by
 *     `syllablePool.length`.
 *   - Pass B: pure-random fill, sequentially indexing `syllablePool[j++]`
 *     (Java does NOT use `nextInt` here — index advances in order).
 */
import type { LangAssets } from '@alphaTiles/data-language-assets';

type SyllableRow = LangAssets['syllables']['rows'][number];

export function buildSyllableChoicesHard({
  visibleGameButtons,
  syllablePool,
  correctText,
  distractors,
}: {
  visibleGameButtons: number;
  syllablePool: SyllableRow[];
  correctText: string;
  distractors: [string, string, string];
}): string[] {
  const N = visibleGameButtons;
  const set = new Set<string>();
  set.add(correctText);
  for (const d of distractors) {
    if (d) set.add(d);
  }

  // Pass A: sequential scan over syllablePool with same-prefix preference.
  let i = 0;
  while (set.size < N && i < syllablePool.length) {
    const opt = syllablePool[i].syllable;
    if (opt.length >= 2 && correctText.length >= 2) {
      if (opt[0] === correctText[0] && opt[1] === correctText[1]) {
        set.add(opt);
      } else if (opt[0] === correctText[0]) {
        set.add(opt);
      }
    } else {
      if (opt.length > 0 && correctText.length > 0 && opt[0] === correctText[0]) {
        set.add(opt);
      } else if (
        opt.length > 0 &&
        correctText.length > 0 &&
        opt[opt.length - 1] === correctText[correctText.length - 1]
      ) {
        set.add(opt);
      }
    }
    i++;
  }

  // Pass B: pure-random fill — Java uses sequential indexing, not nextInt.
  let j = 0;
  while (set.size < N && j < syllablePool.length) {
    set.add(syllablePool[j].syllable);
    j++;
  }

  return [...set];
}
