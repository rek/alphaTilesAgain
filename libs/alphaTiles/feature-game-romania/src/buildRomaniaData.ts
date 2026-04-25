import { registerPrecompute } from '@shared/util-precompute';
import {
  parseWordIntoTilesPreliminary,
  buildTileHashMap,
  getMultitypeTiles,
} from '@shared/util-phoneme';
import type { LangAssets } from '@alphaTiles/data-language-assets';

export type RomaniaData = Record<string, LangAssets['words']['rows']>;

export function buildRomaniaData(assets: LangAssets): RomaniaData {
  const tileRows = assets.tiles.rows;
  const placeholderCharacter = assets.langInfo.find('Placeholder character') ?? '◌';
  const tileMap = buildTileHashMap(tileRows, placeholderCharacter);
  const multitypeTiles = getMultitypeTiles(tileRows);

  const result: RomaniaData = {};

  for (const word of assets.words.rows) {
    const parsed = parseWordIntoTilesPreliminary(
      word.wordInLOP,
      word.mixedDefs,
      tileMap,
      multitypeTiles,
      placeholderCharacter,
    );
    if (parsed === null) continue;

    const seenTiles = new Set<string>();
    for (const tile of parsed) {
      if (!seenTiles.has(tile.base)) {
        seenTiles.add(tile.base);
        if (!result[tile.base]) result[tile.base] = [];
        result[tile.base].push(word);
      }
    }
  }

  return result;
}

registerPrecompute('romania', buildRomaniaData);
