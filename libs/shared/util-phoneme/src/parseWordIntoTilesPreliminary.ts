/**
 * Preliminary tile parsing — port of TileList.parseWordIntoTilesPreliminary from Validator.java.
 *
 * Java reference: Validator.java ~line 3136.
 *
 * Tries to match the longest tile prefix from the word string (up to 4 chars),
 * handling placeholder-wrapped complex-script tiles. Returns null if any character
 * in the word cannot be matched to a tile (excluding '.' and '#').
 *
 * This is the "simple" parse — for complex scripts (Thai, Lao, Arabic, etc.)
 * the full parse in parseWordIntoTiles does additional combination.
 *
 * @returns Array of ParsedTile objects, or null if the word cannot be parsed.
 */

import type { TileEntry, ParsedTile } from './TileEntry';

/** Tiles that have a non-'none' tileTypeB — need special type resolution. */
function getMultitypeTiles(tiles: TileEntry[]): Set<string> {
  const set = new Set<string>();
  for (const t of tiles) {
    if (t.tileTypeB !== 'none') set.add(t.base);
  }
  return set;
}

/**
 * Resolve tile instance type from mixedDefs string for a multi-type tile.
 * Port of TileList.getInstanceTypeForMixedTilePreliminary.
 *
 * For the validator's purposes, we use a simplified version that handles the
 * most common cases. Full resolution requires the word context.
 */
function resolveMultitypeInstance(
  tile: TileEntry,
  mixedDefs: string,
  _tileIndexInWord: number,
  _totalTilesInWord: number,
): { type: string; stage: number; audio: string } {
  const simpleTypes = ['C', 'PC', 'V', 'X', 'T', '-', 'SAD', 'LV', 'AV', 'BV', 'FV', 'D', 'AD'];

  // If mixedDefs is one of the simple types, use it directly
  if (simpleTypes.includes(mixedDefs)) {
    const type = mixedDefs;
    if (type === tile.tileTypeB) {
      return { type, stage: tile.stageOfFirstAppearanceType2, audio: tile.audioNameB };
    } else if (type === tile.tileTypeC) {
      return { type, stage: tile.stageOfFirstAppearanceType3, audio: tile.audioNameC };
    }
    return { type: tile.type, stage: tile.stageOfFirstAppearance, audio: tile.audioName };
  }

  // Mixed defs with numeric/type positions — use primary type as fallback for validation
  return { type: tile.type, stage: tile.stageOfFirstAppearance, audio: tile.audioName };
}

export function parseWordIntoTilesPreliminary(
  wordInLOP: string,
  mixedDefs: string,
  tileMap: Map<string, TileEntry>,
  multitypeTiles: Set<string>,
  placeholderCharacter: string,
): ParsedTile[] | null {
  const preliminary: TileEntry[] = [];

  let i = 0;
  while (i < wordInLOP.length) {
    const ch1 = wordInLOP.substring(i, i + 1);
    const ch2 = i < wordInLOP.length - 1 ? wordInLOP.substring(i, i + 2) : 'XYZXYZ';
    const ch3 = i < wordInLOP.length - 2 ? wordInLOP.substring(i, i + 3) : 'XYZXYZ';
    const ch4 = i < wordInLOP.length - 3 ? wordInLOP.substring(i, i + 4) : 'XYZXYZ';

    const p = placeholderCharacter;

    // Try longest match first (4 chars → 1 char)
    let charBlockLength = 0;
    if (tileMap.has(ch1) || tileMap.has(p + ch1) || tileMap.has(ch1 + p) || tileMap.has(p + ch1 + p)) charBlockLength = 1;
    if (tileMap.has(ch2) || tileMap.has(p + ch2) || tileMap.has(ch2 + p) || tileMap.has(p + ch2 + p)) charBlockLength = 2;
    if (tileMap.has(ch3) || tileMap.has(p + ch3) || tileMap.has(ch3 + p) || tileMap.has(p + ch3 + p)) charBlockLength = 3;
    if (tileMap.has(ch4) || tileMap.has(p + ch4) || tileMap.has(ch4 + p) || tileMap.has(p + ch4 + p)) charBlockLength = 4;

    let tileKey = '';
    switch (charBlockLength) {
      case 1: {
        const raw = ch1;
        if (tileMap.has(raw)) tileKey = raw;
        else if (tileMap.has(p + raw)) tileKey = p + raw;
        else if (tileMap.has(raw + p)) tileKey = raw + p;
        else if (tileMap.has(p + raw + p)) tileKey = p + raw + p;
        i += 1;
        break;
      }
      case 2: {
        const raw = ch2;
        if (tileMap.has(raw)) tileKey = raw;
        else if (tileMap.has(p + raw)) tileKey = p + raw;
        else if (tileMap.has(raw + p)) tileKey = raw + p;
        else if (tileMap.has(p + raw + p)) tileKey = p + raw + p;
        i += 2;
        break;
      }
      case 3: {
        const raw = ch3;
        if (tileMap.has(raw)) tileKey = raw;
        else if (tileMap.has(p + raw)) tileKey = p + raw;
        else if (tileMap.has(raw + p)) tileKey = raw + p;
        else if (tileMap.has(p + raw + p)) tileKey = p + raw + p;
        i += 3;
        break;
      }
      case 4: {
        const raw = ch4;
        if (tileMap.has(raw)) tileKey = raw;
        else if (tileMap.has(p + raw)) tileKey = p + raw;
        else if (tileMap.has(raw + p)) tileKey = raw + p;
        else if (tileMap.has(p + raw + p)) tileKey = p + raw + p;
        i += 4;
        break;
      }
      default:
        // Character not matched — skip '.' and '#' (syllable/tone markers), fail otherwise
        if (ch1 !== '.' && ch1 !== '#') {
          return null;
        }
        i += 1;
        continue;
    }

    if (tileKey !== '') {
      const tile = tileMap.get(tileKey);
      if (tile) preliminary.push(tile);
    }
  }

  // Resolve multitype instances
  const result: ParsedTile[] = [];
  for (let idx = 0; idx < preliminary.length; idx++) {
    const tile = preliminary[idx];
    if (multitypeTiles.has(tile.base)) {
      const resolved = resolveMultitypeInstance(tile, mixedDefs, idx, preliminary.length);
      result.push({
        base: tile.base,
        typeOfThisTileInstance: resolved.type,
        stageOfFirstAppearanceForThisTileType: resolved.stage,
        audioForThisTileType: resolved.audio,
        tileType: tile.type,
        tileTypeB: tile.tileTypeB,
        tileTypeC: tile.tileTypeC,
      });
    } else {
      result.push({
        base: tile.base,
        typeOfThisTileInstance: tile.type,
        stageOfFirstAppearanceForThisTileType: tile.stageOfFirstAppearance,
        audioForThisTileType: tile.audioName,
        tileType: tile.type,
        tileTypeB: tile.tileTypeB,
        tileTypeC: tile.tileTypeC,
      });
    }
  }

  return result;
}

export { getMultitypeTiles };
