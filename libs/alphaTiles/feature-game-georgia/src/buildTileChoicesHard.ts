/**
 * Hard tile-choice branch (T-CL 4, 5, 6, 10, 11, 12).
 *
 * Java reference: Georgia.java ~294–339.
 *
 * Three-pass insertion-ordered Set fill:
 *   - Pass A: same first AND second char (only if both lengths >= 2).
 *   - Pass B: same first char OR same last char.
 *   - Pass C: pure-random fill.
 *
 * All three passes use `floor(rng() * (corV.length - 1))` — Java's
 * `nextInt(CorV.size() - 1)` off-by-one. Last entry of corV is never picked.
 *
 * Returns up to `N` strings; if `corV` is too small to reach N (rare),
 * may return fewer.
 */
import type { LangAssets } from '@alphaTiles/data-language-assets';

type TileRow = LangAssets['tiles']['rows'][number];

export function buildTileChoicesHard({
  visibleGameButtons,
  corV,
  correctText,
  distractors,
  rng,
}: {
  visibleGameButtons: number;
  corV: TileRow[];
  correctText: string;
  distractors: [string, string, string];
  rng: () => number;
}): string[] {
  const N = visibleGameButtons;
  const set = new Set<string>();
  set.add(correctText);
  for (const d of distractors) {
    if (d) set.add(d);
  }

  // Java off-by-one: `nextInt(CorV.size() - 1)` — preserved for parity.
  const pick = (): string => {
    if (corV.length <= 1) return corV[0]?.base ?? '';
    const idx = Math.floor(rng() * (corV.length - 1));
    return corV[idx]?.base ?? '';
  };

  // Pass A: same first AND second char, both lengths >= 2.
  let i = 0;
  while (set.size < N && i < corV.length) {
    const opt = pick();
    if (
      opt.length >= 2 &&
      correctText.length >= 2 &&
      opt[0] === correctText[0] &&
      opt[1] === correctText[1]
    ) {
      set.add(opt);
    }
    i++;
  }

  // Pass B: same first char OR same last char.
  i = 0;
  while (set.size < N && i < corV.length) {
    const opt = pick();
    if (opt.length === 0) {
      i++;
      continue;
    }
    if (opt[0] === correctText[0]) {
      set.add(opt);
    } else if (
      correctText.length > 0 &&
      opt[opt.length - 1] === correctText[correctText.length - 1]
    ) {
      set.add(opt);
    }
    i++;
  }

  // Pass C: pure random fill.
  let safety = corV.length * 4 + 32;
  while (set.size < N && safety-- > 0) {
    set.add(pick());
  }

  return [...set];
}
