/**
 * Pure precompute for Sudan: paginate tile + syllable lists.
 *
 * Java reference (Sudan.java + GameActivity.java):
 *   - cumulativeStageBasedTileList = tiles whose stageOfFirstAppearance <= stage,
 *     minus SILENT_PRELIMINARY_TILES (audio "zz_no_audio_needed" && type != "PC"),
 *     plus Start.SAD.
 *   - splitTileListAcrossPages then filters SAD AND SILENT_PLACEHOLDER_CONSONANTS
 *     (audio "zz_no_audio_needed" && type == "PC").
 *
 * Combined Sudan filter: drop tiles where
 *   typeOfThisTileInstance === 'SAD'
 *     OR audioForThisTileType === 'zz_no_audio_needed'.
 * Plus stage gating: stageOfFirstAppearance <= stage.
 *
 * Pages:
 *   - Tiles: 63 per page (Sudan.java tilesPerPage).
 *   - Syllables: 35 per page (Sudan.java syllablesPerPage).
 */

import type { LangAssets } from '@alphaTiles/data-language-assets';

export const TILE_PAGE_SIZE = 63;
export const SYLLABLE_PAGE_SIZE = 35;

const SILENT_AUDIO_NAME = 'zz_no_audio_needed';

export type SudanTile = {
  base: string;
  /** Resolved instance type for color switch — primary `type` column suffices for Sudan. */
  typeOfThisTileInstance: string;
  /** Audio key — primary `audioName` column. */
  audioForThisTileType: string;
};

export type SudanSyllable = {
  syllable: string;
  audioName: string;
  color: string;
  duration: number;
};

export type SudanData = {
  /** Pre-paginated tile list (63/page). */
  tilePages: SudanTile[][];
  /** Pre-paginated syllable list (35/page). */
  syllablePages: SudanSyllable[][];
};

/** Chunk an array into pages of `size`. Always returns at least one (possibly empty) page. */
function paginate<T>(items: readonly T[], size: number): T[][] {
  if (items.length === 0) return [[]];
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    pages.push(items.slice(i, i + size));
  }
  return pages;
}

export function buildSudanData(assets: LangAssets, stage = 7): SudanData {
  const tileRows = assets.tiles.rows;
  const syllableRows = assets.syllables.rows;

  // Stage gate + SAD/silent filter (matches GameActivity cumulative build + Sudan filter).
  const filteredTiles: SudanTile[] = tileRows
    .filter((row) => {
      if (row.stageOfFirstAppearance > stage) return false;
      if (row.type === 'SAD') return false;
      if (row.audioName === SILENT_AUDIO_NAME) return false;
      return true;
    })
    .map((row) => ({
      base: row.base,
      typeOfThisTileInstance: row.type,
      audioForThisTileType: row.audioName,
    }));

  const sudanSyllables: SudanSyllable[] = syllableRows.map((s) => ({
    syllable: s.syllable,
    audioName: s.audioName,
    color: s.color,
    duration: s.duration,
  }));

  return {
    tilePages: paginate(filteredTiles, TILE_PAGE_SIZE),
    syllablePages: paginate(sudanSyllables, SYLLABLE_PAGE_SIZE),
  };
}
