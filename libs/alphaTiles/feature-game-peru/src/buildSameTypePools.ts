/**
 * Build the per-type tile pools used by CL2 (V/C/T/AD).
 * Java pre-shuffles VOWELS/CONSONANTS/TONES at onCreate when challengeLevel == 2;
 * we shuffle at mount via `rng` for parity. AD is not shuffled in Java but inclusion
 * is harmless since selection is random anyway.
 *
 * 'PC' (placeholder consonants) are bucketed with C — Java's `CONSONANTS.contains(...)`
 * test is lenient on that distinction.
 */
import type { LangAssets } from '@alphaTiles/data-language-assets';
import type { SameTypePools } from './buildWrongCL2';

type Tile = LangAssets['tiles']['rows'][number];

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function buildSameTypePools(
  tiles: Tile[],
  rng: () => number = Math.random,
): SameTypePools {
  const V: Tile[] = [];
  const C: Tile[] = [];
  const T: Tile[] = [];
  const AD: Tile[] = [];
  for (const t of tiles) {
    if (t.type === 'V') V.push(t);
    else if (t.type === 'C' || t.type === 'PC') C.push(t);
    else if (t.type === 'T') T.push(t);
    else if (t.type === 'AD') AD.push(t);
  }
  return {
    V: shuffle(V, rng),
    C: shuffle(C, rng),
    T: shuffle(T, rng),
    AD: shuffle(AD, rng),
  };
}
