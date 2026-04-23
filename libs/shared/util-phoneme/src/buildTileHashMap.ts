import type { TileEntry } from './TileEntry';

/**
 * Build a map from tile base string → TileEntry.
 * For complex scripts with placeholder characters, also adds placeholder-wrapped keys.
 *
 * Java reference: Validator.java TileHashMap — keyed by tile text.
 */
export function buildTileHashMap(
  tiles: TileEntry[],
  placeholderCharacter: string,
): Map<string, TileEntry> {
  const map = new Map<string, TileEntry>();
  for (const tile of tiles) {
    map.set(tile.base, tile);
    // Also register placeholder-wrapped variants for complex-script matching
    if (placeholderCharacter && placeholderCharacter !== '') {
      if (!map.has(placeholderCharacter + tile.base)) {
        map.set(placeholderCharacter + tile.base, tile);
      }
      if (!map.has(tile.base + placeholderCharacter)) {
        map.set(tile.base + placeholderCharacter, tile);
      }
      if (!map.has(placeholderCharacter + tile.base + placeholderCharacter)) {
        map.set(placeholderCharacter + tile.base + placeholderCharacter, tile);
      }
    }
  }
  return map;
}
