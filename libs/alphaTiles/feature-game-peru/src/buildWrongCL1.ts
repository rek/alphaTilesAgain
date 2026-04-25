/**
 * Port of Peru.java:127–143.
 * CL1: replace tile[0] with the i-th entry of the SHUFFLED distractor trio
 * of tile[0] (`alt1/alt2/alt3` columns of the corresponding tile row).
 * Java assigns one trio entry per wrong slot (`shuffledDistractorTiles.get(incorrectLapNo - 1)`)
 * so the 3 wrongs are derived from the 3 trio entries directly — no random index draws.
 */
import type { LangAssets } from '@alphaTiles/data-language-assets';
import type { ParsedTile, ScriptType, TileEntry } from '@shared/util-phoneme';
import { combineTilesToMakeWord } from '@shared/util-phoneme';

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

export function buildWrongCL1({
  parsed,
  tileMap,
  trioShuffled,
  slotIndex,
  wordInLOP,
  scriptType,
}: {
  parsed: ParsedTile[];
  tileMap: Map<string, TileEntry>;
  /** Shuffled trio of tile[0]'s distractors as TileEntry rows. Length 3 in nominal case. */
  trioShuffled: Tile[];
  slotIndex: 0 | 1 | 2;
  wordInLOP: string;
  scriptType: ScriptType;
}): string | null {
  void tileMap;
  if (trioShuffled.length === 0) return null;
  const replacement = trioShuffled[slotIndex] ?? trioShuffled[slotIndex % trioShuffled.length];
  const tiles = [...parsed];
  tiles[0] = toParsedTile(replacement, parsed[0].typeOfThisTileInstance);
  return combineTilesToMakeWord(tiles, wordInLOP, 0, scriptType);
}
