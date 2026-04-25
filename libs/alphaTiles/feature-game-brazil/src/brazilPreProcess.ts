/**
 * Precompute that buckets the pack's tiles into Brazil's choice pools.
 * Registered at module load so it runs during loadLangPack (boot time).
 *
 * Port of Brazil.java VOWELS / CONSONANTS / TONES / SYLLABLES / MULTITYPE_TILES
 * population in onCreate (~lines 100-150) — moved to boot to avoid per-round cost.
 */
import { registerPrecompute } from '@shared/util-precompute';
import type { LangAssets } from '@alphaTiles/data-language-assets';

type TileRow = LangAssets['tiles']['rows'][number];

export type BrazilData = {
  vowels: TileRow[];
  consonants: TileRow[];
  tones: TileRow[];
  syllables: string[];
  multitypeTiles: string[];
};

const VOWEL_TYPES = new Set(['LV', 'AV', 'BV', 'FV', 'V']);

export function brazilPreProcess(assets: LangAssets): BrazilData {
  const tileRows = assets.tiles.rows;

  const vowels: TileRow[] = [];
  const consonants: TileRow[] = [];
  const tones: TileRow[] = [];
  const multitypeTiles: string[] = [];

  for (const tile of tileRows) {
    if (VOWEL_TYPES.has(tile.type)) vowels.push(tile);
    else if (tile.type === 'C') consonants.push(tile);
    else if (tile.type === 'T') tones.push(tile);
    if (tile.tileTypeB !== 'none') multitypeTiles.push(tile.base);
  }

  const syllables = assets.syllables.rows.map((s) => s.syllable);

  return { vowels, consonants, tones, syllables, multitypeTiles };
}

registerPrecompute('brazil', brazilPreProcess);
