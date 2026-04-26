/**
 * Random tile-choice branch (T-CL 1, 2, 3, 7, 8, 9).
 *
 * Java reference: Georgia.java ~351–373, ~391–395.
 *
 * Per visible slot, draws `floor(rng() * corV.length)` (NO off-by-one) and
 * rejects duplicates by re-drawing. After the loop, if `correctText` is not
 * present, overwrites `GAME_BUTTONS[floor(rng() * (visibleGameButtons - 1))]`
 * (last visible slot is never the fallback target — Java preserves this).
 *
 * Returns exactly `visibleGameButtons` slot strings in insertion order.
 */
import type { LangAssets } from '@alphaTiles/data-language-assets';

type TileRow = LangAssets['tiles']['rows'][number];

const MAX_REDRAWS = 1000;

export function buildTileChoicesRandom({
  visibleGameButtons,
  corV,
  correctText,
  rng,
}: {
  visibleGameButtons: number;
  corV: TileRow[];
  correctText: string;
  rng: () => number;
}): string[] {
  const slots: string[] = [];
  const seen = new Set<string>();
  for (let t = 0; t < visibleGameButtons; t++) {
    let randomNum = Math.floor(rng() * corV.length);
    let text = corV[randomNum]?.base ?? '';
    let probe = 0;
    while (seen.has(text) && probe < MAX_REDRAWS) {
      randomNum = Math.floor(rng() * corV.length);
      text = corV[randomNum]?.base ?? '';
      probe++;
    }
    seen.add(text);
    slots.push(text);
  }

  if (!seen.has(correctText)) {
    // Java preserves: nextInt(visibleGameButtons - 1). Last visible slot is
    // never the overwrite target.
    const overwriteAt = Math.floor(rng() * (visibleGameButtons - 1));
    slots[overwriteAt] = correctText;
  }
  return slots;
}
