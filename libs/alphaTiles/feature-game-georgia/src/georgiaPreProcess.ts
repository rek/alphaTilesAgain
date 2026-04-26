/**
 * Precompute that buckets the pack's tiles into Georgia's CorV pool.
 * Java reference: Start.java ~CorV initialization — Georgia uses tiles whose
 * `type` is 'C' or 'V' (consonant or vowel).
 */
import type { LangAssets } from '@alphaTiles/data-language-assets';

type TileRow = LangAssets['tiles']['rows'][number];

export type GeorgiaData = {
  corV: TileRow[];
};

export function georgiaPreProcess(assets: LangAssets): GeorgiaData {
  const corV = assets.tiles.rows.filter(
    (t) => t.type === 'C' || t.type === 'V',
  );
  return { corV };
}
