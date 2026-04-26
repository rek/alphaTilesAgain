import type { LangAssets } from '@alphaTiles/data-language-assets';

type TileRow = LangAssets['tiles']['rows'][number];
type WordRow = LangAssets['words']['rows'][number];

const SILENT_AUDIO = 'zz_no_audio_needed';

/**
 * Greedy longest-match tokeniser over a wordInLOP, returning the parsed
 * tile sequence as TileRows.
 *
 * Java reference: `TileList.parseWordIntoTiles` (Thailand uses simple form,
 * not the complex Thai/Lao/Khmer combiner — Roman fixtures only need this).
 */
function parseTiles(wordInLOP: string, tiles: TileRow[]): TileRow[] {
  const norm = wordInLOP.replace(/[#.]/g, '');
  const sorted = [...tiles].sort((a, b) => b.base.length - a.base.length);
  const out: TileRow[] = [];
  let i = 0;
  while (i < norm.length) {
    let matched: TileRow | null = null;
    for (const t of sorted) {
      if (t.base.length > 0 && norm.startsWith(t.base, i)) {
        matched = t;
        break;
      }
    }
    if (!matched) {
      i++;
      continue;
    }
    out.push(matched);
    i += matched.base.length;
  }
  return out;
}

/**
 * Java parity: `Thailand.firstAudibleTile(Word)` (lines 633-646).
 *
 * Walks the parsed-tile sequence and returns the first tile whose audio is
 * not the `zz_no_audio_needed` sentinel. Tiles with that sentinel are silent
 * structural pieces (placeholder consonants / diacritics) that the matching
 * logic must skip past.
 *
 * Falls back to the first parsed tile if all are silent (defensive).
 */
export function firstAudibleTile(wordRow: WordRow, tiles: TileRow[]): TileRow | null {
  const parsed = parseTiles(wordRow.wordInLOP, tiles);
  if (parsed.length === 0) return null;
  for (const t of parsed) {
    if (t.audioName !== SILENT_AUDIO) return t;
  }
  return parsed[0];
}
