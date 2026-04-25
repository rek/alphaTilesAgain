/**
 * Precompute that buckets the pack's word list by tile length for the United States game.
 * Registered at module load so it runs during loadLangPack (boot time).
 *
 * Port of UnitedStates.java:70–88 onCreate — word length filtering moved to boot time.
 */
import { registerPrecompute } from '@shared/util-precompute';
import {
  parseWordIntoTilesPreliminary,
  buildTileHashMap,
  getMultitypeTiles,
} from '@shared/util-phoneme';
import type { LangAssets } from '@alphaTiles/data-language-assets';

export type UnitedStatesData = {
  /** Words with 2–5 tiles (level 1). */
  level1Words: LangAssets['words']['rows'];
  /** Words with 2–7 tiles (level 2). */
  level2Words: LangAssets['words']['rows'];
  /** Words with 2–9 tiles (level 3). */
  level3Words: LangAssets['words']['rows'];
};

export function buildUnitedStatesData(assets: LangAssets): UnitedStatesData {
  const tileRows = assets.tiles.rows;
  const placeholderCharacter = assets.langInfo.find('Placeholder character') ?? '◌';

  const tileMap = buildTileHashMap(tileRows, placeholderCharacter);
  const multitypeTiles = getMultitypeTiles(tileRows);

  const level1Words: LangAssets['words']['rows'] = [];
  const level2Words: LangAssets['words']['rows'] = [];
  const level3Words: LangAssets['words']['rows'] = [];

  for (const word of assets.words.rows) {
    const parsed = parseWordIntoTilesPreliminary(
      word.wordInLOP,
      word.mixedDefs,
      tileMap,
      multitypeTiles,
      placeholderCharacter,
    );
    if (parsed === null) continue;
    const len = parsed.length;
    if (len >= 2 && len <= 9) level3Words.push(word);
    if (len >= 2 && len <= 7) level2Words.push(word);
    if (len >= 2 && len <= 5) level1Words.push(word);
  }

  if (level1Words.length === 0) {
    console.warn('[feature-game-united-states] no words with 2–5 tiles for level 1');
  }

  return { level1Words, level2Words, level3Words };
}

registerPrecompute('united-states', buildUnitedStatesData);
