/**
 * Port of Peru.java:177–204.
 * CL3: pick a random tile index `i = floor(rng() * (len - 1))` (same off-by-one as CL2);
 * replace `parsed[i]` with a random tile drawn from `parsed[i]`'s distractor trio
 * (`alt1/alt2/alt3` of the corresponding tile row).
 */
import type { LangAssets } from '@alphaTiles/data-language-assets';
import type { ParsedTile, ScriptType, TileEntry } from '@shared/util-phoneme';
import { combineTilesToMakeWord } from '@shared/util-phoneme';
import { containsForbidden } from './containsForbidden';

type Tile = LangAssets['tiles']['rows'][number];

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

function trioFor(base: string, tileMap: Map<string, TileEntry>): TileEntry[] {
  const row = tileMap.get(base);
  if (!row) return [];
  const trio: TileEntry[] = [];
  for (const alt of [row.alt1, row.alt2, row.alt3]) {
    if (!alt) continue;
    const entry = tileMap.get(alt);
    if (entry) trio.push(entry);
  }
  return trio;
}

export function buildWrongCL3({
  parsed,
  tileMap,
  prior,
  correct,
  wordInLOP,
  scriptType,
  rng = Math.random,
  maxIters = 200,
}: {
  parsed: ParsedTile[];
  tileMap: Map<string, TileEntry>;
  prior: string[];
  correct: string;
  wordInLOP: string;
  scriptType: ScriptType;
  rng?: () => number;
  maxIters?: number;
}): string | null {
  const span = parsed.length - 1;
  if (span <= 0) return null;

  for (let guard = 0; guard < maxIters; guard++) {
    const idx = Math.floor(rng() * span);
    const target = parsed[idx];
    const trio = trioFor(target.base, tileMap);
    if (trio.length === 0) continue;
    const replacement = trio[Math.floor(rng() * trio.length)] as Tile;
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
