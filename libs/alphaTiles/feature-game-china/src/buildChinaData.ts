/**
 * Precompute that buckets the pack's word list into 3-tile and 4-tile sets.
 * Port of China.java:161–177 preprocessWords — moved to boot to avoid per-game cost.
 */
import {
  parseWordIntoTilesPreliminary,
  buildTileHashMap,
  getMultitypeTiles,
} from '@shared/util-phoneme';
import type { LangAssets } from '@alphaTiles/data-language-assets';

export type ChinaData = {
  threeTileWords: LangAssets['words']['rows'];
  fourTileWords: LangAssets['words']['rows'];
};

export function buildChinaData(assets: LangAssets): ChinaData {
  const tileRows = assets.tiles.rows;
  const placeholderCharacter = assets.langInfo.find('Placeholder character') ?? '◌';

  const tileMap = buildTileHashMap(tileRows, placeholderCharacter);
  const multitypeTiles = getMultitypeTiles(tileRows);

  const threeTileWords: LangAssets['words']['rows'] = [];
  const fourTileWords: LangAssets['words']['rows'] = [];

  for (const word of assets.words.rows) {
    const parsed = parseWordIntoTilesPreliminary(
      word.wordInLOP,
      word.mixedDefs,
      tileMap,
      multitypeTiles,
      placeholderCharacter,
    );
    if (parsed === null) continue;
    if (parsed.length === 3) threeTileWords.push(word);
    else if (parsed.length === 4) fourTileWords.push(word);
  }

  if (threeTileWords.length === 0 || fourTileWords.length < 3) {
    console.warn('[feature-game-china] insufficient 3-tile or 4-tile words for China game');
  }

  return { threeTileWords, fourTileWords };
}
