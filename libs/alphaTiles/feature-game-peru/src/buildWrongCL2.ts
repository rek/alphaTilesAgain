/**
 * Port of Peru.java:146–175.
 * CL2: pick a random tile index `i = floor(rng() * (len - 1))` (Java `nextInt(len-1)`,
 * which excludes the last tile — preserved for parity); replace `parsed[i]` with another
 * random tile from the SAME-TYPE pool (V/C/T/AD) (the pre-shuffled per-type arrays).
 *
 * Loops until the candidate is non-forbidden, distinct from the correct text and from
 * any previously-built wrong; returns null after `maxIters` (degenerate language pack).
 */
import type { LangAssets } from '@alphaTiles/data-language-assets';
import type { ParsedTile, ScriptType } from '@shared/util-phoneme';
import { combineTilesToMakeWord } from '@shared/util-phoneme';
import { containsForbidden } from './containsForbidden';

type Tile = LangAssets['tiles']['rows'][number];

export type SameTypePools = {
  V: Tile[];
  C: Tile[];
  T: Tile[];
  AD: Tile[];
};

function toParsedTile(entry: Tile, instanceType: string): ParsedTile {
  return {
    base: entry.base,
    typeOfThisTileInstance: instanceType,
    stageOfFirstAppearanceForThisTileType: entry.stageOfFirstAppearance,
    audioForThisTileType: entry.audioName,
    tileType: entry.type,
    tileTypeB: entry.tileTypeB,
    tileTypeC: entry.tileTypeC,
  };
}

function poolFor(type: string, pools: SameTypePools): Tile[] {
  // Java order: VOWELS → CONSONANTS → TONES → ADs (Peru.java:154–166).
  if (type === 'V') return pools.V;
  if (type === 'C' || type === 'PC') return pools.C;
  if (type === 'T') return pools.T;
  if (type === 'AD') return pools.AD;
  return [];
}

export function buildWrongCL2({
  parsed,
  pools,
  prior,
  correct,
  wordInLOP,
  scriptType,
  rng = Math.random,
  maxIters = 200,
}: {
  parsed: ParsedTile[];
  pools: SameTypePools;
  prior: string[];
  correct: string;
  wordInLOP: string;
  scriptType: ScriptType;
  rng?: () => number;
  maxIters?: number;
}): string | null {
  const span = parsed.length - 1; // Java nextInt(tileLength - 1) — excludes last tile
  if (span <= 0) return null;

  for (let guard = 0; guard < maxIters; guard++) {
    const idx = Math.floor(rng() * span);
    const target = parsed[idx];
    const pool = poolFor(target.typeOfThisTileInstance, pools);
    if (pool.length === 0) continue;
    const replacement = pool[Math.floor(rng() * pool.length)];
    if (replacement.base === target.base) continue;
    const tiles = [...parsed];
    tiles[idx] = toParsedTile(replacement, target.typeOfThisTileInstance);
    const text = combineTilesToMakeWord(tiles, wordInLOP, idx, scriptType);
    if (containsForbidden(text)) continue;
    if (text === correct) continue;
    if (prior.includes(text)) continue;
    return text;
  }
  return null;
}
