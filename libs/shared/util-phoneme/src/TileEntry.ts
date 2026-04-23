/**
 * Minimal tile shape needed by the phoneme parser.
 * Matches the subset of ParsedGametiles row fields used by parseWordIntoTiles.
 */
export interface TileEntry {
  base: string;
  alt1: string;
  alt2: string;
  alt3: string;
  type: string;
  tileTypeB: string;
  tileTypeC: string;
  stageOfFirstAppearance: number;
  stageOfFirstAppearanceType2: number;
  stageOfFirstAppearanceType3: number;
  audioName: string;
  audioNameB: string;
  audioNameC: string;
}

/** A parsed tile instance — includes resolved type for this usage context. */
export interface ParsedTile {
  base: string;
  typeOfThisTileInstance: string;
  stageOfFirstAppearanceForThisTileType: number;
  audioForThisTileType: string;
  tileType: string;
  tileTypeB: string;
  tileTypeC: string;
}
