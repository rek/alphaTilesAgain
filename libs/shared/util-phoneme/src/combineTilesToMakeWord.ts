import type { ParsedTile } from './TileEntry';
import type { ScriptType } from './parseWordIntoTiles';
import { getParser } from './scriptRegistry';

export function combineTilesToMakeWord(
  tiles: ParsedTile[],
  wordInLOP: string,
  indexOfReplacedTile: number,
  scriptType: ScriptType | string = 'default',
): string {
  return getParser(scriptType).combine(tiles, wordInLOP, indexOfReplacedTile);
}
